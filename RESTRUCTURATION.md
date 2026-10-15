# RESTRUCTURATION.md — brief de restructuration du projet Zlearn

> **Pour l'IA qui exécute ce chantier.** Ce document est autonome : lis-le en entier avant
> d'agir. Lis ensuite `AGENTS.md`, `docs/conventions.md` et `SKILL-general.md`. Travaille par
> phases, dans l'ordre, et **arrête-toi à la fin de chaque phase** pour rapporter à
> l'utilisateur. Ne saute aucune phase.

## 1. Objectif

Transformer Zlearn, site statique en arabe RTL pour la première année zaytounienne, en une
base **maintenable** et **fondée sur la science de l'apprentissage**, sans perdre aucun
contenu pédagogique ni aucune progression d'apprenant.

Trois résultats attendus :

1. **Contenu séparé de la présentation** : chaque dars devient des données dans `content/`,
   le site est généré par un script Python sans dépendance.
2. **Une page par dars**, légère, avec URL stable.
3. **Moteur d'apprentissage** : réponse avant correction, niveau de confiance, révision
   espacée (boîtes de Leitner), révision mélangée entre matières.

## 2. État actuel (mesuré)

- 7 matières (`fiqh aqida tajwid sira hadith akhlaq nahw`), 3 dars chacune, 21 dars.
- **Une page HTML par matière** : de 47 Ko (akhlaq) à 105 Ko (aqida) pour 3 dars seulement ;
  elles grossiront avec chaque nouveau dars. Tout (contenu, structure, SVG) est dans le HTML.
- `assets/site.js` (44 Ko, ES5) contient le manifeste `ZLEARN_MATIERES`, la progression, la
  recherche, le thème, l'export/import. `assets/search-index.js` est un fichier à la main.
- Progression dans `localStorage` sous des clés `mourshid-…` et `zlearn-answer-…`.
- Questions : des `<details>` dans le HTML, sans identifiant exploitable par du code.
- `index.html` contient en dur le total (21) et les listes de dars.
- Défauts connus à corriger pendant le chantier :
  - préfixes d'id incohérents : sira utilise `lesson-h1`, `lesson-s2`, `lesson-s3` (le `h1`
    vient de hadith) ; fiqh utilise `lesson-1`, `l1`… ;
  - 64 attributs `style=""` dans aqida, 21 dans fiqh, 16 dans tajwid (contre la règle « variables
    CSS uniquement ») ;
  - polices chargées depuis Google Fonts (pas de repli hors ligne) ;
  - ni manifeste PWA, ni service worker, ni favicon, ni `404.html`, ni CSS d'impression ;
  - le filtre d'import de progression (`allowedKey` dans `site.js`) autorise n'importe quelle clé
    `mourshid-*` : à resserrer ;
  - cases « Je maîtrise » = auto-déclaration, pas une mesure de maîtrise ;
  - `or` décoratif (`--gold`) trop clair pour du texte (contraste 2,4:1).
- Validateur existant : `scripts/validate_site.py` (stdlib), **à conserver comme filet de
  sécurité pendant toute la migration**, puis à faire évoluer.

## 3. Décisions à confirmer avec l'utilisateur AVANT de commencer

Pose ces questions avec l'outil de questions (ou en texte), une seule fois, avec la valeur par
défaut recommandée. Si l'utilisateur ne répond pas, applique les valeurs par défaut et note-le
dans le rapport de la phase 0.

| # | Décision | Défaut recommandé |
| - | -------- | ----------------- |
| D1 | Où est publié le site ? (GitHub Pages depuis la racine, depuis `docs/`, depuis une Action, autre) | sortie générée dans `site/`, publiée par GitHub Actions ; si l'utilisateur veut publier depuis la racine ou `docs/`, adapter le dossier de sortie |
| D2 | JavaScript : rester en ES5 (navigateurs anciens) ou passer à du JS moderne ? | rester en **ES5**, modules concaténés par le build |
| D3 | Normaliser les préfixes d'id de sira (`h1`, `s2`, `s3` → `sr1`, `sr2`, `sr3`) ? | oui, **avec migration** des clés `localStorage` (voir phase 3) |
| D4 | Intervalles de révision espacée | 1, 3, 7, 14, 30 jours (5 boîtes), 20 cartes maximum par séance |
| D5 | Garder `index.html` à la racine du site publié et les anciennes URLs (`fiqh/index.html#lesson-2`) ? | oui, avec redirections vers les nouvelles pages |

