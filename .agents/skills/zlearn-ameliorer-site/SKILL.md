---
name: zlearn-ameliorer-site
description: Améliorer un aspect demandé du site Zlearn sans casser les leçons, la progression, le RTL ou les interactions.
---

# Améliorer le site

Traite l'axe demandé par l'utilisateur (par défaut, audit UX, UI, RTL et accessibilité).
Lis les conventions pertinentes et applique `zlearn-rtl-arabe-a11y` si l'interface est
concernée.

Avant une modification importante, sauvegarde la page ou l'asset concerné dans `backups/`.
Préserve toutes les leçons et les clés de progression. Les styles et scripts partagés restent
dans `assets/site.css` et `assets/site.js`. Toute nouvelle interaction doit fonctionner.
Respecte les variables CSS, les thèmes clair/sombre, les propriétés logiques, le RTL et la
lisibilité à 400 px. Si le nombre de cases change, ajuste le manifeste. Lance le validateur
du projet après modification et rapporte les fichiers, la sauvegarde et le résultat exact.
