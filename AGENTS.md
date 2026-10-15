# Zlearn — instructions projet

Site d'apprentissage de la première année (enseignement zaytounien) en arabe RTL : un site
**statique multi-pages** (accueil + un dossier par matière + assets partagés), sans
dépendance runtime. Objectif : que l'étudiant **comprenne, pratique et retienne**, pas
seulement qu'il relise (voir `README.md`).

> **Chantier en cours** : `RESTRUCTURATION.md` décrit la nouvelle architecture cible
> (contenu en données, gabarits, moteur de révision espacée). Tant que ce chantier n'est pas
> terminé, ce fichier décrit l'architecture **actuelle** et ses règles s'appliquent. À la fin
> du chantier, mettre à jour ce fichier, les skills et `docs/conventions.md`.

## Carte du dépôt

```text
index.html, <matière>/index.html   pages du site (matières : fiqh aqida tajwid sira hadith akhlaq nahw)
assets/                            site.css, site.js (+ manifeste ZLEARN_MATIERES), search-index.js
scripts/                           validate_site.py, merge_lesson.py, dom_test.cjs
templates/lesson-block.html        gabarit d'un dars
docs/                              conventions.md (DOM, ids, progression), exemple-transformation.md
SKILL-general.md                   référence fonctionnelle : transcription → leçon
.agents/skills/                    skills (source unique, lues par OpenCode et Codex)
.opencode/agents/, commands/       sous-agents et commandes propres à OpenCode
```

Une page de matière est **l'unique** document à modifier pour cette matière. Ne jamais créer
un site parallèle ni réinitialiser des contenus existants.

## Règles non négociables

1. **Préserver le contenu pédagogique** : ne jamais supprimer ni remplacer un dars existant.
2. **Filet de sécurité = git** : travailler sur une branche (`lesson/<matière>-<n>`) ou après
   un commit propre ; vérifier `git status` avant de commencer. `backups/` est un dossier
   local optionnel, ignoré par git.
3. **Fidélité à la source** : rien d'inventé. Un complément extérieur n'est ajouté que s'il est
   vérifié, étiqueté **إضافة تعليمية** et sourcé ; sinon il est signalé à l'utilisateur. Pas de
   poème, verset ou long passage recopié : paraphraser.
4. Chaque section reçoit un **id unique préfixé par le dars** (ex. `nh4-summary`). Cases,
   ids SVG, `data-key` et cibles de quiz sont uniques dans la page.
5. Le site reste **lisible à 400 px**, RTL, thème clair/sombre cohérent.
6. Interactions réelles uniquement : pas de maquette, pas de bouton mort.
7. Après toute modification : `python3 scripts/validate_site.py .` doit passer.
8. **Honnêteté** : ne jamais affirmer qu'un contrôle a réussi sans l'avoir exécuté ; rapporter
   la commande et son résultat exact.
9. Si la matière ou le numéro d'un dars est incertain : **poser une question** avant d'agir.

## Commandes

```sh
python3 scripts/validate_site.py .        # contrôle obligatoire (toutes les pages + manifeste)
node --check assets/site.js               # syntaxe JS
node scripts/dom_test.cjs                 # test DOM optionnel (npm install jsdom au préalable)
python3 -m http.server 8000               # voir le site sur http://localhost:8000/
```

## Workflows

| Tâche | OpenCode | Codex / autres outils |
| ----- | -------- | --------------------- |
| Ajouter un dars depuis une transcription | `/nouveau-dars <transcription>` | skill `zlearn-ajouter-dars` |
| Améliorer un aspect du site | `/ameliorer-site <axe>` | skill `zlearn-ameliorer-site` |
| Auditer sans modifier | `/verifier-site` | skill `zlearn-verifier-site` |
| RTL / arabe / accessibilité | skill `zlearn-rtl-arabe-a11y` | `$zlearn-rtl-arabe-a11y` |

L'ajout d'un dars enchaîne trois rôles : `zlearn-pedagogy-organizer` (analyse) →
`zlearn-frontend-integrator` (intégration) → `zlearn-qa-verifier` (contrôle). Sous OpenCode,
ce sont des sous-agents (`.opencode/agents/`) ; sous Codex, ce sont des étapes successives du
même workflow, sans délégation automatique sauf demande explicite de l'utilisateur.

Les skills de `.agents/skills/` sont la **source unique** ; ne pas recréer de copie dans
`.opencode/skills/` (OpenCode lit aussi `.agents/skills/`).

## Fichiers temporaires

`brouillon-dars-<id>.md` (analyse) et `dars-<id>.html` (fragment) sont supprimés dès que le
dars est intégré et validé ; ils sont ignorés par git.

## Style du code

- CSS : variables `--xxx` uniquement, compatibles thème sombre ; pas de couleur en dur ni de
  `style=""` pour la mise en page.
- JS : ES5 vanilla (navigateurs mobiles anciens), IIFE, `localStorage` sous `try/catch`.
- Arabe : `dir="rtl" lang="ar"`, `Amiri` (titres) + `IBM Plex Sans Arabic` (texte).
- Progression : agrégat de page sous `mourshid-prog-<matière>`, dars terminés sous
  `mourshid-learning-<matière>`. Les `total` et `lessons` du manifeste `ZLEARN_MATIERES`
  (`assets/site.js`) doivent correspondre aux cases et dars réels. Ne jamais renommer une clé
  `localStorage` ou un préfixe d'id sans migration des données existantes.

## Définition de « terminé » pour un dars

Le validateur passe ; l'onglet, les chips, la carte d'accueil, l'index de recherche et le
manifeste sont à jour ; 8 à 12 questions (rappel, compréhension, application) avec réponses
expliquées ; aucune source extérieure non étiquetée ; fichiers temporaires supprimés ; la
réponse finale liste matière, numéro, ajouts, « À vérifier » et résultat du validateur.
