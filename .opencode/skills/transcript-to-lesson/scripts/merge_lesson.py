#!/usr/bin/env python3
"""Fusionne un bloc de dars (fichier HTML séparé) dans une page matière du site.

Le site est multi-pages : chaque matière vit dans son dossier (``fiqh/index.html``,
``aqida/index.html``, ``tajwid/index.html``). Un nouveau dars s'ajoute donc dans la page
de sa matière.

Méthode recommandée par SKILL-general.md (§Technique, gros fichiers) : écrire la
nouvelle leçon dans un fichier à part, puis fusionner par remplacement de chaîne
**avec vérification que l'ancre apparaît exactement une fois**.

Usage :
    python3 merge_lesson.py \
        --site "../../fiqh/index.html" \
        --fragment dars-l4.html

Options :
    --anchor TEXTE   marqueur d'insertion (défaut : fermeture du .subject avant </main>)
    --after          insérer après l'ancre (défaut : avant)
    --backups DIR    dossier des sauvegardes (défaut : backups/ à la racine)
    --dry-run        afficher ce qui serait fait sans écrire
    --no-backup      ne pas créer de sauvegarde (déconseillé)

Le script :
  1. lit le site et le fragment ;
  2. vérifie que l'ancre apparaît **exactement une fois** ;
  3. sauvegarde le site dans backups/ (sauf --no-backup) ;
  4. écrit le résultat ;
  5. lance le validateur et rapporte.
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def find_backups(site: Path) -> Path:
    """Remonte jusqu'à la racine du dépôt (dossier contenant AGENTS.md) pour backups/."""
    for d in [site.parent.resolve(), *site.parent.resolve().parents]:
        if (d / "AGENTS.md").exists():
            return d / "backups"
    return site.parent / "backups"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--site", required=True)
    ap.add_argument("--fragment", required=True)
    ap.add_argument("--anchor", default="</div>\n\n</main>")
    ap.add_argument("--after", action="store_true")
    ap.add_argument("--backups", default=None)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-backup", action="store_true")
    args = ap.parse_args()

    site = Path(args.site)
    frag = Path(args.fragment)
    for p in (site, frag):
        if not p.exists():
            print(f"[ERREUR] introuvable : {p}", file=sys.stderr)
            return 2

    html = site.read_text(encoding="utf-8")
    fragment = frag.read_text(encoding="utf-8").strip()

    occurrences = html.count(args.anchor)
    if occurrences != 1:
        print(f"[ERREUR] l'ancre apparaît {occurrences} fois (attendu : 1).", file=sys.stderr)
        print("Ancre fournie :\n" + args.anchor, file=sys.stderr)
        return 1

    injection = (args.anchor + "\n" + fragment) if args.after else (fragment + "\n" + args.anchor)
    out = html.replace(args.anchor, injection, 1)

    if args.dry_run:
        print(f"[dry-run] {site} : {len(html)} → {len(out)} octets (+{len(out)-len(html)})")
        return 0

    if not args.no_backup:
        backups = Path(args.backups) if args.backups else find_backups(site)
        backups.mkdir(parents=True, exist_ok=True)
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        if site.stem == "index":
            name = f"{site.parent.name}-{site.stem}.{stamp}{site.suffix}"
        else:
            name = f"{site.stem}.{stamp}{site.suffix}"
        backup = backups / name
        backup.write_text(html, encoding="utf-8")
        print(f"Sauvegarde : {backup}")

    site.write_text(out, encoding="utf-8")
    print(f"Écrit : {site} ({len(out)} octets)")

    validator = HERE / "validate_site.py"
    if validator.exists():
        print("\nValidation :")
        rc = subprocess.run([sys.executable, str(validator), str(site)]).returncode
        return rc
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
