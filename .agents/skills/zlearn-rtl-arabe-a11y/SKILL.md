---
name: zlearn-rtl-arabe-a11y
description: "Concevoir ou corriger une interface Zlearn en arabe RTL, accessible au clavier et aux lecteurs d'écran (WCAG AA), lisible sur mobile et cohérente en thèmes clair et sombre. À utiliser pour tout élément visuel ou interactif du site."
---

# RTL, arabe et accessibilité

## Direction et typographie

- Racine `<html lang="ar" dir="rtl">`. Ne jamais inverser à la main : propriétés logiques CSS
  (`margin-inline`, `padding-inline`, `inset-inline-start/end`, `text-align: start/end`).
  Éviter `left/right` pour la mise en page.
- Textes mixtes arabe + termes latins : isoler les segments latins avec `<span dir="ltr">` ou
  `unicode-bidi: isolate`.
- Chiffres : conserver ceux de la transcription (orientaux ٠-٩ ou occidentaux) ; ne pas
  convertir arbitrairement. Conserver les harakât signifiants dans les citations.
- Polices : titres `Amiri`, texte `IBM Plex Sans Arabic`, repli `Tahoma, sans-serif`. Base ≥ 17 px,
  interligne ≥ 1,8.

## Contraste et couleurs (WCAG 2.1 AA)

- Texte normal ≥ 4,5:1 ; grand texte (≥ 24 px, ou ≥ 19 px gras) ≥ 3:1. Vérifier chaque paire
  texte/fond en clair **et** en sombre. L'or décoratif (`--gold`) n'est pas une couleur de texte.
- Jamais d'information par la couleur seule : ajouter libellé, icône ou motif.
- Couleurs uniquement via variables `--xxx`, avec variante sombre. Le thème suit
  `prefers-color-scheme` et un choix manuel (`data-theme`) sauvegardé.

## Clavier et focus

- Tout élément interactif est atteignable au clavier (liens, boutons, `summary`, cases,
  `textarea`). `:focus-visible` obligatoire ; jamais `outline: none` sans remplacement.
- Onglets (`role="tablist"`/`tab`) : flèches, `Home`/`End`, `aria-selected` à jour, roving
  tabindex. Lien d'évitement « تجاوز إلى المحتوى » vers `<main id="main">`.
- Ordre de tabulation = ordre visuel.

## Lecteurs d'écran et ARIA

- Un seul `<h1>` ; `h2`/`h3` sans saut de niveau.
- SVG informatifs : `role="img"` + `aria-label` ; décoratifs : `aria-hidden="true"`.
- Barre de progression décorative `aria-hidden` ; le compteur texte porte `aria-live="polite"`.
- Boutons afficher/masquer : libellé explicite, `aria-expanded` si pertinent.
- Réponses de quiz dans `<details>/<summary>` (natif et accessible).

## Mobile

- Lisible à **400 px**. Diagrammes larges : conteneur `overflow-x: auto`, `min-width` sur le
  SVG, texte d'aide « مرّر أفقيًا » ; jamais de défilement horizontal de la page.
- Zones tactiles ≥ 44 × 44 px. Respecter `prefers-reduced-motion: reduce`.

## Anti-patterns à refuser

Couleur en dur, `!important` non justifié, `style=""` pour la mise en page, bouton sans action,
`href="#"` mort, `div` cliquable sans rôle ni clavier, texte dans une image, `alt` manquant,
`id` dupliqué, `left/right` là où une propriété logique convient.
