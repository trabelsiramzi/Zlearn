#!/usr/bin/env python3
"""Extract the existing subject pages into content/ without rewriting lesson HTML."""
import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUBJECT_IDS = ["fiqh", "aqida", "tajwid", "sira", "hadith", "akhlaq", "nahw"]
PREFIXES = {"fiqh": "fq", "aqida": "aq", "tajwid": "tj", "sira": "sr", "hadith": "hd", "akhlaq": "ak", "nahw": "nh"}


def blocks_with_class(source, tag_name, class_name):
    """Return [start, end, opening tag] for matching balanced HTML elements."""
    token_re = re.compile(r"<!--[\s\S]*?-->|<![^>]*>|</?[A-Za-z][^>]*>")
    found = []
    stack = []
    void = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
    for match in token_re.finditer(source):
        token = match.group(0)
        if token.startswith("<!--") or token.startswith("<!"):
            continue
        closing = token.startswith("</")
        name_match = re.match(r"</?([A-Za-z][\w:-]*)", token)
        if not name_match:
            continue
        name = name_match.group(1).lower()
        if closing:
            idx = next((i for i in range(len(stack)-1, -1, -1) if stack[i]["name"] == name), None)
            if idx is None:
                continue
            removed = stack[idx:]
            del stack[idx:]
            for entry in removed:
                if entry.get("target") and entry["name"] == name:
                    found.append((entry["start"], match.end(), entry["opening"]))
                    break
        elif name not in void and not token.endswith("/>"):
            attrs = dict((m.group(1).lower(), m.group(2) or m.group(3) or m.group(4) or "") for m in re.finditer(r'([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?', token))
            classes = attrs.get("class", "").split()
            stack.append({"name": name, "start": match.start(), "opening": token,
                          "target": name == tag_name and class_name in classes})
    return sorted(found)


class MetadataParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.lesson = None
        self.stack = []
        self.capture_title = 0
        self.title_parts = []
        self.capture_section_heading = 0
        self.section_heading_parts = []
        self.sections = []
        self.data_keys = []
        self.checks = 0
        self.questions = []
        self.detail = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = a.get("class", "").split()
        if tag == "div" and "lesson" in classes and self.lesson is None:
            self.lesson = {"id": a.get("id"), "number": int(a.get("data-lesson", "0")), "title": ""}
        if self.lesson is not None:
            if tag == "section" and a.get("id"):
                self.sections.append({"id": a["id"], "heading": ""})
                self.capture_section_heading = 0
            if a.get("data-key") is not None:
                self.data_keys.append(a["data-key"])
            if tag == "input" and a.get("type") == "checkbox":
                self.checks += 1
            in_quiz = any(x.get("id", "").endswith("quiz") for x in self.stack)
            if tag == "details" and in_quiz:
                self.detail = {"prompt": [], "answer": [], "part": "prompt", "summary_depth": 0}
            if self.detail is not None and tag == "summary":
                self.detail["summary_depth"] += 1
            elif self.detail is not None and tag == "p" and "ans" in classes:
                self.detail["part"] = "answer"
            if tag == "h2" and any("part-head" in x.get("class", "").split() for x in self.stack):
                self.capture_title = 1
                self.title_parts = []
            elif tag == "h2" and self.sections:
                self.capture_section_heading = 1
                self.section_heading_parts = []
        self.stack.append({"tag": tag, "id": a.get("id", ""), "class": a.get("class", "")})

    def handle_endtag(self, tag):
        if self.lesson is None:
            return
        if tag == "h2" and self.capture_title:
            self.lesson["title"] = "".join(self.title_parts).strip()
            self.capture_title = 0
        if tag == "h2" and self.capture_section_heading and self.sections:
            self.sections[-1]["heading"] = "".join(self.section_heading_parts).strip()
            self.capture_section_heading = 0
        if self.detail is not None:
            if tag == "summary" and self.detail["summary_depth"]:
                self.detail["summary_depth"] -= 1
                self.detail["part"] = "answer"
            if tag == "details":
                prompt = re.sub(r"\s+", " ", "".join(self.detail["prompt"])).strip()
                answer = re.sub(r"\s+", " ", "".join(self.detail["answer"])).strip()
                if prompt:
                    self.questions.append((prompt, answer))
                self.detail = None
        idx = next((i for i in range(len(self.stack)-1, -1, -1) if self.stack[i]["tag"] == tag), None)
        if idx is not None:
            popped = self.stack[idx:]
            del self.stack[idx:]
            if any(x["tag"] == "div" and "lesson" in x["class"].split() for x in popped):
                pass

    def handle_data(self, data):
        if self.capture_title:
            self.title_parts.append(data)
        if self.capture_section_heading:
            self.section_heading_parts.append(data)
        if self.detail is not None:
            self.detail[self.detail["part"]].append(data)


def js_manifest():
    text = (ROOT / "assets/site.js").read_text(encoding="utf-8")
    m = re.search(r"var ZLEARN_MATIERES = \[(.*?)\n\];", text, re.S)
    if not m:
        raise SystemExit("ZLEARN_MATIERES introuvable")
    rows = []
    for line in m.group(1).splitlines():
        line = line.strip().rstrip(",")
        if not line:
            continue
        values = re.findall(r'([\w]+):\s*"([^"]*)"|([\w]+):\s*(\d+)', line)
        row = {}
        for a, b, c, d in values:
            row[a or c] = b if a else int(d)
        if row:
            rows.append(row)
    return rows


