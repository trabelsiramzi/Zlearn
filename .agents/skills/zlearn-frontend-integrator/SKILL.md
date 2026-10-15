---
name: zlearn-frontend-integrator
description: "Intégrer une leçon préparée dans la page matière Zlearn en préservant le contenu existant, la navigation, la progression, le RTL et le responsive. À utiliser après l'analyse pédagogique d'un dars."
---

# Intégration frontend Zlearn

Utilise le plan validé et lis `docs/conventions.md` ainsi que la skill `zlearn-rtl-arabe-a11y`.

- **Filet de sécurité** : branche git ou commit propre avant toute modification. Une copie
  dans `backups/` (ignoré par git) reste optionnelle. Ne jamais supprimer ni remplacer une
  leçon existante.
- Construire le dars dans `dars-<id>.html` depuis `templates/lesson-block.html`, puis
  fusionner avec `python3 scripts/merge_lesson.py --site <matière>/index.html --fragment
  dars-<id>.html`. Le script confirme l'unicité de l'ancre et insère avant la fermeture de
  `.subject`, jamais à l'intérieur du dars précédent.
- Ids de sections préfixés par le dars et uniques dans la page ; vérifier aussi les ids de
  cases, marqueurs SVG, clés `data-key` et cibles de quiz.
- Mettre à jour dans la page de la matière l'onglet `.tab` (`id`, `aria-controls`) et la ligne
  `.chips` ; mettre à jour la carte de l'accueil, `assets/search-index.js` et le manifeste
  `ZLEARN_MATIERES` (`total`, `lessons`).
- CSS partagé dans `assets/site.css` : variables, thèmes clair/sombre, propriétés logiques,
  lisible à 400 px ; aucun style inline ni bloc `<style>` local.
- JS partagé dans `assets/site.js` : ES5 vanilla, IIFE, `localStorage` sous `try/catch`.
  Pas de contrôle interactif sans action réelle.
- Distinguer progression de leçon, checklist de mémorisation et autoévaluation. Les totaux du
  manifeste doivent correspondre aux cases réelles.
- Supprimer les fichiers temporaires (`dars-<id>.html`, brouillon) après validation.
- Lancer `python3 scripts/validate_site.py .` et rapporter exactement son résultat.
