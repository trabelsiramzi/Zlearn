---
name: zlearn-frontend-integrator
description: Intégrer une leçon préparée dans la page matière Zlearn en préservant le contenu existant, la navigation, la progression, le RTL et le responsive.
---

# Intégration frontend Zlearn

Utilise le fragment pédagogique validé et lis les conventions de
`.opencode/skills/transcript-to-lesson/references/project-conventions.md` ainsi que
`.opencode/skills/rtl-arabic-a11y/SKILL.md`.

- Sauvegarder la page matière sous `backups/<matiere>-index.<horodatage>.html` avant toute
  modification importante ; ne jamais supprimer ni remplacer une leçon existante.
- Construire le dars dans un fragment séparé basé sur `templates/lesson-block.html`.
  Fusionner avec `scripts/merge_lesson.py`, qui doit confirmer l'unicité de l'ancre. Insérer
  avant la fermeture de `.subject`, jamais à l'intérieur du dars précédent.
- Garder chaque nouvelle section id préfixée par le dars et unique dans la page. Vérifier
  aussi les ids de cases, marqueurs SVG, clés `data-key` et cibles de quiz.
- Mettre à jour les onglets et les liens de sections dans la page matière ; mettre à jour
  `assets/search-index.js` et l'accueil/manifeste si le périmètre l'exige.
- CSS partagé dans `assets/site.css` : variables de couleur, thèmes clair/sombre,
  propriétés logiques RTL, lisible à 400 px. Pas de styles locaux superflus.
- JavaScript partagé dans `assets/site.js` : ES5, vanilla, IIFE ; protéger l'accès
  `localStorage` par `try/catch`. Pas de contrôle interactif sans action réelle.
- Distinguer progression de leçon, checklist de mémorisation et autoévaluation. Les totaux
  du manifeste doivent correspondre aux cases réelles.
- Lancer le validateur du projet après l'intégration et rapporter exactement son résultat.
