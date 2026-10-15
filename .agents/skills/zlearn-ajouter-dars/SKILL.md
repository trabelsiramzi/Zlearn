---
name: zlearn-ajouter-dars
description: "Ajouter au site Zlearn un dars (leçon) à partir d'une transcription de cours : analyse fidèle, construction du parcours (objectifs, explications, exemples, pratique, questions), intégration dans la page de la matière, mise à jour de la navigation, de la recherche et du manifeste, puis validation. À utiliser pour toute demande d'ajout de dars, de chapitre ou de matière."
---

# Ajouter un dars à Zlearn

Workflow complet en trois rôles successifs : `zlearn-pedagogy-organizer` (analyse),
`zlearn-frontend-integrator` (intégration), `zlearn-qa-verifier` (contrôle). Sous OpenCode,
la commande `/nouveau-dars` les orchestre avec des sous-agents ; ailleurs, applique ces
trois rôles toi-même, dans cet ordre.

Références à lire d'abord : `SKILL-general.md` (règles de fond), `docs/conventions.md`
(DOM, préfixes d'id, manifeste), `docs/exemple-transformation.md` (exemple illustratif).

## Étape 0 — Établir la certitude

Déterminer la **matière** (`fiqh`, `aqida`, `tajwid`, `sira`, `hadith`, `akhlaq`, `nahw` ou
nouvelle), le **numéro** et le **titre** du dars. Si la matière ou le numéro ne sont pas
établis avec confiance, **poser une question ciblée et s'arrêter**. Ne jamais deviner un
numéro. Vérifier dans la page de la matière que le dars n'existe pas déjà.

## Étape A — Analyser la transcription

1. Lire la transcription **en entier**.
2. Corriger les erreurs manifestes d'auto-transcription **seulement** quand le contexte rend
   la correction certaine. Signaler chaque correction, approximation ou passage ambigu dans
   la réponse à l'utilisateur (jamais dans la page). Ne rien inventer.
3. Repérer définitions, règles, classifications, exemples, dates, noms propres, points
   d'examen.

## Étape B — Construire le parcours

Ordre du dars : en-tête et 2 à 4 objectifs observables → résumé en trois phrases → carte
mentale → explications par blocs courts (tableau, arbre, étapes ou cartes selon le contenu)
avec exemple résolu puis exemple parallèle à tenter → glossaire → cases de mémorisation →
questions (rappel, compréhension, application, réponses expliquées) → activité d'application.
Les résumés, cases et quiz sont des aides complémentaires, pas le cœur du parcours.

Un complément extérieur à la transcription n'est ajouté que s'il est vérifié ; il est
étiqueté **إضافة تعليمية** avec sa source. Sinon, le signaler à l'utilisateur.

## Étape C — Intégrer

1. Filet de sécurité : travailler sur une branche git (`lesson/<matière>-<n>`) ou après un
   commit propre. Une copie dans `backups/` (ignoré par git) est optionnelle.
2. Écrire le bloc dans un fichier séparé `dars-<id>.html` depuis `templates/lesson-block.html`
   (remplacer tous les placeholders ; aucun ne doit rester).
3. Fusionner :
   ```sh
   python3 scripts/merge_lesson.py --site <matière>/index.html --fragment dars-<id>.html
   ```
   Le script vérifie une ancre unique (fermeture du `.subject` avant `</main>`) et échoue
   sinon. Ne jamais ancrer sur le `</div>` du dars précédent : le nouveau dars serait
   imbriqué dans l'ancien.
4. Dans la page de la matière : onglet `.tab` (avec `id` et `aria-controls`) et ligne `.chips`.
5. Mettre à jour : carte de la matière dans `index.html` (+ total de la progression globale),
   `assets/search-index.js` (une entrée par section) et le manifeste `ZLEARN_MATIERES` dans
   `assets/site.js` (`total` = nombre de cases, `lessons` = nombre de dars).
6. Nouvelle matière : dossier `<id>/index.html`, carte d'accueil, entrée du manifeste,
   entrée de `EXPECTED_SUBJECTS` dans `scripts/validate_site.py`.
7. Valider : `python3 scripts/validate_site.py .` et corriger les erreurs causées par l'ajout.
8. Supprimer `dars-<id>.html` et tout `brouillon-dars-<id>.md`.

## Règles de contenu

- Ne jamais recopier un poème, des versets ou de longs passages : paraphraser. Pour la
  mémorisation d'un texte, fournir une zone vide où l'apprenant colle son propre texte.
- Pas de section « notes sur la transcription » dans la page : elles vont dans la réponse.
- Ne jamais supprimer ni remplacer un dars existant ; garder les clés de progression.
- Ton simple, progressif, orienté compréhension et application.

## Réponse finale

Ne pas affirmer qu'une vérification a réussi sans l'avoir exécutée. Indiquer : matière et
numéro du dars, contenu ajouté, « À vérifier » (corrections, dates/noms incertains, ajouts
extérieurs, numérotation), fichiers modifiés et résultat exact du validateur.
