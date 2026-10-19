---
name: course-learning-document
description: Build a cumulative Zlearn lesson from a transcript, preserving source fidelity and producing the content data consumed by the static site builder.
---

# Zlearn — méthode de création pédagogique

## Fidélité

1. Lire intégralement la transcription et vérifier le contenu publié de la matière.
2. Garder l’explication de l’enseignant comme cours principal. Corriger une erreur de
   transcription uniquement si le contexte la rend certaine, et le signaler à l’utilisateur.
3. Séparer tout complément vérifié du cours, l’étiqueter **إضافة تعليمية** et citer sa
   source. Sinon, noter « à confirmer avec l’enseignant ».
4. Présenter les avis propres à l’enseignant comme tels. Paraphraser poèmes, versets et longs
   passages protégés ; proposer une zone blanche de mémorisation.
5. Ne pas supprimer ni remplacer une leçon publiée.

## Parcours d’apprentissage

Ordre conseillé : 2 à 4 objectifs observables,
explications courtes et ordonnées, exemples résolus suivis d’exemples parallèles, pratique
avec retour expliqué, synthèse et lien vers la suite. Viser 8 à 12 questions de rappel,
compréhension et application. Chaque question a une réponse expliquée, une section de retour
et un id stable `<id>-q<NN>`. Les questions deviennent révisables après une première
tentative. Une checklist est une aide d’autoévaluation, pas une preuve de maîtrise.

## Données de leçon

Créer `content/<matière>/<NN>-<slug>/` avec :

- `meta.json` correspondant à l’entrée ajoutée dans `content/subjects.json` ;
- `lesson.html`, fragment HTML du cours, arabe RTL ;
- `questions.json`, banque structurée avec ids stables ;
- `source.md`, transcription originale (ou mention honnête si elle n’a pas été conservée).

Créer le squelette avec `python3 scripts/new_lesson.py <matière> <NN> <slug> <titre>
<titre-court>`. Vérifier matière, numéro et titre avant de créer ; demander si incertain.
Mettre ensuite à jour `content/subjects.json` sans modifier les ids déjà publiés.

Construire et valider :

```sh
python3 scripts/build.py
python3 scripts/validate.py
python3 scripts/build.py --check
```

Le texte reste lisible sans JavaScript. Respecter `docs/CONVENTIONS.md`, les règles RTL et
les clés v2 de progression. Répondre dans la langue de l’utilisateur en indiquant les
modifications, validations exécutées et points « À vérifier ».
