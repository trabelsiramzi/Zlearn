#!/usr/bin/env python3
"""Validateur statique du site d’apprentissage Zlearn (multi-pages).

Le site est découpé en : ``index.html`` (accueil) + un dossier par matière
(``fiqh/``, ``aqida/``, ``tajwid/``, ``sira/``, ``hadith/``, ``akhlaq/``, ``nahw/``)
+ les scripts et styles partagés dans ``assets/``.

Usage :
    python3 validate_site.py [chemin]

``chemin`` peut être un fichier HTML (contrôle isolé) ou un dossier (contrôle de
toutes les pages ``*.html`` + cohérence inter-pages). Sans argument : racine du dépôt.

Contrôles par page :
  - ids dupliqués ;
  - ancres internes ``href="#id"`` pointant vers un id existant ;
  - balises équilibrées (avec auto-fermeture des balises HTML optionnelles) ;
  - ``<html lang="ar" dir="rtl">`` ;
  - chaque groupe de mémorisation possède ``.pfill`` + ``.plabel`` et son compteur
    « ... من N » correspond au nombre de cases ;
  - chaque bouton ``.toggle-all`` cible une section existante.

Contrôles inter-pages (mode dossier) :
  - les sept matières sont présentes dans l'arborescence ;
  - le manifeste ``ZLEARN_MATIERES`` de ``assets/site.js`` liste chaque matière et
    ses nombres de cases et de dars correspondent aux pages ;
  - l'index global de recherche pointe vers des sections valides de la bonne matière.

Sortie : rapport lisible, code retour ≠ 0 si au moins une erreur.
Aucune dépendance externe (bibliothèque standard Python uniquement).
"""

from __future__ import annotations

import os
import re
import sys
import json
from collections import Counter
from html.parser import HTMLParser

VOID = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}

# Balise ouvrante -> ensemble des balises encore ouvertes qu'elle referme implicitement.
AUTO_CLOSE = {
    "li": {"li"},
    "dt": {"dt", "dd"},
    "dd": {"dt", "dd"},
    "tr": {"tr", "td", "th"},
    "td": {"td", "th"},
    "th": {"td", "th"},
    "option": {"option"},
    "p": {"p"},
    "thead": {"thead", "tbody", "tfoot", "tr", "td", "th"},
    "tbody": {"thead", "tbody", "tfoot", "tr", "td", "th"},
    "tfoot": {"thead", "tbody", "tfoot", "tr", "td", "th"},
}

ARABIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
SKIP_DIRS = {".git", ".opencode", "backups", "node_modules"}
EXPECTED_SUBJECTS = ("fiqh", "aqida", "tajwid", "sira", "hadith", "akhlaq", "nahw")


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[tuple[str, int]] = []
        self.anchors: list[tuple[str, int]] = []
        self.open_stack: list[str] = []
        self.stack_errors: list[str] = []
        self.html_attrs: dict[str, str] | None = None
        self.groups: list[dict] = []
        self._group_stack: list[dict] = []
        self._capture: dict | None = None  # capture du texte d'un élément
        self.toggle_targets: list[tuple[str, int]] = []
        self.subjects: list[str] = []
        self.lessons: list[tuple[str, int]] = []
        self.tabs: list[tuple[str | None, str | None, int]] = []
        self.panels: list[tuple[str | None, str | None, int]] = []
        self.scripts: list[str] = []
        self._lesson_depths: list[int] = []
        self._section_stack: list[dict] = []
        self._heading_capture = False
        self._heading_text: list[str] = []
        self.search_sections: set[str] = set()
        self.checkbox_total = 0

    # -- helpers ---------------------------------------------------------
    @staticmethod
    def _classes(attrs: list[tuple[str, str | None]]) -> set[str]:
        for k, v in attrs:
            if k == "class" and v:
                return set(v.split())
        return set()

    @staticmethod
    def _get(attrs, name):
        for k, v in attrs:
            if k == name:
                return v
        return None

    # -- parser callbacks ------------------------------------------------
    def handle_starttag(self, tag, attrs):
        line = self.getpos()[0]
        if tag == "html":
            self.html_attrs = {k: (v or "") for k, v in attrs}
        _id = self._get(attrs, "id")
        if _id:
            self.ids.append((_id, line))
        href = self._get(attrs, "href")
        if href and href.startswith("#") and len(href) > 1:
            self.anchors.append((href[1:], line))
        classes = self._classes(attrs)

        if tag == "div" and "subject" in classes and self._get(attrs, "data-subject"):
            self.subjects.append(self._get(attrs, "data-subject"))
        if tag == "div" and "lesson" in classes and self._get(attrs, "data-lesson"):
            self.lessons.append((self._get(attrs, "data-lesson"), line))
            self._lesson_depths.append(len(self.open_stack) + 1)
            if self._get(attrs, "role") == "tabpanel":
                self.panels.append((_id, self._get(attrs, "aria-labelledby"), line))
        if tag == "section" and _id and self._lesson_depths:
            self._section_stack.append({"id": _id, "heading": ""})
        if tag == "h2" and self._section_stack:
            self._heading_capture = True
            self._heading_text = []
        if tag == "button" and self._get(attrs, "role") == "tab":
            self.tabs.append((_id, self._get(attrs, "aria-controls"), line))
        if tag == "script" and self._get(attrs, "src"):
            self.scripts.append(self._get(attrs, "src"))
        if tag == "div" and "group" in classes:
            g = {"key": self._get(attrs, "data-key"), "depth": len(self.open_stack) + 1,
                 "checkboxes": 0, "has_pfill": False, "label": None, "line": line}
            self.groups.append(g)
            self._group_stack.append(g)
        if tag == "input" and (self._get(attrs, "type") or "") == "checkbox":
            self.checkbox_total += 1
            if self._group_stack:
                self._group_stack[-1]["checkboxes"] += 1
        if self._group_stack:
            g = self._group_stack[-1]
            if "pfill" in classes:
                g["has_pfill"] = True
            if "plabel" in classes:
                g["label"] = ""
                self._capture = {"group": g}
        if tag == "button" and "toggle-all" in classes:
            target = self._get(attrs, "data-target")
            if target:
                self.toggle_targets.append((target, line))

        if tag in AUTO_CLOSE and self.open_stack and self.open_stack[-1] in AUTO_CLOSE[tag]:
            self.open_stack.pop()
        if tag not in VOID:
            self.open_stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        # handle_starttag pushé : le retirer, c'est un élément auto-fermé.
        if tag not in VOID and self.open_stack and self.open_stack[-1] == tag:
            self.open_stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if tag == "h2" and self._heading_capture:
            if self._section_stack:
                self._section_stack[-1]["heading"] = " ".join("".join(self._heading_text).split())
            self._heading_capture = False
        if tag == "section" and self._section_stack:
            section = self._section_stack.pop()
            if section["heading"]:
                self.search_sections.add(section["id"])
        if tag in self.open_stack:
            while self.open_stack:
                top = self.open_stack.pop()
                if top == tag:
                    break
        else:
            self.stack_errors.append(f"ligne {self.getpos()[0]} : </{tag}> sans ouvrante")
        while self._lesson_depths and self._lesson_depths[-1] > len(self.open_stack):
            self._lesson_depths.pop()
        while self._group_stack and self._group_stack[-1]["depth"] > len(self.open_stack):
            self._group_stack.pop()

    def handle_data(self, data):
        if self._capture is not None:
            self._capture["group"]["label"] += data
        if self._heading_capture:
            self._heading_text.append(data)

    def close(self):
        super().close()
        while self._group_stack:
            self._group_stack.pop()
        if self.open_stack:
            self.stack_errors.append(
                "balises non fermées : " + ", ".join(reversed(self.open_stack[:8]))
            )


def arabic_to_int(text: str) -> int | None:
    m = re.search(r"(\d+)\s*من\s*(\d+)", text.translate(ARABIC_DIGITS))
    if m:
        return int(m.group(2))
    m = re.search(r"(\d+)", text.translate(ARABIC_DIGITS))
    return int(m.group(1)) if m else None


