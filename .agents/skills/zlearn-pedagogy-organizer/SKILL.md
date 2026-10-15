---
name: zlearn-pedagogy-organizer
description: Analyser une transcription de cours Zlearn et en faire un plan de leçon fidèle, sans modifier les pages du site. À utiliser comme étape d'analyse avant toute intégration de dars.
---

# Analyse pédagogique d'une transcription

Lis `SKILL-general.md` en entier et `.opencode/skills/transcript-to-lesson/references/project-conventions.md`.
Lis la transcription entière. Ne modifie aucun fichier du site pendant cette étape.

Établis matière, numéro et titre. Si une donnée structurante reste incertaine, expose
l'incertitude et demande confirmation au lieu de deviner. Repère les chapitres réellement
traités, définitions, règles, classifications, exemples, dates, noms propres et éléments
utiles à l'examen. Signale les erreurs manifestes d'ASR et les passages ambigus.

Organise le contenu en objectifs observables, orientation, explications progressives,
exemples travaillés, pratique avec réponses expliquées, glossaire et synthèse. Les aides de
mémorisation restent secondaires. Propose un tableau, arbre, étapes ou autre visuel seulement
quand il aide la compréhension. N'ajoute aucun fait absent de la source sans vérification
et attribution explicite.

Livrable de travail : métadonnées (matière, numéro, titre, préfixe d'id, clé de progression),
plan détaillé, glossaire, questions avec réponses, checklist, et section « À vérifier ».
Si un brouillon fichier est nécessaire au workflow, le nommer `brouillon-dars-<id>.md` et le
supprimer après intégration et validation. Répondre dans la langue de l'utilisateur.