## 4. Architecture cible

```text
zlearn/
├─ content/
│  ├─ subjects.json                    # manifeste unique : ordre, noms, livres, préfixes, couleurs
│  └─ <matière>/
│     └─ <NN>-<slug>/                  # un dossier par dars, ex. nahw/02-aqsam-alkalima/
│        ├─ meta.json                  # id, matière, numéro, titre, titre court, préfixe, sources
│        ├─ lesson.html                # fragment HTML du dars (contenu uniquement)
│        ├─ questions.json             # banque de questions, ids stables
│        └─ source.md                  # transcription brute + références vérifiées
├─ templates/                          # layout, accueil, sommaire de matière, page de dars
├─ src/
│  ├─ css/                             # variables, composants, thème clair/sombre, impression
│  └─ js/                              # storage, quiz, srs, review, search, theme, export, nav
├─ scripts/
│  ├─ build.py                         # content/ + templates/ + src/ → site/ (stdlib uniquement)
│  ├─ validate.py                      # contrôles de contenu ET de site généré (voir §8)
│  ├─ new_lesson.py                    # crée le dossier d'un dars avec squelette
│  ├─ migrate_v1.py                    # extraction de l'existant (usage unique)
│  └─ dom_test.cjs                     # test DOM optionnel (jsdom)
├─ site/                               # SORTIE GÉNÉRÉE (publiée) ; ne jamais éditer à la main
│  ├─ index.html                       # accueil + « à réviser aujourd'hui »
│  ├─ review/index.html                # révision mélangée
│  ├─ <matière>/index.html             # sommaire de la matière
│  ├─ <matière>/<NN>-<slug>/index.html # une page par dars
│  ├─ assets/                          # css/js assemblés, polices locales, search-index, icônes
│  ├─ manifest.webmanifest, sw.js, 404.html
│  └─ <anciennes URLs>/index.html      # redirections (D5)
├─ tests/                              # tests du moteur (srs, storage) et du validateur
├─ .github/workflows/validate.yml      # validate + build à chaque push
├─ AGENTS.md  README.md  RESTRUCTURATION.md
├─ docs/                               # ARCHITECTURE.md, CONVENTIONS.md
└─ .agents/skills/, .opencode/         # skills et sous-agents, adaptés (phase 6)
```

Pourquoi `lesson.html` et pas du Markdown : les dars contiennent des SVG, tableaux et
composants à classes CSS (`rule-box`, `card`, `gtable`…) ; un format Markdown les dégraderait
et imposerait une dépendance. Le fragment HTML reste ce que l'IA produit déjà.

### Contrat `meta.json`

```json
{
  "id": "nh2",
  "subject": "nahw",
  "number": 2,
  "slug": "aqsam-alkalima",
  "title": "أقسام الكلمة: اسم وفعل وحرف",
  "shortTitle": "أقسام الكلمة",
  "prefix": "nh2",
  "sourceFile": "source.md"
}
```

### Contrat `questions.json`

```json
[
  {
    "id": "nh2-q03",
    "type": "recall",
    "phase": "practice",
    "prompt": "…",
    "answer": "…",
    "explain": "…",
    "section": "nh2-classes",
    "difficulty": 2
  }
]
```

`type` : `recall` | `mcq` | `classify` | `cloze`. `phase` : `pretest` | `practice`. Les ids
sont **stables à vie** : `<id du dars>-q<NN>` numéroté dans l'ordre d'origine ; jamais
renommés, renumérotés ni réutilisés.

### Modèle de stockage v2 (clé unique `zlearn:v2`)

```json
{
  "schema": 2,
  "lessons": { "nh2": { "completedAt": "2026-10-20", "lastOpened": "2026-10-20" } },
  "checks":  { "nh2-k1": true },
  "cards":   { "nh2-q03": { "box": 2, "due": "2026-10-27", "history": [1, 1, 0, 1] } },
  "answers": { "nahw2-activity": "texte libre" },
  "prefs":   { "theme": "dark" }
}
```

