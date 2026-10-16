# RESTRUCTURATION-PEDAGOGIE.md — navigation et présentation fondées sur l'apprentissage

> **Pour l'IA qui exécute ce chantier.** Document autonome : lis-le en entier, puis `AGENTS.md`,
> `docs/CONVENTIONS.md`, `docs/ARCHITECTURE.md` et `SKILL-general.md`. Travaille phase par phase,
> une branche et une PR par phase. Ne passe à la phase suivante qu'après validation des critères
> d'acceptation de la précédente. Rapporte les commandes et sorties réellement obtenues.

## 0. Objectif

Faire de Zlearn un système d'étude, pas un annuaire de pages. L'étudiant doit savoir **quoi faire
aujourd'hui**, **rappeler avant de relire**, **être interrogé par petits blocs**, et voir sa
**maîtrise réelle** (calculée à partir de ses rappels, pas de cases cochées).

Principes appliqués : pré-test, organisateur préalable, découpage du contenu (charge cognitive),
rappel actif immédiat, répétition espacée, entrelacement des matières, méta-cognition (confiance),
mémorisation progressive des vers.

## 1. État actuel (constaté sur `main`, 16 oct. 2026)

- Accueil : 7 matières et 21 liens de leçons à plat, un seul lien « واصل مسارك », révision et
  المحفوظات en simples sections.
- Page leçon (ordre réel) : pré-test (cartes) → objectifs → خلاصة → خريطة ذهنية → 3 à 5 blocs de
  cours → المصطلحات → « تحقق من فهمك » → « تدرّب » → « استرجع وتدرّب » (cartes) → stepper.
