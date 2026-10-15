---
name: zlearn-verifier-site
description: Auditer le site Zlearn sans le modifier et rapporter les problèmes de structure, progression, navigation, RTL, accessibilité ou sécurité.
---

# Vérifier le site

Par défaut, audite le dépôt entier. Lance
`python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .`, puis applique
`zlearn-qa-verifier` aux fichiers concernés. N'effectue pas de corrections dans ce workflow
d'audit ; décris les constats avec gravité, fichier/ligne, commande exécutée et verdict.
Ne prétends pas qu'un contrôle a réussi sans l'avoir lancé.
