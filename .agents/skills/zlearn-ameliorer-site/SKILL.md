---
name: zlearn-ameliorer-site
description: "Améliorer le site Zlearn sans casser les leçons, la progression, le RTL ou les interactions."
---

# Améliorer Zlearn

Lis `docs/CONVENTIONS.md` et applique `zlearn-rtl-arabe-a11y` si une interface est concernée.
Avant une modification importante, vérifie la branche et `git status`.

Préserve toutes les leçons et clés de progression. Les données éditoriales vivent sous
`content/`; styles et scripts source dans `assets/` et `src/`; gabarits dans `templates/`.
`site/` est généré et ne se modifie jamais à la main. Les interactions doivent fonctionner.
Respecte RTL, variables CSS, thèmes, propriétés logiques, accessibilité et largeur 400 px.
Si les données de leçons changent, mets à jour `content/subjects.json`.

Après modification, exécute `python3 scripts/build.py`, `python3 scripts/validate.py` et
`python3 scripts/build.py --check`. Rapporte fichiers et résultats exacts.
