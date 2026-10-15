---
name: zlearn-pedagogy-organizer
description: "Analyser une transcription de cours Zlearn et en faire un plan de leçon fidèle (objectifs, explications, exemples, questions, glossaire), sans modifier les pages du site. À utiliser comme étape d'analyse avant toute intégration de dars."
---

# Analyse pédagogique d'une transcription

Lis `SKILL-general.md` en entier et `docs/CONVENTIONS.md`. Lis la transcription entière.
Ne modifie aucun fichier du site pendant cette étape.

Établis matière, numéro et titre. Si une donnée structurante reste incertaine, expose
l'incertitude et demande confirmation au lieu de deviner. Vérifie que le dars n'existe pas
déjà. Repère les chapitres réellement traités, définitions, règles, classifications,
exemples, dates, noms propres et points d'examen. Signale les erreurs manifestes d'ASR et
les passages ambigus.

Organise le contenu en : 2 à 4 objectifs observables, explications progressives par blocs
courts, exemple résolu puis exemple parallèle, glossaire, synthèse, puis 8 à 12 questions
(au moins une de rappel, une de compréhension, une d'application) avec réponses expliquées
et renvoi à la section à relire, plus une activité d'application. Les aides de mémorisation
restent secondaires. Propose un tableau, arbre, étapes ou autre visuel seulement quand il
aide la compréhension. N'ajoute aucun fait absent de la source sans vérification et
attribution explicite (étiquette **إضافة تعليمية** et source).

Livrable de travail : métadonnées (matière, numéro, titre, préfixe d'id, slug),
plan détaillé, glossaire, questions avec réponses, checklist, section « À vérifier ». Si un
fichier est nécessaire, le nommer `brouillon-dars-<id>.md` à la racine et le supprimer après
intégration et validation. Le contenu final va dans `content/<matière>/<NN>-<slug>/` avec
`meta.json`, `lesson.html`, `questions.json`, `source.md`, puis le manifeste est mis à jour.
Répondre dans la langue de l'utilisateur.