- Deux moteurs de questions : (a) cartes de rappel `src/js/quiz.js` (pré-test, « استرجع وتدرّب »,
  alimentent le Leitner) ; (b) 11 à 14 blocs `<details>` écrits dans `content/*/*/lesson.html`
  (réponse ouverte d'un clic, sans tentative) et un bouton « إظهار كل الأجوبة »
  (`src/js/widgets.js`, `templates/lesson-block.html`).
- Leçons de 670 à 2 400 mots, 10 à 19 `<h2>`, questions seulement en fin de page.
- Progression affichée = cases à cocher (6 à 15 par leçon) ; elles ne prouvent pas la maîtrise.
- `scripts/build.py` génère aussi `mahfoudhat/` (`extract_memorize_items`, `extract_abyat`) :
  liste à lire, sans rappel ni espacement, ids non stables.
- 223 des 252 questions ont `explain == answer` et `section == <id>-quiz` (qualité insuffisante).
- `quiz.js` ne gère pas le focus : il vide la zone (`stage.innerHTML=""`), le focus tombe sur
  `BODY`.

## 2. Contraintes absolues (extraites de `AGENTS.md`)

1. Ne jamais supprimer, remplacer ni réécrire un dars publié : le texte arabe, les SVG, tableaux,
   questions et clés de progression sont préservés. Corrections **par ajouts**.
2. Ids de leçon et de question **stables** ; aucune clé `localStorage` renommée sans migration
   conservant la donnée. Schéma actuel : `zlearn:v2` (`lessons, checks, cards, answers, prefs`).
3. `site/` est généré : ne jamais l'éditer. Après modif : `python3 scripts/build.py`, puis
   `python3 scripts/validate.py`, puis `python3 scripts/build.py --check`.
4. RTL, lisible à 400 px, clavier, clair/sombre, aucun `style=""`, aucun CDN, JS ES5 vanilla,
   couleurs par variables CSS, propriétés logiques, contraste ≥ 4,5:1, `try/catch` sur le stockage.
5. Le contenu reste lisible **sans JavaScript** ; les nouveautés dynamiques sont des améliorations
   progressives avec repli HTML.
6. Ne jamais pousser sur `main`. Branche : `pedagogie/<phase>`.
7. Ne pas inventer de contenu doctrinal. Les explications viennent de la leçon ; l'incertain est
   « à confirmer avec l'enseignant ».

## 3. Décisions à confirmer avant la phase 2 (poser la question, ne pas deviner)

- **D6 — blocs `<details>` historiques.** Option A (défaut) : ne pas modifier `lesson.html` ; le
  build les enveloppe dans un bloc replié « مراجعة إضافية » après la clôture, sans bouton
  « tout afficher ». Option B : les retirer des fragments (contredit la règle 1, exige un accord
  écrit de l'utilisateur).
- **D7 — seuil de maîtrise** : défaut 80 % de cartes en boîte ≥ 2 avec dernière réponse juste.
- **D8 — vitesse d'affichage** : estimation de durée = 30 s par carte, 4 min par 500 mots.

## 4. Phases

### Phase 1 — Un seul moteur de questions, qualité et accessibilité (prérequis)

**Fichiers :** `content/*/*/questions.json`, `src/js/quiz.js`, `src/js/widgets.js`,
`templates/lesson-block.html`, `scripts/validate.py`, `tests/quiz-dom.cjs`.

1. **Qualité des questions (223 migrées).** Pour chaque question où `explain == answer` ou
   `section` se termine par `-quiz` :
   - lire `lesson.html` et `source.md` du dars ;
   - réécrire `explain` : *pourquoi* la réponse est juste, avec un indice ou un exemple tiré du
     cours (jamais une simple répétition de `answer`) ;
   - mettre `section` sur l'id réel de la `<section>` du cours qui traite le point ;
   - ne jamais changer `id`, `prompt`, `answer`, `phase`.
   Travailler matière par matière, un commit par matière.
2. **Types honnêtes.** Une question `mcq` sans options ou `cloze` sans trou doit être reclassée en
   `recall` (le type n'est pas un identifiant stable), ou complétée avec de vraies options. Les
   distracteurs viennent du cours.
3. **Focus.** Dans `quiz.js`, après chaque transition (confiance → correction → auto-évaluation →
   résultat), donner `tabindex="-1"` au conteneur (ou au premier élément) et appeler `.focus()` ;
   après la fin de la carte, focus sur la carte suivante ou sur le message de fin. Ajouter l'assertion
   dans `tests/quiz-dom.cjs` : `document.activeElement` n'est jamais `BODY`.
4. **Supprimer « إظهار كل الأجوبة »** (`widgets.js`, `templates/lesson-block.html`). Aucune
   réponse n'est visible avant une tentative.
5. **Validateur.** Dans `scripts/validate.py`, erreur si : `explain == answer` (pour toute
   *nouvelle* question), `section` finit par `-quiz`, `mcq` sans options, préfixe d'id hors
   `<lid>-qNN`. Les questions historiques non encore corrigées : avertissement tant que la
   phase 1.1 n'est pas terminée.
6. Ajouter `tests/quiz-dom.cjs` à `.github/workflows/validate.yml`.

**Acceptation :** 0 question avec `explain == answer` ; focus testé ; plus de bouton « tout
afficher » ; `validate.py`, `--check` et tous les tests passent.

### Phase 2 — Cycle de leçon en 5 temps avec micro-questions

Ordre cible de chaque page leçon (le texte arabe reste inchangé) :

| Temps | Contenu | Implémentation |
|---|---|---|
| 0 | Pré-test (2 questions) | existant |
| 1 | Objectifs, خلاصة, خريطة ذهنية | existant |
| 2 | 3 à 5 blocs de cours, **chaque bloc suivi d'1 à 2 micro-questions** | `data-checkpoint` |
| 3 | Exemple appliqué et exercice | blocs existants + carte `application` |
| 4 | Clôture : session « استرجع وتدرّب », puis confirmation « أُضيفت للمراجعة · أقرب مراجعة: … » | `quiz.js` + `srs.js` |

**Mécanisme (additif, sans toucher aux fragments) :**
1. Champ optionnel `checkpoint: "<section-id>"` dans `questions.json` : la carte s'affiche
   **après** cette section. Sans `checkpoint` : comportement actuel (fin de page).
2. `scripts/build.py` insère, après chaque section citée, `<div data-checkpoint="<section-id>">`
   (point de montage vide, masqué sans JS).
3. `quiz.js` monte les cartes dans ces points, sans déplacer le texte du cours.
4. Au moins **1 micro-question par grande section** (les `<h2>` de cours) pour les nouvelles
   leçons ; pour les 21 existantes, ajouter par **ajout** des `checkpoint` sur les questions
   déjà liées à une section réelle (phase 1).
5. Selon D6 : envelopper les `<details>` historiques dans un bloc replié après la clôture.
6. `scripts/validate.py` : `checkpoint` doit désigner une `<section>` existante ; avertissement si
   une section de cours (> 250 mots) n'a aucune question.
7. Estimation de lecture dans l'en-tête de page (D8), calculée au build.

**Acceptation :** chaque leçon montre pré-test → cours avec micro-questions → clôture ; la page
reste complète et lisible sans JS ; accessibilité : focus géré à chaque montage de carte.

### Phase 3 — Maîtrise réelle et parcours par matière

**Nouveau :** `src/js/mastery.js` (pure, testable, UMD comme `srs.js`) + `tests/mastery.cjs`.

Fonction `lessonStatus(catalogCards, state, today)` → `todo | inprogress | mastered | review` :
- `todo` : aucune carte de la leçon tentée ;
- `mastered` : ≥ D7 % des cartes avec `box >= 2` et dernière entrée d'historique juste ;
- `review` : au moins une carte échue depuis plus de 2 jours, ou deux derniers résultats faux ;
- `inprogress` : sinon.

1. Ne rien écrire dans le stockage : le statut est **calculé** à partir de `state.cards`
   (schéma v2 inchangé). Les cases `checks` restent, secondaires, jamais source de maîtrise.
2. `templates/subject-index.html` + JS : chaque leçon affiche son statut (texte + icône, pas la
   couleur seule), une jauge de maîtrise de la matière et le bouton « استأنف » (première leçon
   non `mastered`).
3. Repli sans JS : liste actuelle des leçons.

**Acceptation :** `tests/mastery.cjs` couvre les 4 statuts, les bornes et un état vide ; aucune
modification de `zlearn:v2`.

### Phase 4 — Accueil « اليوم »

Remplacer l'annuaire par trois blocs dans cet ordre, rendus par JS à partir du stockage :
1. **مراجعة اليوم** : nombre de cartes échues, durée estimée, bouton vers `review/` (la révision
   passe **avant** le nouveau contenu).
2. **واصل** : une seule action « leçon suivante », choisie par la matière la plus récente non
   terminée ; sinon « ابدأ الدرس الأول ».
3. **احفظ اليوم** : une carte المحفوظات échue (phase 5), sinon masqué.

Sous ces blocs : grille des 7 matières (jauge de maîtrise, lien vers la page matière). Les 21
liens de leçons sortent de l'accueil (ils restent sur les pages matière). Repli sans JS : l'accueil
actuel complet.

Règles : « bouton principal unique » par écran ; aucune notification ; aucun chiffre sans
unité ; compteur `aria-live` poli ; fonctionne hors-ligne (le service worker met à jour sa liste
de précache : changer `CACHE_NAME` en le liant à un hash du build).

**Acceptation :** parcours test dans Chromium (Playwright) : état vide → première leçon → une
réponse juste → carte planifiée pour J+1 → l'accueil affiche « مراجعة اليوم : 0 » puis « 1 » à J+1
(date simulée).

### Phase 5 — المحفوظات en cartes à rappel progressif

**Problème actuel :** `extract_memorize_items` et `extract_abyat` produisent une liste à lire, sans
ids stables.

1. Créer `content/<matière>/<NN>-<slug>/memorize.json`, **généré une seule fois** à partir des
   extractions actuelles puis édité à la main :
   `[{"id":"<lid>-m01","kind":"verse|point","text":["صدر","عجز"],"source":"<section-id>"}]`.
   Ids stables (`<lid>-mNN`), jamais réutilisés. Le build lit ce fichier (plus d'extraction
   implicite pour les ids ; l'extraction ne sert plus qu'à l'amorçage via un script ponctuel
   `scripts/seed_memorize.py`).
2. Catalogue de révision : les items `memorize` rejoignent la file Leitner (mêmes `cards`,
   `srs.grade`, intervalles 1/3/7/14/30), avec un champ `type: "memorize"` ; entrelacement des
   matières conservé.
3. **Masquage progressif d'un vers** selon la boîte : boîte 1 → ~25 % des mots masqués ; boîte 2 →
   ~50 % ; boîte ≥ 3 → vers entier de mémoire (zone de saisie ou récitation auto-évaluée).
   Masquage **déterministe** (graine = id de l'item) : même rendu à chaque rechargement. Ne masquer
   que les mots, jamais les signes diacritiques isolés.
4. Pour un « point » (non versifié) : carte de rappel libre avec auto-évaluation, comme `quiz.js`.
5. La page `mahfoudhat/` devient un **index de consultation** (lire le texte complet) avec, pour
   chaque item, son état (nouveau / en cours / acquis) calculé comme en phase 3 ; un bouton
   « ابدأ حفظ الأبيات » mène à la session.
6. `storage-catalog` : accepter les ids `-mNN` à l'import ; migration v2 inchangée.
7. Règles de fidélité : le texte des abyat est copié tel quel depuis la leçon (poèmes
   protégés : **ne rien paraphraser dans la carte**, la règle de paraphrase s'applique aux textes
   rédigés par l'IA, pas à la transcription de l'enseignant ni au matn étudié ; en cas de doute,
   poser la question).

**Acceptation :** chaque item a un id stable ; une session de 5 vers fonctionne au clavier ;
`tests/srs.cjs` et `tests/storage.cjs` étendus (import avec ids `-mNN`) ; `--check` vert.

### Phase 6 — Cadence, documentation et outillage IA

1. Afficher sur l'accueil la cadence suggérée : « درس واحد، ثم مراجعة بعد يوم و٣ أيام و٧ أيام »
   (les intervalles réels du Leitner).
2. Mettre à jour `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` (champs `checkpoint`,
   `memorize.json`, statuts de maîtrise) et `SKILL-general.md` (nouvel ordre de leçon : micro-question
   après chaque bloc).
3. `scripts/new_lesson.py` : générer `memorize.json` vide et un exemple de `checkpoint`.
4. Skills `.agents/skills/zlearn-*` : ajouter les règles de ce document ; `opencode.jsonc`
   autorise `python3 scripts/build.py*` et `python3 scripts/validate.py*`.
5. Archiver ce fichier dans `docs/` une fois les 6 phases terminées.

## 5. Définition de « terminé » (toutes phases)

- `python3 scripts/build.py`, `python3 scripts/validate.py`, `python3 scripts/build.py --check`
  verts ; `node --check site/assets/site.js` ; `node tests/srs.cjs`, `storage.cjs`, `mastery.cjs`,
  `quiz-dom.cjs`, `offline.cjs` verts.
- Contrôle navigateur (Chromium + axe-core, 400 px, clair et sombre) : 0 violation sur toutes les
  pages ; aucun débordement horizontal ; focus jamais sur `BODY` après une interaction.
- Le site reste utilisable sans JS (texte du cours, liste des leçons) et hors-ligne.
- Aucun id de leçon, de question ni clé de stockage modifié ; `tests/baseline.json` conforme
  (aucune perte de contenu migré).

## 6. Format de réponse attendu à la fin de chaque phase

Phase, fichiers modifiés, commandes exécutées avec leur sortie réelle, décisions prises
(D6–D8), points « À vérifier » (par exemple : explications à relire par l'enseignant), et ce qui
reste pour la phase suivante.

## 7. Interdits

Modifier `site/` à la main ; réécrire le texte arabe d'une leçon ; changer un id publié ; ajouter
une dépendance runtime ou un CDN ; déclarer un contrôle réussi sans l'avoir exécuté ; pousser sur
`main` ; supprimer `tests/baseline.json` ou `scripts/migrate_v1.py` sans accord explicite.
