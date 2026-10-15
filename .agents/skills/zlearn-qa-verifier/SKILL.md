---
name: zlearn-qa-verifier
description: Vérifier sans modifier une livraison Zlearn : validateur, identifiants, navigation, quiz, progression, RTL/mobile, accessibilité, sécurité et régressions.
---

# Contrôle qualité Zlearn

Ne modifie pas les fichiers dans cette étape. Exécute le contrôle obligatoire :

```sh
python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .
```

Vérifie aussi le diff par rapport au contenu existant et, selon les fichiers touchés :

- unicité des ids, ancres locales résolues, balises et `lang="ar" dir="rtl"` ;
- navigation des onglets et liens de section, et correspondance du manifeste ;
- nombre de cases, compteurs, clés de progression et cibles quiz ;
- viewport, lisibilité mobile, focus clavier, `aria-live`, lien d'évitement et labels SVG ;
- absence de scripts tiers, `eval`, secrets ou dépendances ajoutées sans raison.

Ne déclare que les contrôles effectivement exécutés. Rapporte les constats par gravité
(bloquant, majeur, mineur), avec fichier et ligne quand c'est possible, la commande exacte
et un verdict explicite « conforme » ou « non conforme ».