def validate_file(path: str) -> tuple[SiteParser, list[str], list[str]]:
    with open(path, encoding="utf-8") as fh:
        html = fh.read()
    parser = SiteParser()
    parser.feed(html)
    parser.close()

    errors: list[str] = []
    warnings: list[str] = []

    counts = Counter(i for i, _ in parser.ids)
    for _id, n in counts.items():
        if n > 1:
            lines = [str(l) for i, l in parser.ids if i == _id]
            errors.append(f"id dupliqué « {_id} » ({n}×) lignes {', '.join(lines[:6])}")

    existing = set(counts)
    for anchor, line in parser.anchors:
        if anchor not in existing:
            errors.append(f'ancre cassée href="#{anchor}" (ligne {line})')

    panels_by_id = {panel_id: label for panel_id, label, _ in parser.panels}
    tabs_by_id = {tab_id: panel_id for tab_id, panel_id, _ in parser.tabs}
    for tab_id, panel_id, line in parser.tabs:
        if not tab_id or not panel_id or panels_by_id.get(panel_id) != tab_id:
            errors.append(f"onglet sans panneau ARIA correspondant (ligne {line})")
    for panel_id, tab_id, line in parser.panels:
        if not panel_id or tabs_by_id.get(tab_id) != panel_id:
            errors.append(f"panneau sans onglet ARIA correspondant (ligne {line})")

    errors.extend(parser.stack_errors)

    ha = parser.html_attrs or {}
    if ha.get("lang") != "ar" or ha.get("dir") != "rtl":
        errors.append(f'<html> doit porter lang="ar" dir="rtl" (actuel : {ha})')

    for g in parser.groups:
        if not g["has_pfill"]:
            errors.append(f"groupe « {g['key']} » (ligne {g['line']}) sans .pfill")
        if g["label"] is None:
            errors.append(f"groupe « {g['key']} » (ligne {g['line']}) sans .plabel")
        else:
            declared = arabic_to_int(g["label"])
            if declared is not None and declared != g["checkboxes"]:
                errors.append(
                    f"groupe « {g['key']} » : compteur « {g['label'].strip()} » "
                    f"≠ {g['checkboxes']} case(s)"
                )

    for target, line in parser.toggle_targets:
        if target not in existing:
            errors.append(f'toggle-all data-target="{target}" inexistant (ligne {line})')

    return parser, errors, warnings


def collect_pages(target: str) -> list[str]:
    if os.path.isfile(target):
        return [target]
    pages: list[str] = []
    for root, dirs, files in os.walk(target):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in sorted(files):
            if name.endswith(".html"):
                pages.append(os.path.join(root, name))
    return sorted(pages)


def manifest_entries(site_js: str) -> dict[str, dict[str, int]]:
    entries: dict[str, dict[str, int]] = {}
    for m in re.finditer(r'\{\s*id:\s*"([^"]+)"([^}]+)\}', site_js):
        entry = {"total": int(re.search(r"total:\s*(\d+)", m.group(2)).group(1))}
        lessons = re.search(r"lessons:\s*(\d+)", m.group(2))
        if lessons:
            entry["lessons"] = int(lessons.group(1))
        entries[m.group(1)] = entry
    return entries


