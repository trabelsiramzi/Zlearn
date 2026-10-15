---
name: zlearn-ajouter-dars
description: Ajouter au site Zlearn une leçon depuis une transcription, en analysant son contenu, en l'intégrant à la bonne matière et en vérifiant le résultat. À utiliser pour toute demande d'ajout de dars ou chapitre.
---

# Ajouter un dars à Zlearn

Suis les procédures `zlearn-pedagogy-organizer`, `zlearn-frontend-integrator` et
`zlearn-qa-verifier`, dans cet ordre. Lis `SKILL-general.md` et les conventions du projet
avant de rédiger. Le site est statique et multi-pages ; la page de la matière est la cible.

1. Lire toute la transcription et identifier matière, numéro et titre. Si la matière ou le
   numéro ne sont pas établis avec confiance, poser une question ciblée avant l'intégration.
2. Vérifier dans la page matière que le dars n'existe pas déjà.
3. Produire un plan fidèle à la source, puis construire une leçon qui enseigne, fait
   pratiquer avec feedback, et guide vers la suite. Ne pas inventer de contenu.
4. Sauvegarder la page matière avant une modification importante. Créer un fragment séparé
   à partir de `templates/lesson-block.html`, puis utiliser
   `.opencode/skills/transcript-to-lesson/scripts/merge_lesson.py` avec une ancre unique.
   Le bloc doit être enfant direct de `.subject`.
5. Mettre à jour les onglets, liens de sections, index de recherche et manifeste selon les
   changements. Garder les clés de progression existantes.
6. Exécuter `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .` et
   corriger les erreurs causées par l'ajout.
7. Supprimer les fragments et brouillons temporaires après intégration.

Ne pas prétendre qu'une vérification a réussi sans l'avoir exécutée. En réponse, indiquer
la matière et le numéro, les changements, les incertitudes de transcription, les fichiers,
la sauvegarde et le résultat exact du validateur.
