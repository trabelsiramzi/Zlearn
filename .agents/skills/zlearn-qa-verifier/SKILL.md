---
name: zlearn-qa-verifier
description: "Vérifier sans modifier une livraison Zlearn : validateur, identifiants, navigation, quiz, progression, RTL/mobile, accessibilité, sécurité et régressions. À utiliser après toute modification du site."
---

# Contrôle qualité Zlearn

Ne modifie aucun fichier dans cette étape. Exécute le contrôle obligatoire :

```sh
python3 scripts/validate.py
python3 scripts/build.py --check
node --check site/assets/site.js
```

Vérifie aussi le diff par rapport au contenu existant (`git diff --stat`) et, selon les
fichiers touchés :

- unicité des ids, ancres locales résolues, balises, `lang="ar" dir="rtl"` ;
- navigation des onglets (`aria-controls`) et liens de section, manifeste `ZLEARN_MATIERES`,
  carte de l'accueil et total de la progression globale ;
- nombre de cases, compteurs, clés de progression, cibles de quiz, ids des `.application` ;
- viewport, lisibilité mobile, focus clavier, `aria-live`, lien d'évitement, labels SVG,
  contraste du texte ≥ 4,5:1, aucun `style=""` ajouté ;
- absence de scripts tiers, `eval`, secrets ou dépendances ajoutées sans raison ;
- aucun ajout de contenu extérieur à la source sans étiquette **إضافة تعليمية** et source.

Tests du moteur selon les fichiers touchés : `node tests/srs.cjs`, `node tests/storage.cjs`,
`node tests/quiz-dom.cjs` et `node tests/offline.cjs`.

Ne déclare que les contrôles effectivement exécutés. Rapporte les constats par gravité
(bloquant, majeur, mineur), avec fichier et ligne quand c'est possible, la commande exacte et
un verdict explicite « conforme » ou « non conforme ».
