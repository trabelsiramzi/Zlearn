#!/usr/bin/env python3
"""Build the static multi-page site from content/ and templates/ (stdlib only)."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def lesson_url(subject, lesson):
    return "%s/%02d-%s/index.html" % (subject["id"], lesson["meta"]["number"], lesson["meta"]["slug"])


def manifest_js(subjects):
    rows = []
    for s in subjects:
        rows.append('  { id: %s, name: %s, book: %s, file: %s, total: %d, lessons: %d }' % (
            json.dumps(s["id"], ensure_ascii=False), json.dumps(s["name"], ensure_ascii=False),
            json.dumps(s["book"], ensure_ascii=False), json.dumps(s["file"], ensure_ascii=False),
            s["total"], s["lessonsCount"]))
    return "var ZLEARN_MATIERES = [\n" + ",\n".join(rows) + "\n];"


def render_cards(subjects):
    out = ['<div class="cards">']
    for s in subjects:
        out.extend([
            '    <article data-matiere-card="%s" class="card %s">' % (s["id"], s["cardTheme"]),
            '      <p class="tag">%s</p>' % s["tag"],
            '      <h3><a href="%s">%s</a></h3>' % (s["file"], s["title"]),
            '      <p class="book">%s</p>' % s["book"],
            '      <ul class="dars">'])
        for lesson in s["lessons"]:
            meta = lesson["meta"]
            out.append('        <li><a href="%s" data-lesson="%s">%s</a></li>' %
                       (lesson_url(s, lesson), meta["number"], meta["homeLabel"]))
        out.extend([
            '      </ul>',
            '      <div class="mprog">',
            '        <div class="bar" role="progressbar" aria-label="دروس %s" data-matiere-learning="%s" aria-valuemin="0" aria-valuemax="%d" aria-valuenow="0" aria-valuetext="0 من %d دروس مكتملة"><span class="pfill"></span></div>' % (s["name"], s["id"], s["lessonsCount"], s["lessonsCount"]),
            '        <span class="mlabel">0 من %d</span>' % s["lessonsCount"],
            '      </div>',
            '    </article>'])
    out.append('  </div>')
    return "\n".join(out)


def search_sections(subjects):
    result = []
    for s in subjects:
        for lesson in s["lessons"]:
            meta = lesson["meta"]
            url = lesson_url(s, lesson)
            for section in lesson["sections"]:
                if section.get("searchOrder") is None:
                    continue
                result.append({"_order": section["searchOrder"], "sub": s["id"], "file": url, "url": url,
                               "lesson": str(meta["number"]), "lessonId": meta["legacyLessonId"],
                               "title": meta["title"], "id": section["id"], "section": section["searchLabel"]})
    result.sort(key=lambda x: x["_order"])
    for item in result:
        del item["_order"]
    return result


def render_search_index(items):
    return "/* Index léger des titres de sections pour la recherche inter-matières. */\nvar ZLEARN_SEARCH_SECTIONS = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"


def storage_catalog(subjects):
    keys = {"mourshid-theme"}
    lesson_keys, check_ids, group_ids, answer_ids, quiz_ids = {}, {}, {}, {}, {}
    for subject in subjects:
        sid = subject["id"]
        for lesson in subject["lessons"]:
            meta = lesson["meta"]
            folder = ROOT / "content" / sid / ("%02d-%s" % (meta["number"], meta["slug"]))
            html = (folder / "lesson.html").read_text(encoding="utf-8")
            for number in range(1, subject["lessonsCount"] + 1):
                lesson_keys[sid + ":" + str(number)] = next((x["meta"]["id"] for x in subject["lessons"] if x["meta"]["number"] == number), "")
            for tag in re.findall(r'<input\b[^>]*>', html, re.I):
                if not re.search(r'type=["\']checkbox["\']', tag, re.I):
                    continue
                found = re.search(r'id=["\']([^"\']+)', tag, re.I)
                if not found:
                    continue
                oldid = found.group(1)
                check_ids[oldid] = meta["prefix"] + "-k" + str(len([v for v in check_ids.values() if v.startswith(meta["prefix"] + "-k")]) + 1)
            for oldkey in re.findall(r'data-key=["\']([^"\']+)', html):
                group_ids[oldkey] = meta["prefix"]
                keys.add("mourshid-" + oldkey)
                answer_ids[oldkey + "-verses"] = meta["id"] + "-verses"
                keys.add("mourshid-" + oldkey + "-verses")
            activity = re.findall(r'<(?:div|section)[^>]*id=["\']([^"\']+-activity)["\']', html)
            for aid in activity:
                answer_ids[aid] = aid
                keys.add("zlearn-answer-" + aid)
            qids = [q["id"] for q in read_json(folder / "questions.json")]
            qid = re.search(r'<(?:section|div)[^>]*id=["\']([^"\']+-quiz)["\']', html)
            if qid:
                qname = qid.group(1)
                quiz_ids[qname] = {str(i): q for i, q in enumerate(qids)}
                keys.add("mourshid-quiz-" + qname)
        for suffix in ("tab-", "last-", "learning-", "prog-"):
            keys.add("mourshid-" + suffix + sid)
    return {"keys": sorted(keys), "lessonKeys": lesson_keys, "checkIds": check_ids,
            "groupIds": group_ids, "answerIds": answer_ids, "quizIds": quiz_ids}


def replace_tokens(template, values):
    for key, value in values.items():
        template = template.replace("{{" + key + "}}", str(value))
    return template


def render_home(subjects):
    template = (ROOT / "templates/current/index.html").read_text(encoding="utf-8")
    if template.count("<!-- GENERATED_CARDS -->") != 1:
        raise ValueError("Marqueur de cartes d'accueil invalide")
    template = template.replace("<!-- GENERATED_LESSON_TOTAL -->", str(sum(s["lessonsCount"] for s in subjects)))
    return template.replace("<!-- GENERATED_CARDS -->", render_cards(subjects))


def render_summary(subject):
    template = (ROOT / "templates/subject-index.html").read_text(encoding="utf-8")
    cards = []
    redirects = {}
    for lesson in subject["lessons"]:
        meta = lesson["meta"]
        url = lesson_url(subject, lesson)
        relative_url = "%02d-%s/index.html" % (meta["number"], meta["slug"])
        redirects[meta["legacyLessonId"]] = relative_url + "#" + meta["legacyLessonId"]
        rows = []
        for section in lesson["sections"]:
            sid = section["id"]
            redirects[sid] = relative_url + "#" + sid
            label = section.get("heading") or sid
            rows.append('<li><a id="%s" href="%s#%s">%s</a></li>' % (sid, relative_url, sid, label))
        cards.append('''<article id="%s" class="card %s lesson-summary">
  <p class="tag">الدرس %02d</p><h3><a href="%s">%s</a></h3>
  <a class="btn primary" href="%s">افتح الدرس</a>
  <details><summary>محاور الدرس</summary><ul class="section-links">%s</ul></details>
</article>''' % (meta["legacyLessonId"], subject["cardTheme"], meta["number"], relative_url, meta["title"], relative_url, "".join(rows)))
    content = replace_tokens(template, {
        "SUBJECT_TITLE": subject["title"], "SUBJECT_NAME": subject["name"], "SUBJECT_ID": subject["id"],
        "BOOK": subject["book"], "TOTAL_LESSONS": sum(s["lessonsCount"] for s in read_json(ROOT / "content/subjects.json")),
        "SITE_PREFIX": "../",
        "LESSON_CARDS": "\n".join(cards),
        "LEGACY_REDIRECTS": json.dumps(redirects, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")})
    return content


def render_lesson_page(subject, lesson, index, subjects):
    template = (ROOT / "templates/lesson-page.html").read_text(encoding="utf-8")
    meta = lesson["meta"]
    url = lesson_url(subject, lesson)
    previous = "../%02d-%s/index.html" % (subject["lessons"][index-1]["meta"]["number"], subject["lessons"][index-1]["meta"]["slug"]) if index else ""
    following = "../%02d-%s/index.html" % (subject["lessons"][index+1]["meta"]["number"], subject["lessons"][index+1]["meta"]["slug"]) if index < len(subject["lessons"])-1 else ""
    label = meta["homeLabel"].split(" — ", 1)[0].replace("الدرس ", "")
    chips = []
    for section in lesson["sections"]:
        if not section.get("heading"):
            continue
        chips.append('<a href="#%s">%s</a>' % (section["id"], section["heading"]))
    fragment = (ROOT / "content" / subject["id"] / ("%02d-%s" % (meta["number"], meta["slug"])) / "lesson.html").read_text(encoding="utf-8")
    questions = json.dumps(read_json(ROOT / "content" / subject["id"] / ("%02d-%s" % (meta["number"], meta["slug"])) / "questions.json"), ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    previous_label = "الدرس السابق"
    next_label = "الدرس التالي ←"
    stepper_parts = ['<nav class="lesson-stepper" aria-label="التنقل بين دروس المادة">']
    if previous:
        stepper_parts.append('<a class="btn" href="%s">%s</a>' % (previous, previous_label))
    else:
        stepper_parts.append('<span class="lesson-step-placeholder" aria-hidden="true"></span>')
    stepper_parts.append('<span class="lesson-step-count">الدرس %d من %d</span>' % (meta["number"], len(subject["lessons"])))
    if following:
        stepper_parts.append('<a class="btn primary" href="%s">%s</a>' % (following, next_label))
    else:
        stepper_parts.append('<a class="btn primary" href="../index.html">اختر مادة أخرى</a>')
    stepper_parts.append('</nav>')
    values = {
        "SUBJECT_ID": subject["id"], "SUBJECT_NAME": subject["name"], "BOOK": subject["book"],
        "LESSON_TITLE": meta["title"], "SHORT_TITLE": meta["shortTitle"],
        "LESSON_URL": url, "LESSON_NUMBER": meta["number"], "LESSON_COUNT": len(subject["lessons"]),
        "PREVIOUS_URL": previous, "NEXT_URL": following, "LESSON_LABEL": label,
        "LEGACY_ID": meta["legacyLessonId"], "SITE_PREFIX": "../../", "TOTAL_LESSONS": sum(s["lessonsCount"] for s in subjects),
        "CHIPS": "".join(chips), "LESSON_HTML": fragment, "QUESTION_DATA": questions, "STEPPER": "".join(stepper_parts),
    }
    return replace_tokens(template, values)


def extract_memorize_items(folder, section_id):
    """Extract checkbox label texts from a memorize section in a lesson fragment."""
    html = (folder / "lesson.html").read_text(encoding="utf-8")
    # Find the section with the given id
    pattern = r'<section[^>]*\bid=["\']' + re.escape(section_id) + r'"[^>]*>(.*?)</section>'
    match = re.search(pattern, html, re.DOTALL | re.IGNORECASE)
    if not match:
        return []
    section_html = match.group(1)
    # Extract text from span elements inside labels (checkbox items)
    items = re.findall(r'<label[^>]*class=["\'][^"\']*\bcheck\b[^"\']*["\'][^>]*>.*?<span>(.*?)</span>.*?</label>', section_html, re.DOTALL | re.IGNORECASE)
    # Clean up whitespace and HTML tags
    cleaned = []
    for item in items:
        text = re.sub(r'<[^>]+>', '', item)
        text = re.sub(r'\s+', ' ', text).strip()
        if text:
            cleaned.append(text)
    return cleaned


def render_mahfoudhat(subjects):
    """Render the Mahfoudhat page listing all memorization items by subject."""
    template = (ROOT / "templates/mahfoudhat.html").read_text(encoding="utf-8")
    parts = ['<div class="cards">']
    for s in subjects:
        sid = s["id"]
        total_items = sum(row.get("checkboxes", 0) for row in s["lessons"])
        parts.append('  <article class="card %s" data-mahfoudhat-subject="%s">' % (s["cardTheme"], sid))
        parts.append('    <h3><a href="%s">%s</a></h3>' % (s["file"], s["title"]))
        parts.append('    <p class="book">%s</p>' % s["book"])
        parts.append('    <p class="memo-count">%d نقطة حفظ في %d دروس</p>' % (total_items, s["lessonsCount"]))
        parts.append('    <details><summary>عرض المحفوظات</summary>')
        parts.append('    <div class="mahfoudhat-list">')
        for lesson in s["lessons"]:
            meta = lesson["meta"]
            url = lesson_url(s, lesson)
            folder = ROOT / "content" / sid / ("%02d-%s" % (meta["number"], meta["slug"]))
            # Find the memorize section id
            memo_section = next((sec for sec in lesson["sections"] if "memorize" in sec["id"]), None)
            if not memo_section:
                continue
            items = extract_memorize_items(folder, memo_section["id"])
            if not items:
                continue
            parts.append('      <div class="mahfoudhat-lesson">')
            parts.append('        <h4><a href="%s#%s">%s</a></h4>' % (url, memo_section["id"], meta["title"]))
            parts.append('        <ul>')
            for item in items:
                parts.append('          <li>%s</li>' % item)
            parts.append('        </ul>')
            parts.append('      </div>')
        parts.append('    </div>')
        parts.append('    </details>')
        parts.append('  </article>')
    parts.append('</div>')
    content = template.replace("<!-- GENERATED_MAHFOUDHAT -->", "\n".join(parts))
    return content


def build():
    subjects = read_json(ROOT / "content/subjects.json")
    html_paths = {"index.html": render_home(subjects)}
    html_paths["review/index.html"] = (ROOT / "templates/review.html").read_text(encoding="utf-8")
    html_paths["mahfoudhat/index.html"] = render_mahfoudhat(subjects)
    html_paths["404.html"] = (ROOT / "templates/404.html").read_text(encoding="utf-8")
    for subject in subjects:
        html_paths[subject["file"]] = render_summary(subject)
        for i, lesson in enumerate(subject["lessons"]):
            html_paths[lesson_url(subject, lesson)] = render_lesson_page(subject, lesson, i, subjects)
    js = "\n".join((ROOT / "src/js" / (name + ".js")).read_text(encoding="utf-8") for name in
                   ("manifest", "widgets", "sw-register", "toc", "nav", "progress",
                    "activities", "transfer", "interactions", "quiz-legacy", "mindmap"))
    js = re.sub(r"var ZLEARN_MATIERES = \[[\s\S]*?\n\];", manifest_js(subjects), js, count=1)
    js = "\n".join([(ROOT / "src/js/storage.js").read_text(encoding="utf-8"), js,
                     (ROOT / "src/js/srs.js").read_text(encoding="utf-8"),
                     (ROOT / "src/js/quiz.js").read_text(encoding="utf-8"),
                     (ROOT / "src/js/review.js").read_text(encoding="utf-8")])
    output = {OUT / name: text for name, text in html_paths.items()}
    output[OUT / "assets/site.css"] = (ROOT / "assets/site.css").read_text(encoding="utf-8")
    output[OUT / "assets/site.js"] = js
    output[OUT / "assets/search-index.js"] = render_search_index(search_sections(subjects))
    output[OUT / "assets/storage-catalog.js"] = "var ZLEARN_STORAGE_CATALOG = " + json.dumps(storage_catalog(subjects), ensure_ascii=False, separators=(",", ":")) + ";\n"
    question_catalog = []
    for subject in subjects:
        for lesson in subject["lessons"]:
            meta = lesson["meta"]
            folder = ROOT / "content" / subject["id"] / ("%02d-%s" % (meta["number"], meta["slug"]))
            for question in read_json(folder / "questions.json"):
                question_catalog.append({"question": question, "subject": subject["id"], "subjectName": subject["name"], "lessonTitle": meta["title"], "url": lesson_url(subject, lesson)})
    output[OUT / "assets/question-catalog.js"] = "var ZLEARN_QUESTION_CATALOG = " + json.dumps(question_catalog, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";\n"
    output[OUT / "assets/favicon.svg"] = (ROOT / "assets/favicon.svg").read_text(encoding="utf-8")
    output[OUT / "manifest.webmanifest"] = (ROOT / "templates/manifest.webmanifest").read_text(encoding="utf-8")
    for font in sorted((ROOT / "assets/fonts").iterdir()):
        if font.is_file():
            output[OUT / "assets/fonts" / font.name] = font.read_bytes()
    precache = ["./" + str(path.relative_to(OUT)).replace("\\", "/") for path in sorted(output, key=lambda p: str(p))]
    sw_template = (ROOT / "templates/sw.js").read_text(encoding="utf-8")
    output[OUT / "sw.js"] = sw_template.replace("{{PRECACHE_URLS}}", json.dumps(precache, separators=(",", ":")))
    mismatches = []
    expected_paths = set(output)
    if OUT.exists():
        for path in OUT.rglob("*"):
            if path.is_file() and path not in expected_paths:
                if "--check" in sys.argv:
                    mismatches.append(str(path.relative_to(ROOT)) + " (obsolète)")
                else:
                    path.unlink()
    for path, data in output.items():
        expected = data if isinstance(data, bytes) else data.encode("utf-8")
        if "--check" in sys.argv:
            if not path.exists() or path.read_bytes() != expected:
                mismatches.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(expected)
    if mismatches:
        print("Sortie absente ou périmée : " + ", ".join(mismatches), file=sys.stderr)
        return 1
    print("Build vérifié : %d fichiers générés." % len(output) if "--check" in sys.argv else "Build terminé : %d fichiers générés." % len(output))
    return 0

if __name__ == "__main__":
    raise SystemExit(build())
