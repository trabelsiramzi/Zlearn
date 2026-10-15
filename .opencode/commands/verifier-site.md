---
description: "Vérifier le site (ids, ancres, quiz, progression, JS, régressions) sans rien modifier"
---
Vérifie l'état actuel du site Zlearn et rends un rapport factuel, sans modifier de fichier.

Cible : `$ARGUMENTS` (par défaut, la racine du site).

État git actuel :
!`git status --short`

1. Exécute le validateur statique (toutes les pages + manifeste) :
   `python3 scripts/validate_site.py .`
2. Lance le sous-agent **qa-verifier** pour la revue complète (ids, ancres, balises,
   navigation, quiz, progression, RTL/mobile, JS, régressions, dépendances/sécurité).
3. Rapporte : commandes exécutées, résultat exact, problèmes par sévérité (bloquant /
   majeur / mineur) avec fichier et ligne, puis un verdict « conforme » ou « non conforme ».

N'affirme jamais qu'un contrôle est passé sans l'avoir réellement exécuté.