def main(argv: list[str]) -> int:
    target = argv[1] if len(argv) > 1 else "."
    if not os.path.exists(target):
        print(f"[ERREUR] introuvable : {target}", file=sys.stderr)
        return 2

    pages = collect_pages(target)
    if not pages:
        print(f"[ERREUR] aucune page HTML trouvée dans : {target}", file=sys.stderr)
        return 2
    directory_mode = os.path.isdir(target)

    all_errors: list[str] = []
    subjects_seen: list[str] = []
    totals_by_page: dict[str, int] = {}
    lessons_by_page: dict[str, int] = {}
    lesson_numbers_by_page: dict[str, set[str]] = {}
    ids_by_page: dict[str, set[str]] = {}
    search_sections_by_page: dict[str, set[str]] = {}
    scripts_by_page: dict[str, list[str]] = {}

    for page in pages:
        parser, errors, warnings = validate_file(page)
        subjects_seen.extend(parser.subjects)
        if parser.subjects:
            totals_by_page[parser.subjects[0]] = parser.checkbox_total
            lessons_by_page[parser.subjects[0]] = len(parser.lessons)
            lesson_numbers_by_page[parser.subjects[0]] = {n for n, _ in parser.lessons}
            ids_by_page[parser.subjects[0]] = {i for i, _ in parser.ids}
            search_sections_by_page[parser.subjects[0]] = parser.search_sections
            scripts_by_page[parser.subjects[0]] = parser.scripts
            numbers = [n for n, _ in parser.lessons]
            if len(numbers) != len(set(numbers)):
                all_errors.append(f"{page} : numéro data-lesson dupliqué")
        print(f"Fichier : {page}")
        print(f"  {len(parser.subjects)} matière(s), {len(parser.groups)} groupe(s) de mémorisation, "
              f"{len(parser.ids)} ids, {len(parser.anchors)} ancre(s) interne(s), "
              f"{len(parser.toggle_targets)} quiz")
        print(f"  cases à cocher : {parser.checkbox_total}")
        if warnings:
            print("  Avertissements :")
            for w in warnings:
                print(f"    - {w}")
        if errors:
            print(f"  {len(errors)} erreur(s) :")
            for e in errors:
                print(f"    ✗ {e}")
            all_errors.extend(f"{page} : {e}" for e in errors)
        else:
            print("  ✓ page valide")
        print()

    if directory_mode:
        # matières attendues
        for sub in EXPECTED_SUBJECTS:
            if subjects_seen.count(sub) != 1:
                all_errors.append(
                    f"matière « {sub} » présente {subjects_seen.count(sub)}× "
                    f"(attendu : 1 page)"
                )
        # manifeste de progression
        site_js = os.path.join(target, "assets", "site.js")
        if os.path.isfile(site_js):
            declared = manifest_entries(open(site_js, encoding="utf-8").read())
            for sub in EXPECTED_SUBJECTS:
                if sub not in declared:
                    all_errors.append(f"manifeste assets/site.js : matière « {sub} » absente")
                    continue
                if sub in totals_by_page and declared[sub].get("total") != totals_by_page[sub]:
                    all_errors.append(
                        f"manifeste assets/site.js : total de « {sub} » = {declared[sub].get('total')} "
                        f"mais {totals_by_page[sub]} cases dans {sub}/index.html"
                    )
                if sub in lessons_by_page and declared[sub].get("lessons") != lessons_by_page[sub]:
                    all_errors.append(
                        f"manifeste assets/site.js : nombre de leçons de « {sub} » = "
                        f"{declared[sub].get('lessons')} mais {lessons_by_page[sub]} dans {sub}/index.html"
                    )
        else:
            all_errors.append("assets/site.js introuvable (manifeste de progression)")

        # Recherche globale : chaque entrée doit mener à une vraie section de la bonne matière.
        search_index = os.path.join(target, "assets", "search-index.js")
        if os.path.isfile(search_index):
            source = open(search_index, encoding="utf-8").read()
            match = re.search(r"var\s+ZLEARN_SEARCH_SECTIONS\s*=\s*(\[.*?\]);", source, re.S)
            if not match:
                all_errors.append("assets/search-index.js : tableau ZLEARN_SEARCH_SECTIONS introuvable")
            else:
                try:
                    search_rows = json.loads(match.group(1))
                except json.JSONDecodeError as exc:
                    search_rows = []
                    all_errors.append(f"assets/search-index.js : JSON invalide ({exc})")
                seen_search: set[tuple[str, str]] = set()
                for row in search_rows:
                    if not isinstance(row, dict):
                        all_errors.append("assets/search-index.js : entrée qui n'est pas un objet")
                        continue
                    sub, file_name, anchor = row.get("sub"), row.get("file"), row.get("id")
                    key = (str(sub), str(anchor))
                    if key in seen_search:
                        all_errors.append(f"assets/search-index.js : entrée dupliquée {key}")
                    seen_search.add(key)
                    if sub not in EXPECTED_SUBJECTS or file_name != f"{sub}/index.html":
                        all_errors.append(f"assets/search-index.js : matière ou fichier invalide pour {key}")
                        continue
                    if anchor not in ids_by_page.get(sub, set()):
                        all_errors.append(f"assets/search-index.js : ancre {anchor!r} absente de {sub}/index.html")
                    if row.get("lesson") not in lesson_numbers_by_page.get(sub, set()):
                        all_errors.append(f"assets/search-index.js : numéro de dars invalide pour {key}")
                if not search_rows:
                    all_errors.append("assets/search-index.js : index vide")
                expected_search = {
                    (sub, anchor)
                    for sub, anchors in search_sections_by_page.items()
                    for anchor in anchors
                }
                missing_search = expected_search - seen_search
                stale_search = seen_search - expected_search
                if missing_search:
                    all_errors.append(
                        "assets/search-index.js : sections absentes : "
                        + ", ".join(f"{sub}#{anchor}" for sub, anchor in sorted(missing_search)[:12])
                    )
                if stale_search:
                    all_errors.append(
                        "assets/search-index.js : entrées sans titre de section : "
                        + ", ".join(f"{sub}#{anchor}" for sub, anchor in sorted(stale_search)[:12])
                    )
                for sub in EXPECTED_SUBJECTS:
                    expected_script = "../assets/search-index.js"
                    if expected_script not in scripts_by_page.get(sub, []):
                        all_errors.append(f"{sub}/index.html : chargement de search-index.js absent")
        else:
            all_errors.append("assets/search-index.js introuvable (recherche inter-matières)")

    print("=" * 60)
    if all_errors:
        print(f"{len(all_errors)} erreur(s) au total :")
        for e in all_errors:
            print(f"  ✗ {e}")
        return 1
    print("✓ Tous les contrôles passent.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
