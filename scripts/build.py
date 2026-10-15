#!/usr/bin/env python3
"""Build the legacy multi-page site from content/ and current-layout templates."""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "site"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


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
    for i, s in enumerate(subjects, 1):
        out.extend([
            '    <article data-matiere-card="%s" class="card %s">' % (s["id"], s["cardTheme"]),
            '      <p class="tag">%s</p>' % s["tag"],
            '      <h3><a href="%s">%s</a></h3>' % (s["file"], s["title"]),
            '      <p class="book">%s</p>' % s["book"],
            '      <ul class="dars">'])
        for lesson in s["lessons"]:
            meta = lesson["meta"]
            out.append('        <li><a href="%s#%s" data-lesson="%s">%s</a></li>' %
                       (s["file"], meta["legacyLessonId"], meta["number"], meta["homeLabel"]))
        out.extend([
            '      </ul>',
            '      <div class="mprog">',
            '        <div class="bar" role="progressbar" aria-label="دروس %s" data-matiere-learning="%s" aria-valuemin="0" aria-valuemax="%d" aria-valuenow="0" aria-valuetext="0 من %d دروس مكتملة"><span class="pfill"></span></div>' % (s["name"].replace("مادة ", "مادة "), s["id"], s["lessonsCount"], s["lessonsCount"]),
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
            for section in lesson["sections"]:
                if section.get("searchOrder") is None:
                    continue
                result.append({"_order": section["searchOrder"], "sub": s["id"], "file": s["file"], "lesson": str(meta["number"]),
                               "lessonId": meta["legacyLessonId"], "title": meta["title"],
                               "id": section["id"], "section": section["searchLabel"]})
    result.sort(key=lambda x: x["_order"])
    for item in result:
        del item["_order"]
    return result


def render_search_index(items):
    return "/* Index léger des titres de sections pour la recherche inter-matières. */\nvar ZLEARN_SEARCH_SECTIONS = " + json.dumps(items, ensure_ascii=False, indent=2) + ";\n"


def build():
    subjects = read_json(ROOT / "content/subjects.json")
    html_paths = {}
    for s in subjects:
        page = (ROOT / "templates/current" / (s["id"] + ".html")).read_text(encoding="utf-8")
        for lesson in s["lessons"]:
            marker = "<!-- LESSON:%s:%s -->" % (s["id"], lesson["meta"]["number"])
            fragment = (ROOT / "content" / s["id"] / ("%02d-%s" % (lesson["meta"]["number"], lesson["meta"]["slug"])) / "lesson.html").read_text(encoding="utf-8")
            if page.count(marker) != 1:
                raise ValueError("Marqueur manquant ou dupliqué : " + marker)
            page = page.replace(marker, fragment)
        html_paths[s["file"]] = page
    home_tpl = (ROOT / "templates/current/index.html").read_text(encoding="utf-8")
    if home_tpl.count("<!-- GENERATED_CARDS -->") != 1:
        raise ValueError("Marqueur de cartes d'accueil invalide")
    home_tpl = home_tpl.replace("<!-- GENERATED_LESSON_TOTAL -->", str(sum(s["lessonsCount"] for s in subjects)))
    html_paths["index.html"] = home_tpl.replace("<!-- GENERATED_CARDS -->", render_cards(subjects))
    js = (ROOT / "templates/current/site.js").read_text(encoding="utf-8")
    js = re.sub(r"var ZLEARN_MATIERES = \[[\s\S]*?\n\];", manifest_js(subjects), js, count=1)
    output = {OUT / name: text for name, text in html_paths.items()}
    output[OUT / "assets/site.css"] = (ROOT / "assets/site.css").read_text(encoding="utf-8")
    output[OUT / "assets/site.js"] = js
    output[OUT / "assets/search-index.js"] = render_search_index(search_sections(subjects))
    mismatches = []
    for path, text in output.items():
        if "--check" in sys.argv:
            if not path.exists() or path.read_text(encoding="utf-8") != text:
                mismatches.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
    if mismatches:
        print("Sortie absente ou périmée : " + ", ".join(mismatches), file=sys.stderr)
        return 1
    print("Build vérifié : %d fichiers générés." % len(output) if "--check" in sys.argv else "Build terminé : %d fichiers générés." % len(output))
    return 0


if __name__ == "__main__":
    raise SystemExit(build())
