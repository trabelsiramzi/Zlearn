#!/usr/bin/env python3
"""Create a lesson data folder and register it in content/subjects.json."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main(argv):
    if len(argv) != 6:
        print("Usage: python3 scripts/new_lesson.py <subject> <number> <slug> <title> <short-title>", file=sys.stderr)
        return 2
    sid, number_text, slug, title, short_title = argv[1:]
    if not re.fullmatch(r"[a-z][a-z0-9-]*", sid) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        print("Matière ou slug invalide.", file=sys.stderr)
        return 2
    try:
        number = int(number_text)
    except ValueError:
        print("Le numéro doit être un entier positif.", file=sys.stderr)
        return 2
    if number < 1 or not title.strip() or not short_title.strip():
        print("Numéro, titre et titre court doivent être renseignés.", file=sys.stderr)
        return 2
    manifest_path = ROOT / "content/subjects.json"
    subjects = json.loads(manifest_path.read_text(encoding="utf-8"))
    subject = next((item for item in subjects if item["id"] == sid), None)
    if subject is None:
        print("Matière absente de content/subjects.json; créer d'abord sa configuration.", file=sys.stderr)
        return 1
    if any(row["meta"]["number"] == number for row in subject["lessons"]):
        print("Ce numéro de dars existe déjà.", file=sys.stderr)
        return 1
    prefix = {"fiqh": "fq", "aqida": "aq", "tajwid": "tj", "sira": "sr", "hadith": "hd", "akhlaq": "ak", "nahw": "nh"}.get(sid, sid[:2]) + str(number)
    folder_name = "%02d-%s" % (number, slug)
    folder = ROOT / "content" / sid / folder_name
    if folder.exists():
        print("Le dossier existe déjà: %s" % folder.relative_to(ROOT), file=sys.stderr)
        return 1
    legacy_id = "lesson-%s" % prefix
    meta = {"id": prefix, "subject": sid, "number": number, "slug": slug, "title": title,
            "shortTitle": short_title, "prefix": prefix, "legacyLessonId": legacy_id,
            "homeLabel": "الدرس %s — %s" % (number, short_title), "sourceFile": "source.md"}
    section_id = prefix + "-summary"
    memorize_id = prefix + "-memorize"
    fragment = ('<div class="lesson" id="%s" data-lesson="%d" role="tabpanel" aria-labelledby="tab-%s-%d" tabindex="0">\n'
                '  <div class="part-head"><p>الدرس %d</p><h2>%s</h2></div>\n'
                '  <section id="%s"><h2>خلاصة الدرس</h2><p>أكمل هذا المحتوى من transcription.</p></section>\n'
                '  <section id="%s"><h2>تحقق من فهمك</h2>\n'
                '    <p class="lede">علّم على النقطة بعد أن تستطيع شرحها من ذاكرتك. تحفظ حالتك على هذا الجهاز.</p>\n'
                '    <div class="group" data-key="%s"><div class="progress"><div class="bar" aria-hidden="true"><span class="pfill"></span></div><span class="plabel">0 من 5</span></div><ul class="checks">\n'
                '      <li><label class="check"><input type="checkbox" id="%s-k1"><span>النقطة الأولى التي يجب حفظها من هذا الدرس.</span></label></li>\n'
                '      <li><label class="check"><input type="checkbox" id="%s-k2"><span>النقطة الثانية التي يجب حفظها من هذا الدرس.</span></label></li>\n'
                '      <li><label class="check"><input type="checkbox" id="%s-k3"><span>النقطة الثالثة التي يجب حفظها من هذا الدرس.</span></label></li>\n'
                '      <li><label class="check"><input type="checkbox" id="%s-k4"><span>النقطة الرابعة التي يجب حفظها من هذا الدرس.</span></label></li>\n'
                '      <li><label class="check"><input type="checkbox" id="%s-k5"><span>النقطة الخامسة التي يجب حفظها من هذا الدرس.</span></label></li>\n'
                '    </ul></div></section>\n'
                '</div>\n') % (legacy_id, number, sid, number, number, title, section_id, memorize_id, prefix, prefix, prefix, prefix, prefix, prefix)
    questions = [{"id": "%s-q%02d" % (prefix, i), "type": "recall",
                  "phase": "pretest" if i <= 2 else "practice", "prompt": "À compléter",
                  "answer": "À compléter", "explain": "À compléter", "section": section_id,
                  "difficulty": 1} for i in range(1, 9)]
    folder.mkdir(parents=True)
    (folder / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (folder / "lesson.html").write_text(fragment, encoding="utf-8")
    (folder / "questions.json").write_text(json.dumps(questions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (folder / "source.md").write_text("# Transcription source\n\nÀ remplacer par la transcription d'origine.\n", encoding="utf-8")
    row = {"meta": meta, "sections": [
        {"id": section_id, "heading": "خلاصة الدرس", "searchOrder": None, "searchLabel": "خلاصة الدرس"},
        {"id": memorize_id, "heading": "تحقق من فهمك", "searchOrder": None, "searchLabel": "تحقق من فهمك"}
    ], "checkboxes": 5, "questionCount": 8, "dataKeys": [prefix]}
    subject["lessons"].append(row)
    subject["lessons"].sort(key=lambda item: item["meta"]["number"])
    subject["lessonsCount"] = len(subject["lessons"])
    subject["total"] = sum(item.get("checkboxes", 0) for item in subject["lessons"])
    manifest_path.write_text(json.dumps(subjects, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Squelette créé: %s (compléter les sections, cartes et questions avant le build)." % folder.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
