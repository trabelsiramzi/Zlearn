# Conventions du site Zlearn (multi-pages, état actuel)

> Ce document décrit le site **tel qu'il est aujourd'hui**. Le chantier de restructuration
> (voir `RESTRUCTURATION.md`) le remplacera par `docs/CONVENTIONS.md` pour la nouvelle
> architecture ; tant qu'il n'est pas terminé, ce fichier fait foi.

## Structure du site

```text
index.html                  accueil : cartes des matières, dars, progression globale
<matière>/index.html        une page par matière ; les dars sont des enfants de .subject
assets/site.css             tout le style (variables, thème clair/sombre)
assets/site.js              tout le script (ES5) + manifeste ZLEARN_MATIERES
assets/search-index.js      index de recherche : une entrée par section de dars
scripts/                    validate_site.py, merge_lesson.py, dom_test.cjs
templates/lesson-block.html gabarit d'un dars
docs/                       conventions et exemple
```

Matières (`<body data-page="<id>">`) : `fiqh`, `aqida`, `tajwid`, `sira`, `hadith`, `akhlaq`,
`nahw`. Une **nouvelle matière** = dossier `<id>/index.html` + carte dans `index.html` +
entrée dans `ZLEARN_MATIERES` (`assets/site.js`) + entrée dans `EXPECTED_SUBJECTS`
(`scripts/validate_site.py`).

## Modèle de données (DOM) d'une page matière

```text
.subject[data-subject="nahw"]                 conteneur de la matière (un seul par page)
  .lesson#lesson-<ID>[data-lesson="N"]        un dars : role="tabpanel",
                                              aria-labelledby="tab-<matière>-<N>", tabindex="0"
    .part-head                                bandeau : matière · dars n° · titre
    .goals                                    objectifs (h3 + ul)
    section#<ID>-summary … section#<ID>-quiz  une section = un id unique dans la page
      .application#<matière><N>-activity      activité d'application (champ de réponse généré par JS)
```

Navigation `nav.toc` :

```text
.wrap.toolbar                        recherche, thème, progression globale
.wrap.tabs[data-subject]             boutons .tab#tab-<matière>-<N>[aria-controls="lesson-<ID>"]
.wrap.chips[data-subject][data-for]  liens vers les sections du dars (complétés par JS)
```

Le bouton « أتممت هذا الدرس » et la navigation précédent/suivant sont **générés par
`assets/site.js`** : ne pas les écrire dans le HTML.

## Préfixes d'id actuels

| Matière | `lesson-…`           | `data-key` / préfixe de sections | Remarque |
| ------- | -------------------- | -------------------------------- | -------- |
| fiqh    | `lesson-1`, `-2`, `-3` | `l1`, `l2`, `l3` (dars 1 : ids de sections sans préfixe) | historique |
| aqida   | `lesson-aq<N>`       | `aq<N>`                          | |
| tajwid  | `lesson-tj<N>`       | `tj<N>`                          | |
| sira    | `lesson-h1`, `-s2`, `-s3` | `h1`, `s2`, `s3`            | **incohérent** (`h1` vient de hadith) ; à normaliser avec migration des clés `mourshid-…` |
| hadith  | `lesson-hd<N>`       | `hd<N>`                          | |
| akhlaq  | `lesson-ak<N>`       | `ak<N>`                          | |
| nahw    | `lesson-nh<N>`       | `nh<N>`                          | |

Pour un **nouveau** dars, suivre le préfixe de la matière (`<2 lettres><N>`). Ne jamais
renommer un préfixe existant sans migration : les clés `localStorage` des apprenants en
dépendent. Les ids sont uniques **dans chaque page**.

Couleurs sémantiques : bleu = `عقيدة`, vert = `فقه`, ambre = `تصوف`/`تجويد`, rouge =
`حرام`/`نجس`/danger.

## Groupes de progression

```html
<div class="group" data-key="nh4">
  <div class="progress">
    <div class="bar" aria-hidden="true"><span class="pfill"></span></div>
    <span class="plabel">0 من 8</span>
  </div>
  <ul class="checks">
    <li><label class="check"><input type="checkbox" id="nh4-k1"><span>…</span></label></li>
  </ul>
</div>
```

- `data-key` unique dans la page ; le nombre après « من » doit égaler le nombre de cases.
- État restauré depuis `localStorage` sous `mourshid-<data-key>`.
- Agrégat de la page : `mourshid-prog-<matière>` ; dars terminés : `mourshid-learning-<matière>`.
- Le manifeste `ZLEARN_MATIERES` (`assets/site.js`) porte `total` (cases) et `lessons` (dars
  publiés) de chaque matière. **Après tout ajout de cases ou de dars, le mettre à jour** : le
  validateur le contrôle en mode dossier.
- Réponses d'activités d'application : `zlearn-answer-<id de l'activité>`.

## Quiz

```html
<button class="btn toggle-all" type="button" data-target="nh4-quiz">إظهار كل الأجوبة</button>
<details><summary>سؤال</summary><p class="ans">جواب</p></details>
```

`data-target` = id exact de la section qui contient les `<details>`.

## Zones de mémorisation de textes

```html
<textarea id="verses-box-4" data-key="l4" dir="rtl" lang="ar"></textarea>
```

Sauvegardée sous `mourshid-<data-key>-verses`. Ne jamais pré-remplir avec un texte protégé.

## Ancre d'insertion d'un nouveau dars

Un dars est un **enfant direct** de `.subject`. Pour l'ajouter à la fin de la matière,
`scripts/merge_lesson.py` utilise par défaut comme ancre la fermeture du `.subject` juste
avant `</main>` et insère **avant** :

```
</div>

</main>
```

Ne jamais ancrer sur le `</div>` de fin du dars précédent : le nouveau dars serait imbriqué
dans l'ancien et la navigation échouerait.

Pour chaque nouveau dars, ajouter aussi : l'onglet `.tab` (sinon il est inatteignable), la
ligne `.chips`, la carte d'accueil, l'index de recherche, le manifeste et le total de la
progression globale (voir le bloc de commentaires de `templates/lesson-block.html`).

## Fonctions JS partagées (assets/site.js — ne pas casser)

- Thème clair/sombre : `document.documentElement.dataset.theme`, clé `mourshid-theme`.
- Recherche : normalise l'arabe (retire harakât, unifie les lettres) ; index global dans
  `assets/search-index.js`.
- TOC automatique : complète les `.chips` depuis les `<h2>` des sections.
- Progression globale : somme des dars terminés ; barres par matière sur l'accueil.
- Onglets : flèches clavier ; mémoire du dernier dars `mourshid-tab-<page>`.
- Activités d'application : champ de réponse et bouton d'effacement générés pour chaque
  `.application` ayant un `id`.
- Export/import du progrès en JSON (clés `mourshid-…` et `zlearn-answer-…` uniquement).

## Liens entre pages

- Accueil → matière : `fiqh/index.html` ; accueil → dars : `fiqh/index.html#lesson-2`.
- Matière → accueil : `../index.html`.
- Assets : `../assets/…` depuis les dossiers matière, `assets/…` depuis l'accueil.