Dates en `YYYY-MM-DD` heure locale. Toute lecture/écriture passe par `storage.js` (`try/catch`,
fallback mémoire si `localStorage` est indisponible).

### Algorithme de révision (`srs.js`, fonctions pures, testées)

Boîtes de Leitner avec les intervalles de D4. Après chaque réponse (avec confiance : `sûr`,
`hésitant`, `deviné`) :

- réussite + `sûr` → boîte +1 (plafonnée), prochaine date = intervalle de la nouvelle boîte ;
- réussite + `hésitant` → même boîte, prochaine date = intervalle de cette boîte ;
- échec, ou réussite devinée → boîte 1, prochaine date = demain ;
- échec avec confiance `sûr` → afficher l'explication **et** replacer la question plus tard
  dans la même séance (erreur à forte confiance = illusion de maîtrise).

Une question entre dans la file **seulement après** que l'apprenant l'a tentée au moins une
fois dans le dars. La file du jour est triée : échecs récents, puis échéances les plus
anciennes ; elle mélange les matières (entrelacement) et plafonne à 20 cartes (D4).

## 5. Règles d'exécution du chantier

1. **Branche** : `restructuration` ; un commit par étape logique, message
   `restructuration: phase <n> — <résumé>`. Ne jamais pousser sur la branche principale.
2. **Aucune perte** : le texte arabe, les SVG, les tableaux, les questions et les ids existants
   sont transférés **tels quels**. Ne pas réécrire ni « améliorer » le contenu pédagogique ;
   toute suspicion d'erreur de contenu est signalée à l'utilisateur, pas corrigée.
3. **Golden master** : avant toute modification, génère `tests/baseline.json` (par dars : ids de
   sections, nombre de cases, nombre de questions, texte visible normalisé hachés, clés
   `data-key`) à partir de l'état actuel. Après chaque phase, une comparaison automatisée prouve
   qu'aucun dars n'a perdu de contenu.
4. **Dépendances** : Python 3 standard library pour `build.py`/`validate.py` ; aucun paquet npm
   au runtime ; `jsdom` seulement pour le test DOM optionnel.
5. **Génération déterministe** : deux builds successifs produisent des fichiers identiques ;
   `build.py --check` échoue si `site/` n'est pas à jour.
6. **Compatibilité apprenants** : toute clé `localStorage` existante reste lisible. La migration
   copie vers `zlearn:v2` et **conserve les anciennes clés** (retour arrière possible). L'import
   de progression accepte les fichiers v1 et v2.
7. **Honnêteté** : ne déclare jamais un test réussi sans l'avoir exécuté ; rapporte la commande
   et son résultat exact. En cas de doute sur une décision structurante, pose la question.
8. **Contenu lisible sans JavaScript** : le texte des leçons est dans le HTML ; JS ajoute
   navigation, progression et révision.

## 6. Plan par phases

### Phase 0 — Préparation
- Créer la branche, vérifier `git status` propre, lancer `python3 scripts/validate_site.py .`
  (doit passer), poser les décisions D1 à D5.
- Générer `tests/baseline.json` (règle 3) et le commiter.
- **Critère de sortie** : validateur vert, baseline générée, décisions notées.

