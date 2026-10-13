---
description: Ajouter un nouveau dars au site à partir d'une transcription
---
Tu vas ajouter **un dars** au site Zlearn (multi-pages : `index.html` + un dossier par
matière) à partir de la transcription fournie par l'utilisateur.

Entrée utilisateur : `$ARGUMENTS`
(une transcription collée, un chemin de fichier `.txt/.md/.pdf.txt`, ou une URL de
sous-titres). Si l'entrée est vide, demande la transcription.

Déroulé obligatoire :

1. Charge la compétence `transcript-to-lesson` et lis `SKILL-general.md` en entier.
2. **Certitude d'abord** : matière (`fiqh`|`aqida`|`tajwid`|nouvelle) et numéro du dars.
   Si l'un des deux est incertain, **pose une question ciblée et arrête-toi**.
   Vérifie qu'il n'existe pas déjà (doublon) dans la page de la matière.
3. Lance le sous-agent **pedagogy-organizer** avec la transcription et les métadonnées.
   Il produit `brouillon-dars-<id>.md` (plan fidèle + quiz + checklist + « À vérifier »).
4. Lance le sous-agent **frontend-integrator** avec le brouillon et le chemin de la page
   de la matière (`<matière>/index.html`). Il sauvegarde, écrit le bloc depuis le gabarit,
   fusionne via `merge_lesson.py`, met à jour onglet + chips (+ nouvelle matière si besoin,
   soit dossier + carte d'accueil + manifeste `ZLEARN_MATIERES`) et lance le validateur.
5. Lance le sous-agent **qa-verifier** pour le contrôle final indépendant.
6. Corrige les éventuels problèmes signalés, puis relance le validateur.
7. Réponse finale (format de `SKILL-general.md`) :
   - « Ajouté : matière, dars n°, contenu ».
   - « À vérifier : corrections, dates/noms incertains, ajouts, numérotation ».
   - fichiers modifiés, chemin de la sauvegarde, résultat du validateur.

Rappels : ne jamais supprimer/remplacer un dars existant ; interactions réelles ;
RTL + responsive ; ids uniques par page ; mettre à jour le `total` du manifeste si des
cases sont ajoutées. Ne prétends jamais qu'un test est passé sans l'avoir exécuté.
