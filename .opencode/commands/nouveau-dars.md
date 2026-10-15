---
description: "Ajouter un nouveau dars au site à partir d'une transcription"
---
Tu vas ajouter **un dars** au site Zlearn (multi-pages : `index.html` + un dossier par
matière) à partir de la transcription fournie.

Entrée utilisateur : `$ARGUMENTS`
(transcription collée ou chemin d'un fichier `.txt`/`.md`). Si l'entrée est vide, demande
la transcription.

État git actuel :
!`git status --short`

Déroulé obligatoire :

1. Charge la skill `zlearn-ajouter-dars` et lis `SKILL-general.md` en entier.
2. **Certitude d'abord** : matière (`fiqh`, `aqida`, `tajwid`, `sira`, `hadith`, `akhlaq`,
   `nahw` ou nouvelle) et numéro du dars. Si l'un des deux est incertain, **pose une
   question ciblée et arrête-toi**. Vérifie que le dars n'existe pas déjà (doublon).
3. Filet de sécurité : si l'état git ci-dessus montre des changements sans rapport, demande
   à l'utilisateur de les commiter ou de choisir une branche. Propose la branche
   `lesson/<matière>-<n>`.
4. Lance le sous-agent **pedagogy-organizer** avec la transcription et les métadonnées. Il
   produit `brouillon-dars-<id>.md` (plan fidèle + questions + checklist + « À vérifier »).
5. Lance le sous-agent **frontend-integrator** avec le brouillon et la page de la matière. Il
   écrit le bloc depuis `templates/lesson-block.html`, fusionne via `scripts/merge_lesson.py`,
   met à jour onglet, chips, accueil, `assets/search-index.js` et manifeste
   `ZLEARN_MATIERES`, puis lance le validateur.
6. Lance le sous-agent **qa-verifier** pour le contrôle final indépendant.
7. Corrige les problèmes signalés, relance `python3 scripts/validate_site.py .`.
8. **Supprime** `brouillon-dars-<id>.md` et `dars-<id>.html` : artefacts temporaires.
9. Réponse finale :
   - « Ajouté » : matière, dars n°, contenu.
   - « À vérifier » : corrections, dates/noms incertains, ajouts extérieurs, numérotation.
   - fichiers modifiés, résultat exact du validateur et du QA.

Rappels : ne jamais supprimer/remplacer un dars existant ; interactions réelles ; RTL et
lisible à 400 px ; ids uniques par page ; manifeste à jour. Ne prétends jamais qu'un test
est passé sans l'avoir exécuté.