### Phase 1 — Contenu en données, site généré à l'identique
- Écrire `scripts/migrate_v1.py` : extrait de chaque page de matière, pour chaque dars,
  `lesson.html` (le bloc `.lesson`), `meta.json`, `questions.json` (depuis les `<details>` du quiz,
  ids `<id>-q<NN>`), et `content/subjects.json` (depuis `ZLEARN_MATIERES` et les cartes
  d'accueil). `source.md` reste vide avec une mention « transcription d'origine non conservée ».
- Écrire `scripts/build.py` et les gabarits pour régénérer le site **actuel** (une page par
  matière) à partir de `content/`, y compris `index.html`, `assets/search-index.js` et le manifeste
  (générés, plus écrits à la main).
- **Critère de sortie** : pour chaque page, le DOM normalisé du site généré est équivalent à
  l'original (hors différences expliquées et listées) ; le validateur passe sur `site/` ; la
  comparaison avec `tests/baseline.json` ne signale aucune perte.

### Phase 2 — Une page par dars
- Générer `site/<matière>/<NN>-<slug>/index.html` ; la page de matière devient un sommaire
  (liste des dars, progression). Navigation précédent/suivant générée au build.
- Redirections depuis les anciennes URLs et ancres (D5), sans casser les liens de l'accueil.
- Recherche : index généré, pointant vers les nouvelles pages.
- **Critère de sortie** : tous les liens internes résolus ; chaque dars accessible par son URL ;
  poids de page par dars nettement inférieur à l'ancienne page de matière.

### Phase 3 — Stockage v2 et migration
- Implémenter `storage.js` (schéma v2, fallback mémoire) et la migration depuis `mourshid-*` et
  `zlearn-answer-*`, y compris la correspondance des anciens préfixes de sira si D3 = oui.
- Resserrer le filtre d'import ; l'export produit `format: "zlearn-progress", version: 2` et l'import
  lit v1 et v2.
- Tests (`tests/`) : migration d'un jeu de clés v1 réaliste, idempotence, valeurs corrompues.
- **Critère de sortie** : un apprenant avec une progression v1 retrouve exactement ses cases,
  ses dars terminés et ses réponses ; tests verts.

### Phase 4 — Moteur d'apprentissage
- `quiz.js` : champ de réponse **avant** correction, puis niveau de confiance, puis réponse modèle
  et explication avec lien vers la section à relire.
- `srs.js` (fonctions pures + tests), `review.js` et la page `review/` ; accueil : « à réviser
  aujourd'hui : N » ; pré-test de 2 questions en tête de dars.
- Remplacer l'affichage des cases « Je maîtrise » comme mesure de maîtrise : elles restent une
  aide, mais aucun texte n'affirme la maîtrise sur cette seule base.
- Texte de l'interface en arabe, cohérent avec l'existant ; boutons accessibles au clavier,
  annonces `aria-live`.
- **Critère de sortie** : tests de `srs.js` verts ; parcours complet (répondre, confiance,
  révision le lendemain simulée) vérifié par le test DOM.

### Phase 5 — Qualité, accessibilité, hors ligne
- Supprimer les `style=""` (classes dans `src/css`), corriger le contraste de `--gold` en texte.
- Polices Amiri et IBM Plex Sans Arabic hébergées localement (`font-display: swap`).
- `manifest.webmanifest`, `sw.js` (cache des pages et d'`assets/`, stratégie « cache puis réseau »
  pour les pages, versionnée), favicon, `404.html`.
- CSS d'impression (`@media print`) pour une leçon propre sans navigation.
- **Critère de sortie** : plus aucun `style=""` ni contraste sous 4,5:1 pour le texte ; le site
  s'ouvre hors ligne après une première visite.

### Phase 6 — Outillage IA, documentation, CI
- `validate.py` complet (§8), `new_lesson.py`, workflow GitHub Actions (`validate` + `build --check`).
- Mettre à jour **tout** ce que cette restructuration périme : `AGENTS.md`, `README.md`,
  `docs/conventions.md` → `docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md`, les skills de
  `.agents/skills/`, les sous-agents et commandes de `.opencode/`, `templates/`. Les workflows
  `/nouveau-dars`, `/verifier-site`, `/ameliorer-site` doivent produire un dossier
  `content/<matière>/<NN>-<slug>/` et lancer `build.py` puis `validate.py`.
- Supprimer `scripts/migrate_v1.py` et `tests/baseline.json` seulement si l'utilisateur le confirme.
- **Critère de sortie** : aucune référence obsolète (`grep` sur les anciens chemins), un dars
  d'essai ajouté par `/nouveau-dars` passe tout le pipeline (puis est retiré), CI verte.

## 7. Règles pour tous les nouveaux cours

À intégrer telles quelles dans `docs/CONVENTIONS.md`, `AGENTS.md` et les skills (phase 6).

**A. Fidélité à la source**
1. Le cours reste celui de l'enseignant. Corriger une erreur de transcription seulement si le
   contexte la rend certaine ; signaler chaque correction à l'utilisateur.
2. Tout complément extérieur porte l'étiquette **إضافة تعليمية** et cite sa source, séparé du cours.
3. Un point non vérifiable est marqué « à confirmer avec l'enseignant », jamais deviné.
4. Pas de poème, verset ou long passage recopié : paraphrase, ou zone vide pour le texte de
   l'apprenant.
5. Un avis propre à l'enseignant est présenté comme tel (« selon l'enseignant »).

