#!/usr/bin/env python3
"""Validate source content and the generated static site (Python stdlib only)."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALID_TYPES = {"recall", "mcq", "classify", "cloze"}
VALID_PHASES = {"pretest", "practice"}
REQUIRED_QUESTION_FIELDS = {"id", "type", "phase", "prompt", "answer", "explain", "section", "difficulty"}


def fail(errors, path, message):
    errors.append("%s: %s" % (path.relative_to(ROOT), message))


def validate_content():
    errors = []
    legacy_taxonomy = 0
    subjects_path = ROOT / "content/subjects.json"
    try:
        subjects = json.loads(subjects_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return ["content/subjects.json: lecture JSON impossible (%s)" % exc]
    if not isinstance(subjects, list) or not subjects:
        return ["content/subjects.json: une liste non vide est requise"]
    subject_ids = set()
    lesson_ids = set()
    search_orders = set()
    for subject in subjects:
        sid = subject.get("id") if isinstance(subject, dict) else None
        if not sid or sid in subject_ids:
            fail(errors, subjects_path, "id de matière absent ou dupliqué: %r" % sid)
            continue
        subject_ids.add(sid)
        if not all(subject.get(key) for key in ("name", "book", "file", "lessons")):
            fail(errors, subjects_path, "%s: champs name/book/file/lessons requis" % sid)
        if subject.get("lessonsCount") != len(subject.get("lessons", [])):
            fail(errors, subjects_path, "%s: lessonsCount ne correspond pas aux leçons" % sid)
        if subject.get("total") != sum(row.get("checkboxes", 0) for row in subject.get("lessons", [])):
            fail(errors, subjects_path, "%s: total ne correspond pas aux cases" % sid)
        numbers = set()
        for row in subject.get("lessons", []):
            meta = row.get("meta", {})
            number, lid, prefix, slug = meta.get("number"), meta.get("id"), meta.get("prefix"), meta.get("slug")
            folder = ROOT / "content" / sid / ("%02d-%s" % (number, slug)) if isinstance(number, int) and slug else ROOT / "content" / sid
            meta_path = folder / "meta.json"
            question_path = folder / "questions.json"
            fragment_path = folder / "lesson.html"
            if not all((lid, prefix, slug, meta.get("title"), meta.get("shortTitle"), meta.get("legacyLessonId"), meta.get("homeLabel"))):
                fail(errors, meta_path, "meta.json incomplet (id, prefix, slug, title, shortTitle, legacyLessonId, homeLabel requis)")
            if lid in lesson_ids:
                fail(errors, meta_path, "id de dars dupliqué: %s" % lid)
            lesson_ids.add(lid)
            if number in numbers:
                fail(errors, meta_path, "numéro de dars dupliqué: %s" % number)
            numbers.add(number)
            if prefix and lid != prefix:
                fail(errors, meta_path, "id doit correspondre au préfixe stable (%s != %s)" % (lid, prefix))
            try:
                disk_meta = json.loads(meta_path.read_text(encoding="utf-8"))
                questions = json.loads(question_path.read_text(encoding="utf-8"))
                fragment = fragment_path.read_text(encoding="utf-8")
            except (OSError, json.JSONDecodeError) as exc:
                fail(errors, folder, "fichier de contenu absent ou JSON invalide (%s)" % exc)
                continue
            if disk_meta != meta:
                fail(errors, meta_path, "différent des métadonnées déclarées dans subjects.json")
            if not fragment.strip():
                fail(errors, fragment_path, "fragment de leçon vide")
            if re.search(r"\bstyle\s*=", fragment, re.I):
                fail(errors, fragment_path, "attribut style inline interdit")
            if re.search(r"<!--\s*(?:TODO|PLACEHOLDER|<ID>)|>\s*À compléter\s*<", fragment, re.I):
                fail(errors, fragment_path, "placeholder restant dans le fragment")
            source_path = folder / meta.get("sourceFile", "source.md")
            if not source_path.is_file():
                fail(errors, source_path, "transcription source ou mention d'absence requise")
            ids = set(re.findall(r'\bid=["\']([^"\']+)', fragment))
            if len(ids) != len(re.findall(r'\bid=["\']([^"\']+)', fragment)):
                fail(errors, fragment_path, "id HTML dupliqué")
            section_ids = set(re.findall(r'<section\b[^>]*\bid=["\']([^"\']+)', fragment, re.I))
            for section in row.get("sections", []):
                if section.get("id") not in section_ids:
                    fail(errors, meta_path, "section du manifeste absente du fragment: %s" % section.get("id"))
                order = section.get("searchOrder")
                if order is not None:
                    if order in search_orders:
                        fail(errors, subjects_path, "searchOrder dupliqué: %s" % order)
                    search_orders.add(order)
            if not isinstance(questions, list):
                fail(errors, question_path, "une liste de questions est requise")
                continue
            if row.get("questionCount") != len(questions):
                fail(errors, meta_path, "questionCount ne correspond pas à questions.json")
            qids = set()
            for q in questions:
                if not isinstance(q, dict) or not REQUIRED_QUESTION_FIELDS.issubset(q):
                    fail(errors, question_path, "chaque question doit contenir %s" % ", ".join(sorted(REQUIRED_QUESTION_FIELDS)))
                    continue
                qid = q["id"]
                if not re.fullmatch(re.escape(str(lid)) + r"-q\d{2}", str(qid)):
                    fail(errors, question_path, "id de question hors format stable: %s" % qid)
                if qid in qids:
                    fail(errors, question_path, "id de question dupliqué: %s" % qid)
                qids.add(qid)
                if q["type"] not in VALID_TYPES or q["phase"] not in VALID_PHASES:
                    fail(errors, question_path, "type/phase invalide pour %s" % qid)
                if not isinstance(q["difficulty"], int) or not 1 <= q["difficulty"] <= 3:
                    fail(errors, question_path, "difficulté doit être comprise entre 1 et 3 (%s)" % qid)
                if any(re.search(r"À compléter|PLACEHOLDER|<ID>|TODO", str(q[field]), re.I)
                       for field in ("prompt", "answer", "explain")):
                    fail(errors, question_path, "placeholder dans la question %s" % qid)
                if q["section"] not in ids:
                    fail(errors, question_path, "section inexistante pour %s: %s" % (qid, q["section"]))
                elif q["section"] not in section_ids:
                    fail(errors, question_path, "section doit viser une <section> de cours (%s: %s)" % (qid, q["section"]))
                if re.search(r"(^|-)quiz$", str(q["section"])):
                    fail(errors, question_path, "section ne doit pas viser le quiz (%s: %s)" % (qid, q["section"]))
                if str(q.get("explain", "")).strip() == str(q.get("answer", "")).strip():
                    fail(errors, question_path, "explain ne doit pas recopier answer (%s)" % qid)
                if q["type"] == "mcq" and len(q.get("options") or []) < 2:
                    fail(errors, question_path, "question mcq sans options (%s)" % qid)
                if q["type"] == "cloze" and not re.search(r"_{2,}|…", str(q.get("prompt", ""))):
                    fail(errors, question_path, "question cloze sans trou (%s)" % qid)
                if q.get("checkpoint"):
                    if q["checkpoint"] not in ids:
                        fail(errors, question_path, "checkpoint inexistant pour %s: %s" % (qid, q["checkpoint"]))
                    elif q["checkpoint"] not in section_ids:
                        fail(errors, question_path, "checkpoint doit viser une <section> de cours (%s: %s)" % (qid, q["checkpoint"]))
                    if re.search(r"(^|-)quiz$", str(q["checkpoint"])):
                        fail(errors, question_path, "checkpoint ne doit pas viser le quiz (%s: %s)" % (qid, q["checkpoint"]))
            if len(questions) < 8:
                fail(errors, question_path, "au moins 8 questions sont requises (%d trouvée(s))" % len(questions))
            if len(questions) > 12:
                print("AVERTISSEMENT %s: %d questions (cible actuelle : 8 à 12 ; banque historique préservée)" % (question_path.relative_to(ROOT), len(questions)))
            if sum(1 for q in questions if isinstance(q, dict) and q.get("phase") == "pretest") < 2:
                fail(errors, question_path, "deux questions de pré-test sont requises")
            if not any(q.get("type") in ("mcq", "classify", "cloze") for q in questions if isinstance(q, dict)):
                legacy_taxonomy += 1
            covered = {q.get("section") for q in questions if isinstance(q, dict)}
            covered.update(q.get("checkpoint") for q in questions if isinstance(q, dict) and q.get("checkpoint"))
            for match in re.finditer(r'<section\b[^>]*\bid=["\']([^"\']+)["\'][^>]*>(.*?)</section>', fragment, re.S | re.I):
                section_id, body = match.group(1), match.group(2)
                if re.search(r"(^|-)(summary|map|terms|memorize|quiz)$", section_id) or section_id.endswith("-card") or section_id.endswith("-source") or section_id == "identity":
                    continue
                words = len(re.findall(r"[^\s]+", re.sub(r"<[^>]+>", " ", body)))
                if words > 250 and section_id not in covered:
                    print("AVERTISSEMENT %s: section « %s » (%d mots) sans question" % (question_path.relative_to(ROOT), section_id, words))
    if legacy_taxonomy:
        print("AVERTISSEMENT: %d banques migrées utilisent uniquement type=recall ; compréhension/application ne sont pas distinguées par le schéma v1." % legacy_taxonomy)
    return errors


def contrast_ratio(foreground, background):
    def luminance(color):
        values = [int(color[index:index + 2], 16) / 255.0 for index in (1, 3, 5)]
        channels = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in values]
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    high, low = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def validate_palette():
    css_path = ROOT / "assets/site.css"
    css = css_path.read_text(encoding="utf-8")
    light_match = re.search(r"(?<![\w-]):root\s*\{([^}]*)\}", css)
    dark_match = re.search(r':root\[data-theme="dark"\]\s*\{([^}]*)\}', css)
    errors = []
    if not light_match or not dark_match:
        return ["assets/site.css: variables des thèmes clair/sombre introuvables"]
    palettes = (("clair", light_match.group(1)), ("sombre", dark_match.group(1)))
    pairs = (("ink", "bg"), ("ink", "surface"), ("ink", "panel"),
             ("muted", "bg"), ("muted", "surface"), ("hero-ink", "hero"),
             ("hero-muted", "hero"), ("accent", "bg"), ("accent", "surface"),
             ("blue", "blue-tint"), ("green", "green-tint"),
             ("amber", "amber-tint"), ("red", "red-tint"),
             ("sticky-ink", "sticky"), ("sticky-head", "sticky"))
    for tone in ("green", "blue", "purple", "orange", "teal", "rose"):
        pairs += (("on-tone", "f-" + tone), ("f-%s-ink" % tone, "f-%s-tint" % tone), ("f-%s-ink" % tone, "surface"),
                  ("f-%s-ink" % tone, "bg"), ("ink", "f-%s-tint" % tone))
    for theme, block in palettes:
        values = {name: color for name, color in re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})\b", block)}
        for foreground, background in pairs:
            if foreground not in values or background not in values:
                errors.append("assets/site.css: variable absente pour le contrôle de contraste %s/%s (%s)" % (foreground, background, theme))
            elif contrast_ratio(values[foreground], values[background]) < 4.5:
                errors.append("assets/site.css: contraste %.2f:1 < 4,5:1 entre --%s/--%s (%s)" % (contrast_ratio(values[foreground], values[background]), foreground, background, theme))
    return errors


def main():
    if "--content-only" in sys.argv:
        errors = validate_content()
        if errors:
            print("Échec du contrôle content/:")
            print("\n".join("  ✗ " + error for error in errors))
            return 1
        print("✓ content/ valide (manifestes, métadonnées, fragments, questions et références).")
        return 0
    errors = validate_content()
    errors.extend(validate_palette())
    if errors:
        print("Échec du contrôle content/:")
        print("\n".join("  ✗ " + error for error in errors))
        return 1
    print("✓ content/ valide (manifestes, métadonnées, fragments, questions et références).")
    html_files = sorted((ROOT / "site").rglob("*.html"))
    inline_style_pages = [path.relative_to(ROOT) for path in html_files
                          if re.search(r"\bstyle\s*=", path.read_text(encoding="utf-8"), re.I)]
    if inline_style_pages:
        print("Attributs style inline détectés : " + ", ".join(map(str, inline_style_pages)), file=sys.stderr)
        return 1
    print("✓ site/: aucun attribut style inline sur %d pages HTML." % len(html_files))
    result = subprocess.run([sys.executable, str(ROOT / "scripts/validate_site.py"), str(ROOT / "site")], cwd=str(ROOT))
    if result.returncode:
        return result.returncode
    result = subprocess.run([sys.executable, str(ROOT / "scripts/compare_baseline.py")], cwd=str(ROOT))
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
