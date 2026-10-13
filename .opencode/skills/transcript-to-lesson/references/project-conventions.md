# Conventions du site Zlearn (multi-pages)

## Structure du site

```text
index.html                  accueil : cartes des matières, dars, progression
fiqh/index.html             matière الفقه (les dars sont les enfants de .subject)
aqida/index.html            matière العقيدة
tajwid/index.html           matière التجويد
assets/site.css             tout le style (variables, thème clair/sombre)
assets/site.js              tout le script (ES5) + manifeste ZLEARN_MATIERES
```

Chaque page matière porte `<body data-page="fiqh">` (id de la matière, `home` pour
l'accueil). Une **nouvelle matière** = nouveau dossier `<id>/index.html` + carte dans
`index.html` + entrée dans le manifeste `ZLEARN_MATIERES` (`assets/site.js`).

## Modèle de données (DOM) — dans chaque page matière

```text
.subject[data-subject="fiqh"]         conteneur de la matière (un seul par page)
  .lesson[data-lesson="1"]            un dars (un seul visible à la fois)
    .part-head                        bandeau : matière · dars n° · titre
    section#<prefix-summary>          chaque section a un id unique dans la page
    section#<prefix-quiz>
```

Navigation `nav.toc` :

```text
.wrap.toolbar                  recherche, thème, progression globale
.wrap.tabs[data-subject]       boutons .tab[data-lesson]
.wrap.chips[data-subject][data-for]   liens vers les sections du dars
```

## Préfixes d'id

| Matière | Leçons | Préfixe d'id      | Thème couleur |
| ------- | ------ | ----------------- | ------------- |
| fiqh    | 1      | (sans préfixe)    | `--blue`      |
| fiqh    | 2      | `l2-`             | `--green`     |
| fiqh    | 3      | `l3-`             | `--amber`     |
| aqida   | 1..n   | `aq<n>-`          | `--blue`      |
| tajwid  | 1..n   | `tj<n>-`          | `--amber`     |

Les ids sont uniques **dans chaque page** (jamais deux fois le même id dans une même
page ; d'un dossier à l'autre les préfixes diffèrent de toute façon).

Couleurs sémantiques : bleu = `عقيدة`, vert = `فقه`, ambre = `تصوف`/`تجويد`,
rouge = `حرام`/`نجس`/danger.

## Groupes de progression

```html
<div class="group" data-key="l4">
  <div class="progress">
    <div class="bar" aria-hidden="true"><span class="pfill"></span></div>
    <span class="plabel">0 من 10</span>
  </div>
  <ul class="checks">
    <li><label class="check"><input type="checkbox" id="f1"><span>…</span></label></li>
  </ul>
</div>
```

- `data-key` unique **dans la page** (les dars ne se recouvrent pas : `l1`, `l2`, …,
  `aq1`, …, `tj1`, …). Le nombre après « من » doit égaler le nombre de cases.
- Le JS restaure l'état depuis `localStorage` sous la clé `mourshid-<data-key>`.
- Chaque page matière enregistre son agrégat sous `mourshid-prog-<matière>` ; le manifeste
  `ZLEARN_MATIERES` de `assets/site.js` contient le `total` de cases de chaque matière.
  **Après tout ajout/suppression de cases, mettre à jour ce `total`** (le validateur le
  contrôle en mode dossier).

## Quiz

```html
<button class="btn toggle-all" type="button" data-target="l4-quiz">إظهار كل الأجوبة</button>
…
<details><summary>سؤال</summary><p class="ans">جواب</p></details>
```

`data-target` doit être l'id exact de la section qui contient les `<details>`.

## Zones de mémorisation (versets/textes)

```html
<textarea id="verses-box-4" data-key="l4" dir="rtl" lang="ar"></textarea>
```

Le JS sauvegarde la valeur sous `mourshid-<data-key>-verses`.

## Ancre d'insertion d'une nouvelle leçon (dans la page de la matière)

Une leçon doit être un **enfant direct** de son `.subject`. Pour l'ajouter à la fin de la
matière, utiliser comme ancre le texte :

```
</div>

</main>
```

(fermeture du `.subject` puis du `</main>`), et insérer **avant** (`merge_lesson.py` sans
`--after`, c'est l'ancre par défaut du script). Le nouveau bloc se retrouve alors entre la
dernière leçon et la fermeture du `.subject`.

Ne jamais ancrer sur le `</div>` de fin de la leçon précédente : le nouveau dars serait
imbriqué dans l'ancien et n'aurait plus de parent `.subject` (la navigation échouerait).

Chaque nouvelle leçon doit aussi recevoir, **dans la page de la matière** :
- un bouton `.tab` dans la ligne `.tabs` de sa matière (sinon il est inatteignable) ;
- une ligne `.chips` — **facultative** : le script de TOC automatique la crée/complète
  au chargement à partir des `<h2>` des sections.

## Fonctions JS partagées (assets/site.js — ne pas casser)

- Thème clair/sombre : `document.documentElement.dataset.theme` (`light`/`dark`),
  clé `mourshid-theme`. Sans valeur = préférence système.
- Recherche : indexe `.lesson`/`section` de la page ; normalise l'arabe (retire les harakât).
- TOC auto : complète les lignes `.chips` à partir des `<h2>` des sections.
- Progression globale : additionne les agrégats `mourshid-prog-<matière>` ; les barres par
  matière (`[data-matiere-progress]`) ne sont utilisées que sur l'accueil.
- Onglets : flèches clavier sur `.tabs`.
- Mémoire du dernier dars : clé `mourshid-tab-<page>` (scopée par page).

## Liens entre pages

- Accueil → matière : `fiqh/index.html` ; accueil → dars précis : `fiqh/index.html#lesson-2`
  (la page ouvre la bonne leçon grâce au hash).
- Matière → accueil : `../index.html` (brand et fil d'Ariane).
- Assets : `../assets/site.css` / `../assets/site.js` depuis les dossiers matière,
  `assets/…` depuis l'accueil.