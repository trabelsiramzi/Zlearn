---
name: zlearn-verifier-site
description: "Auditer le site Zlearn sans le modifier et rapporter les problèmes de structure, progression, navigation, RTL, accessibilité ou sécurité. À utiliser pour une vérification ou un audit demandé explicitement."
---

# Vérifier le site

Par défaut, audite le dépôt entier. Lance `python3 scripts/validate.py` et
`python3 scripts/build.py --check`, puis applique
la skill `zlearn-qa-verifier` aux fichiers concernés. N'effectue aucune correction dans ce
workflow d'audit ; décris les constats avec gravité, fichier/ligne, commande exécutée et
verdict. Ne prétends pas qu'un contrôle a réussi sans l'avoir lancé.
