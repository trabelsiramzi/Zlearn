#!/usr/bin/env python3
"""Validateur statique du site de révision Zlearn (multi-pages).

Le site est découpé en : ``index.html`` (accueil) + un dossier par matière
(``fiqh/``, ``aqida/``, ``tajwid/``, ``sira/``, ``hadith/``) + ``assets/site.css`` et ``assets/site.js``.

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
  - les trois matières sont présentes dans l'arborescence ;
  - le manifeste ``ZLEARN_MATIERES`` de ``assets/site.js`` liste chaque matière une fois
    et son ``total`` correspond au nombre réel de cases à cocher de sa page.

Sortie : rapport lisible, code retour ≠ 0 si au moins une erreur.
Aucune dépendance externe (bibliothèque standard Python uniquement).
"""

from __future__ import annotations

import os
import re
import sys
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
EXPECTED_SUBJECTS = ("fiqh", "aqida", "tajwid", "sira", "hadith")


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
        if tag in self.open_stack:
            while self.open_stack:
                top = self.open_stack.pop()
                if top == tag:
                    break
        else:
            self.stack_errors.append(f"ligne {self.getpos()[0]} : </{tag}> sans ouvrante")
        while self._group_stack and self._group_stack[-1]["depth"] > len(self.open_stack):
            self._group_stack.pop()

    def handle_data(self, data):
        if self._capture is not None:
            self._capture["group"]["label"] += data

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


def manifest_totals(site_js: str) -> dict[str, int]:
    totals: dict[str, int] = {}
    for m in re.finditer(r'id:\s*"([^"]+)"[\s\S]*?total:\s*(\d+)', site_js):
        totals[m.group(1)] = int(m.group(2))
    return totals


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

    for page in pages:
        parser, errors, warnings = validate_file(page)
        subjects_seen.extend(parser.subjects)
        if parser.subjects:
            totals_by_page[parser.subjects[0]] = parser.checkbox_total
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
            declared = manifest_totals(open(site_js, encoding="utf-8").read())
            for sub in EXPECTED_SUBJECTS:
                if sub not in declared:
                    all_errors.append(f"manifeste assets/site.js : matière « {sub} » absente")
                elif sub in totals_by_page and declared[sub] != totals_by_page[sub]:
                    all_errors.append(
                        f"manifeste assets/site.js : total de « {sub} » = {declared[sub]} "
                        f"mais {totals_by_page[sub]} cases dans {sub}/index.html"
                    )
        else:
            all_errors.append("assets/site.js introuvable (manifeste de progression)")

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
