---
description: "Améliorer un aspect du site sans casser l'existant"
---
Améliore le site Zlearn sur le point demandé : `$ARGUMENTS`
(par défaut : audit UX/UI + accessibilité + RTL, avec propositions avant modification).

État git actuel :
!`git status --short`

Contraintes :
- Charge les skills `zlearn-ameliorer-site` et `zlearn-rtl-arabe-a11y`.
- **Filet de sécurité** : travailler sur une branche git ou après un commit propre ; si
  l'état git ci-dessus montre des changements sans rapport, le signaler d'abord.
- Ne rien supprimer : préserver le contenu pédagogique et la progression (`localStorage`).
- Toute interaction ajoutée doit réellement fonctionner (pas de maquette).
- CSS par variables, thème clair/sombre, propriétés logiques RTL, lisible à 400 px.
- Styles et scripts partagés dans `assets/` ; aucun gros bloc dupliqué dans une page.
- Si le nombre de cases ou de dars change, mettre à jour `ZLEARN_MATIERES`.
- Après modification : `python3 scripts/validate_site.py .`, puis sous-agent `qa-verifier`.

Rends compte : modifications, fichiers, résultat exact des contrôles exécutés.
