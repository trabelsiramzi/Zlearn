---
name: RTL, arabe et accessibilité
description: Règles pour produire une interface arabe RTL moderne, lisible et accessible (WCAG AA) : direction, typographie arabe, contrastes, focus, clavier, lecteurs d'écran, textes mixtes arabe/français, diagrammes lisibles sur petit écran. À utiliser pour concevoir ou corriger tout élément visuel ou interactif du site Zlearn.
---

# RTL, arabe et accessibilité

## Direction et typographie

- Racine : `<html lang="ar" dir="rtl">`. Ne jamais inverser à la main ; utiliser les
  propriétés logiques CSS : `margin-inline`, `padding-inline`, `inset-inline-start/end`,
  `text-align: start/end`. Éviter `left/right` pour la mise en page.
- Textes techniques mixtes (arabe + termes latins) : entourer les segments latins de
  `<span dir="ltr">…</span>` ou `unicode-bidi: isolate` pour éviter le mélange visuel.
- Chiffres : l'arabe utilise des chiffres « arabes orientaux » (٠-٩) ou occidentaux selon
  le texte d'origine. Conserver ceux de la transcription ; ne pas convertir arbitrairement.
- Polices : titres en `Amiri` (naskh), texte courant en `IBM Plex Sans Arabic`, avec
  repli `Tahoma, sans-serif`. Taille de base ≥ 17 px, `line-height` généreux (1,8+).
- Harakât/taškīl : ne pas supprimer les diacritiques signifiants dans les citations ;
  les conserver tels quels dans le HTML.

## Contraste et couleurs (WCAG 2.1 AA)

- Texte normal : contraste ≥ 4,5:1 ; grand texte (≥ 24 px, ou ≥ 19 px gras) : ≥ 3:1.
- Ne jamais coder l'information **par la couleur seule** : ajouter un libellé, une icône
  ou un motif (ex. les trois piliers portent aussi leur nom).
- Toutes les couleurs passent par des variables `--xxx` avec variante thème sombre.
  Le thème suit `prefers-color-scheme` et un choix manuel (`data-theme`) sauvegardé.
- Vérifier chaque nouvelle paire couleur de texte / fond en clair **et** en sombre.

## Navigation clavier et focus

- Tout élément interactif est atteignable au clavier : liens, boutons, `summary`,
  `<input type="checkbox">`, `<textarea>`.
- Focus visible obligatoire : `:focus-visible { outline: 3px solid …; outline-offset: 2px }`.
  Ne jamais `outline: none` sans remplacement.
- Onglets (`role="tablist"` / `role="tab"`) : flèches ← → pour changer d'onglet,
  `Home`/`End`, et `aria-selected` à jour. Un seul onglet au focus (roving tabindex).
- Lien d'évitement « تجاوز إلى المحتوى » en début de page vers `<main id="main">`.
- Ordre de tabulation = ordre visuel.

## Lecteurs d'écran et ARIA

- Un seul `<h1>` ; hiérarchie `h2`/`h3` sans saut de niveau.
- Diagrammes SVG : `role="img"` + `aria-label` décrivant le contenu. Les éléments purement
  décoratifs : `aria-hidden="true"`.
- Progression : la barre est `aria-hidden` (décorative) ; le compteur texte porte
  `aria-live="polite"`.
- Boutons « afficher/masquer » : libellé explicite, `aria-expanded` quand pertinent.
- Les réponses de quiz sont dans `<details>/<summary>` : natif et accessible.

## Mobile et tableaux/diagrammes larges

- Cible : lisible à **400 px**, confortable jusqu'au grand écran.
- Diagrammes/SVG larges : conteneur `overflow-x: auto`, `min-width` sur le SVG,
  et un texte d'aide « مرّر أفقيًا ». Jamais de scroll horizontal sur la page entière.
- Zones tactiles ≥ 44 × 44 px. Espacement suffisant entre onglets et cases.
- Respecter `prefers-reduced-motion: reduce` (désactiver les transitions).

## Anti-patterns à refuser

- Couleur en dur, `!important` non justifié, styles en ligne pour la mise en page.
- Bouton sans action, `href="#"` mort, `div` cliquable sans rôle ni clavier.
- Texte dans une image, `alt` manquant, `id` dupliqué.
- Emploi de `left/right` là où une propriété logique convient.