def cards_from_home():
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    out = {}
    for start, end, opening in blocks_with_class(home, "article", "card"):
        frag = home[start:end]
        m = re.search(r'data-matiere-card="([^"]+)"', opening)
        if not m:
            continue
        sid = m.group(1)
        tag = re.search(r'<p class="tag">(.*?)</p>', frag, re.S).group(1)
        title = re.search(r'<h3><a[^>]*>(.*?)</a></h3>', frag, re.S).group(1)
        book = re.search(r'<p class="book">(.*?)</p>', frag, re.S).group(1)
        lessons = []
        for link in re.finditer(r'<li><a href="[^"]*#([^"]+)" data-lesson="([^"]+)">(.*?)</a></li>', frag, re.S):
            lessons.append({"lessonId": link.group(1), "number": int(link.group(2)), "label": link.group(3)})
        out[sid] = {"tag": tag, "title": title, "book": book, "cardClass": opening, "homeLessons": lessons}
    return out


def main():
    manifest = js_manifest()
    search_source = (ROOT / "assets/search-index.js").read_text(encoding="utf-8")
    search_json = re.search(r"var ZLEARN_SEARCH_SECTIONS = ([\s\S]*);\s*$", search_source)
    legacy_search = json.loads(search_json.group(1)) if search_json else []
    search_order = {(x["sub"], x["lessonId"], x["id"]): (i, x["section"]) for i, x in enumerate(legacy_search)}
    cards = cards_from_home()
    subjects = []
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    card_wrap = blocks_with_class(home, "div", "cards")[0]
    home_template = home[:card_wrap[0]] + "<!-- GENERATED_CARDS -->" + home[card_wrap[1]:]
    home_template = home_template.replace("21", "<!-- GENERATED_LESSON_TOTAL -->")
    for sid in SUBJECT_IDS:
        page_path = ROOT / sid / "index.html"
        page = page_path.read_text(encoding="utf-8")
        lesson_blocks = blocks_with_class(page, "div", "lesson")
        if len(lesson_blocks) != 3:
            raise SystemExit("3 leçons attendues dans " + sid)
        subject_manifest = next(x for x in manifest if x.get("id") == sid)
        subject_card = cards[sid]
        subject_row = dict(subject_manifest)
        subject_row["lessonsCount"] = subject_manifest["lessons"]
        subject_row.update({"tag": subject_card["tag"], "title": subject_card["title"], "book": subject_card["book"],
                            "cardTheme": re.search(r'class="card ([^"]+)"', subject_card["cardClass"]).group(1),
                            "homeLessons": subject_card["homeLessons"]})
        subject_rows = []
        template = page
        for number, (start, end, opening) in enumerate(lesson_blocks, 1):
            fragment = page[start:end]
            parser = MetadataParser(); parser.feed(fragment)
            if not parser.lesson or not parser.lesson.get("title"):
                raise SystemExit("Métadonnées de leçon incomplètes: " + sid + " #" + str(number))
            lesson_id = parser.lesson["id"]
            meta_id = PREFIXES[sid] + str(number)
            slug = "%02d-lesson" % number
            dest = ROOT / "content" / sid / slug
            dest.mkdir(parents=True, exist_ok=True)
            home_label = subject_card["homeLessons"][number-1]["label"]
            meta = {"id": meta_id, "subject": sid, "number": number, "slug": slug[3:],
                    "title": parser.lesson["title"], "shortTitle": parser.lesson["title"],
                    "prefix": PREFIXES[sid] + str(number),
                    "legacyLessonId": lesson_id, "homeLabel": home_label, "sourceFile": "source.md"}
            (dest / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            (dest / "lesson.html").write_text(fragment, encoding="utf-8")
            questions = []
            for i, (prompt, answer) in enumerate(parser.questions, 1):
                questions.append({"id": "%s-q%02d" % (meta_id, i), "type": "recall", "phase": "practice",
                                  "prompt": prompt, "answer": answer, "explain": answer,
                                  "section": next((x["id"] for x in parser.sections if x["id"].endswith("quiz")), ""), "difficulty": 1})
            (dest / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            (dest / "source.md").write_text("Transcription d’origine non conservée.\n", encoding="utf-8")
            for section in parser.sections:
                legacy_entry = search_order.get((sid, lesson_id, section["id"]))
                section["searchOrder"] = legacy_entry[0] if legacy_entry else None
                section["searchLabel"] = legacy_entry[1] if legacy_entry else None
            subject_rows.append({"meta": meta, "sections": parser.sections, "checkboxes": parser.checks,
                                 "questionCount": len(questions), "dataKeys": parser.data_keys})
            template = template.replace(fragment, "<!-- LESSON:%s:%s -->" % (sid, number), 1)
        subject_row["lessons"] = subject_rows
        subjects.append(subject_row)
        (ROOT / "templates" / "current" / (sid + ".html")).parent.mkdir(parents=True, exist_ok=True)
        (ROOT / "templates" / "current" / (sid + ".html")).write_text(template, encoding="utf-8")
    (ROOT / "templates" / "current" / "index.html").write_text(home_template, encoding="utf-8")
    (ROOT / "content" / "subjects.json").write_text(json.dumps(subjects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "templates" / "current" / "site.js").write_text((ROOT / "assets/site.js").read_text(encoding="utf-8"), encoding="utf-8")
    print("Extrait %d matières et %d dars." % (len(subjects), sum(len(x["lessons"]) for x in subjects)))

if __name__ == "__main__":
    main()