**B. Structure d'un dars** (ordre fixe) : objectifs → pré-test → explication par blocs →
exemples → pratique → synthèse → étape suivante.
6. 2 à 4 objectifs observables (verbes d'action : distinguer, classer, expliquer, appliquer).
7. Pré-test de 2 questions, sans note.
8. Blocs courts : une idée principale par bloc, environ 5 à 7 minutes de lecture au maximum.
9. Après chaque règle importante : un **exemple résolu**, puis un **exemple parallèle** à faire.
10. Un tableau ou schéma uniquement quand il enseigne (comparaison, classement, chronologie).
11. Synthèse courte, puis lien vers le dars suivant.

**C. Questions**
12. **8 à 12 questions par dars**, dont au moins 1 de rappel, 1 de compréhension, 1 d'application.
13. Chaque question référence la section à relire (`section`).
14. Ids stables à vie (§4). Jamais de renommage ni de réutilisation.
15. Chaque réponse modèle est accompagnée d'une explication.
16. Une question n'exige pas de recopier une phrase du cours : reformuler, comparer, appliquer.

**D. Nommage** : dars `<matière>-<NN>` ; dossier `<NN>-<slug>` ; préfixe d'id `<2 lettres><N>` ;
sections `<préfixe>-<slug>` ; cases `<préfixe>-k<N>` ; questions `<préfixe>-q<NN>`.

**E. Révision** : les questions entrent dans la file après une première tentative (§4) ; aucun
texte n'affirme la « maîtrise » sur la base d'une case cochée.

**F. Technique et accessibilité** : aucun `style=""`, couleurs par variables avec thème sombre,
contraste du texte ≥ 4,5:1, `dir="rtl" lang="ar"`, lisible à 400 px, polices locales, aucun
bouton mort, navigation clavier complète, `aria-live` pour les résultats.

**G. Processus** : une branche par dars (`lesson/<matière>-<NN>`), jamais de suppression ni de
remplacement d'un dars publié (on corrige par un nouveau commit), message de commit
`<matière>-<NN>: ajout du dars <titre>`, transcription conservée dans `source.md`.

## 8. Validateur cible (`scripts/validate.py`)

Il vérifie, sur `content/` **et** sur `site/` généré :
- ids uniques et au format §7-D ; ancres internes résolues ; balises équilibrées ; `lang/dir` ;
- `meta.json` valide, `questions.json` valide (champs obligatoires, ids uniques, `section` existante) ;
- au moins 8 questions avec les trois niveaux ; pré-test, synthèse et lien suivant présents ;
- nombre de cases = compteur ; `subjects.json` cohérent avec les dars réels ;
- index de recherche à jour ; aucun `style=""` ; contraste du texte ≥ 4,5:1 sur les paires de variables ;
- aucun placeholder (`<ID>`, `…`) restant ; aucun dars supprimé par rapport à la baseline.

## 9. Interdits

- Réécrire, résumer ou « corriger » un dars existant pendant la migration.
- Renommer un id de question ou une clé `localStorage` sans migration.
- Ajouter une dépendance runtime, un CDN ou un script tiers.
- Éditer `site/` à la main.
- Lancer plusieurs phases sans rapport intermédiaire à l'utilisateur.

## 10. Rapport attendu à la fin de chaque phase

Ce qui a été fait ; commandes exécutées avec leur résultat exact ; différences observées par
rapport à la baseline et leur explication ; décisions prises ou questions en suspens ; fichiers
créés, modifiés, supprimés ; proposition de la phase suivante.
