---
name: zlearn-ameliorer-site
description: "Améliorer un aspect demandé du site Zlearn (UX, interface, RTL, accessibilité, performance, moteur d'apprentissage) sans casser les leçons, la progression, le RTL ou les interactions. À utiliser pour toute modification qui n'est pas l'ajout d'un dars."
---

# Améliorer le site

Traite l'axe demandé par l'utilisateur (par défaut : audit UX, UI, RTL et accessibilité, avec
propositions avant modification). Lis `docs/conventions.md` et applique
`zlearn-rtl-arabe-a11y` si l'interface est concernée.

Avant une modification importante : branche git ou commit propre. Préserve toutes les leçons
et les clés de progression `localStorage` (toute migration de clés doit conserver les données
existantes). Les styles et scripts partagés restent dans `assets/site.css` et
`assets/site.js`. Toute nouvelle interaction doit fonctionner. Respecte les variables CSS, les
thèmes clair/sombre, les propriétés logiques, le RTL et la lisibilité à 400 px. Si le nombre
de cases ou de dars change, ajuste le manifeste `ZLEARN_MATIERES`.

Lance `python3 scripts/validate_site.py .` après modification et rapporte les fichiers
modifiés et le résultat exact.
