---
name: zlearn-ajouter-dars
description: "Créer un dars Zlearn depuis sa transcription dans content/, générer le site et valider la livraison."
---

# Ajouter un dars à Zlearn

Références : `SKILL-general.md`, `docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`.

1. Confirmer matière, numéro, titre et absence de doublon. Si matière ou numéro sont
   incertains, poser une question avant toute modification.
2. Vérifier `git status` et travailler sur `lesson/<matière>-<NN>` (ou la branche propre
   demandée par l’utilisateur). Ne jamais supprimer ni remplacer un dars existant.
3. Lire la transcription en entier et bâtir le parcours selon `SKILL-general.md`.
4. Créer le dossier avec `python3 scripts/new_lesson.py <matière> <NN> <slug> <titre>
   <titre-court>`, puis compléter `meta.json`, `lesson.html`, `questions.json` et `source.md`.
   Ajouter la même métadonnée dans `content/subjects.json` ; maintenir sections, compteurs,
   liens précédent/suivant, index de recherche et catalogue cohérents au build.
5. Préserver les ids stables existants. Les questions suivent `<id>-q<NN>`, référencent une
   section réelle, contiennent réponse et explication, et couvrent rappel, compréhension et
   application. N’inventer aucune information ; marquer les incertitudes.
6. Exécuter `python3 scripts/build.py`, `python3 scripts/validate.py` et
   `python3 scripts/build.py --check`. Exécuter les tests pertinents du moteur si celui-ci a
   été touché. Comparer les contenus migrés à `tests/baseline.json`.
7. Ne jamais éditer `site/` directement. Ne pas supprimer `tests/baseline.json` ni
   `scripts/migrate_v1.py` sans confirmation explicite.

Réponse : matière, numéro, ajouts, fichiers, commandes/résultats exacts et « À vérifier ».
