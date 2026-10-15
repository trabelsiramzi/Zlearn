---
name: zlearn-rtl-arabe-a11y
description: Concevoir ou corriger une interface Zlearn en arabe RTL, accessible au clavier et aux lecteurs d'écran, lisible sur mobile et cohérente en thèmes clair et sombre.
---

# RTL arabe et accessibilité

Applique les règles de `.opencode/skills/rtl-arabic-a11y/SKILL.md`. Points essentiels :

- Racine `lang="ar" dir="rtl"` ; préférer les propriétés CSS logiques à `left`/`right`.
- Isoler les séquences latines avec `dir="ltr"` quand le mélange bidirectionnel nuit à la
  lecture. Conserver les chiffres et diacritiques de la source.
- Typographie arabe lisible : Amiri pour les titres, IBM Plex Sans Arabic pour le texte,
  repli Tahoma ; taille de base au moins 17 px et interligne généreux.
- Couleurs via variables avec valeurs adaptées au clair et au sombre ; ne jamais transmettre
  une information par la couleur seule. Focus clavier visible et ordre de tabulation logique.
- Maintenir un seul `h1`, des niveaux de titres cohérents, un lien d'évitement et des
  attributs ARIA utiles. Les SVG informatifs ont `role="img"` et un nom accessible.
- Rester utilisable à 400 px ; contenir le défilement des diagrammes larges sans provoquer
  de défilement horizontal de page. Respecter les préférences de mouvement réduit.
- Aucun bouton mort, lien `#` vide, contrôle non accessible au clavier ou id dupliqué.
