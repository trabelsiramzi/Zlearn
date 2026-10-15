---
description: "Ajouter un dars depuis une transcription au modèle de contenu Zlearn"
---

Ajoute un dars à Zlearn à partir de `$ARGUMENTS` (transcription ou chemin). Si l'entrée est
vide, demande la transcription.

État git : !`git status --short --branch`

1. Lire les skills Zlearn concernés, `SKILL-general.md` et `docs/CONVENTIONS.md`.
2. Confirmer matière, numéro, titre, transcription complète et absence de doublon. Si matière
   ou numéro incertain, demander avant tout changement.
3. Travailler sur `lesson/<matière>-<NN>` après vérification du statut Git. Ne jamais
   supprimer ou remplacer une leçon publiée.
4. Faire successivement l'analyse pédagogique, l'intégration de `content/` et le contrôle QA.
   Sous OpenCode, utiliser les agents définis dans `.opencode/agents/`.
5. Créer le dossier avec `python3 scripts/new_lesson.py`, compléter `meta.json`,
   `lesson.html`, `questions.json`, `source.md` et `content/subjects.json`.
6. Générer puis valider : `python3 scripts/build.py`, `python3 scripts/validate.py`,
   `python3 scripts/build.py --check`. Lancer les tests moteur concernés.
7. Ne jamais éditer `site/` à la main. Les questions et ids publiés restent stables.

Réponse finale : matière, numéro, contenu ajouté, fichiers, résultats exacts et « À vérifier ».
