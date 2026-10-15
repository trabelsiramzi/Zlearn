# Zlearn — apprendre la première année zaytounienne

Zlearn est un site d'étude en **arabe (RTL)** pour la première année de l'enseignement
zaytounien. Il transforme les cours (transcriptions des dars) en **parcours d'apprentissage** :
on comprend d'abord, on s'entraîne ensuite, on vérifie enfin sa compréhension.

## Objectif du site

Aider l'étudiant à **comprendre, pratiquer et retenir**, pas seulement relire. Chaque leçon
(dars) suit la même logique :

1. des **objectifs** clairs ;
2. une **explication** par petites étapes, fidèle au cours de l'enseignant ;
3. des **exemples** résolus, puis des exercices à essayer soi-même ;
4. une **pratique avec correction** (questions de rappel, de compréhension, d'application) ;
5. une **synthèse**, un **glossaire** et le passage au dars suivant.

Le site reste fidèle à la source : tout ce qui n'est pas dans le cours est signalé comme
**إضافة تعليمية** (complément) avec sa source, ou renvoyé à la vérification de l'enseignant.

### Matières

الفقه · العقيدة · التجويد · السيرة النبوية · الحديث · الأخلاق · النحو
(7 matières, 3 dars publiés chacune, soit 21 dars).

### Ce que fait le site aujourd'hui

- navigation par matière et par dars, recherche en arabe (insensible aux voyelles brèves) ;
- progression enregistrée **sur l'appareil** (cases de mémorisation, dars terminés, réponses
  aux activités) avec export et import en JSON ;
- thème clair/sombre, lisible à partir de 400 px, utilisable au clavier ;
- aucune dépendance : un site statique, sans compte ni serveur.

### Prévu (voir `RESTRUCTURATION.md`)

Contenu en données et une page par dars, réponse avant correction avec niveau de confiance,
révision espacée (rappel aux bons moments), révision mélangée entre matières, usage hors ligne.

## Voir le site

```sh
python3 -m http.server 8000     # puis ouvrir http://localhost:8000/
```

Servir le dossier est recommandé : la progression (`localStorage`) et les chemins relatifs
fonctionnent mieux que par un simple double-clic sur `index.html`.

## Travailler avec l'IA

Le projet est conçu pour être entretenu avec un assistant de code (OpenCode ou Codex). Ouvre
le dossier du projet dans l'outil ; il lit `AGENTS.md` automatiquement et connaît les règles.

### Commandes OpenCode

| Commande | Ce qu'elle fait |
| -------- | --------------- |
| `/nouveau-dars <transcription ou chemin>` | Ajoute un dars : analyse la transcription, construit la leçon, l'intègre dans la bonne matière, met à jour navigation, recherche et progression, puis vérifie |
| `/verifier-site` | Audite le site **sans rien modifier** et rend un rapport par gravité |
| `/ameliorer-site <axe>` | Améliore un aspect (UX, accessibilité, RTL, performance…) sans casser l'existant |

Exemples :

```text
/nouveau-dars chemin/vers/transcription-nahw-4.txt
/nouveau-dars matière : fiqh, dars 4, titre : أحكام الصلاة — <transcription collée ici>
/ameliorer-site accessibilité au clavier de la page d'accueil
/verifier-site
```

Mieux vaut préciser en tête **la matière**, **le numéro du dars** et **le titre** ; si l'un
d'eux est incertain, l'IA pose la question avant d'agir.

### Skills (Codex et autres outils)

Les mêmes workflows existent sous forme de skills dans `.agents/skills/` :

| Skill | Usage |
| ----- | ----- |
| `zlearn-ajouter-dars` | Ajouter un dars depuis une transcription |
| `zlearn-ameliorer-site` | Améliorer un aspect du site |
| `zlearn-verifier-site` | Auditer sans modifier |
| `zlearn-rtl-arabe-a11y` | Règles RTL, arabe et accessibilité |
| `zlearn-pedagogy-organizer`, `zlearn-frontend-integrator`, `zlearn-qa-verifier` | Les trois étapes de l'ajout d'un dars (analyse, intégration, contrôle) |

Exemple (Codex) : `$zlearn-ajouter-dars` suivi de la transcription et de la matière.

### Lancer la restructuration du projet

Donne `RESTRUCTURATION.md` à l'IA avec la consigne :
« Lis `RESTRUCTURATION.md`, `AGENTS.md` et `docs/conventions.md`, pose les questions de la
section 3, puis exécute la phase 0 et arrête-toi pour me faire un rapport. »
Elle avance **phase par phase**, avec ton accord à chaque étape.

## Vérifier le site soi-même

```sh
python3 scripts/validate_site.py .   # contrôle obligatoire (ids, ancres, progression, manifeste)
node --check assets/site.js          # syntaxe JavaScript
npm install jsdom && node scripts/dom_test.cjs   # test DOM optionnel
```

Le validateur doit afficher « Tous les contrôles passent » avant tout commit.

## Structure du projet

```text
index.html, <matière>/index.html   pages du site (une page par matière aujourd'hui)
assets/                            style, script partagé, index de recherche
scripts/                           validateur, fusion d'un dars, test DOM
templates/lesson-block.html        gabarit d'un dars
docs/                              conventions techniques et exemple de transformation
SKILL-general.md                   règles de fond : transcription → leçon
AGENTS.md                          règles pour l'IA (lues automatiquement)
RESTRUCTURATION.md                 brief du chantier de restructuration
.agents/skills/                    skills de l'IA (OpenCode et Codex)
.opencode/                         sous-agents et commandes OpenCode
```

## Règles à retenir

- Ne jamais supprimer ni remplacer un dars existant ; travailler sur une **branche git**
  (`lesson/<matière>-<n>`) et commiter une fois le validateur au vert.
- La progression des étudiants est précieuse : ne jamais renommer une clé `localStorage` ni un
  préfixe d'id sans migration.
- Pas de poème, de verset ou de long passage recopié : paraphraser.
- Les fichiers temporaires `brouillon-dars-*.md` et `dars-*.html` sont supprimés après chaque
  ajout (et ignorés par git).

## Questions fréquentes

**Où est enregistrée ma progression ?** Dans le navigateur de l'appareil. Elle ne se
synchronise pas entre appareils : utilise « تصدير التقدم » puis « استيراد » pour la transférer.
Vider les données du navigateur l'efface.

**Pourquoi l'IA me pose-t-elle une question avant d'ajouter un dars ?** Parce que la matière ou
le numéro n'est pas certain. Elle ne devine jamais un numéro de dars.

**Puis-je ajouter une matière ?** Oui, via `/nouveau-dars` en indiquant une nouvelle matière :
l'IA crée la page, la carte d'accueil et l'entrée du manifeste.
