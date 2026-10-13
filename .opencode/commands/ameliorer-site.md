---
description: Améliorer progressivement le site sans casser l'existant
---
Améliore le site Zlearn sur le point demandé : `$ARGUMENTS`
(par défaut : audit UX/UI + accessibilité + RTL).

Contraintes :
- Charger les compétences `rtl-arabic-a11y` et `transcript-to-lesson` (conventions).
- **Sauvegarder** la page modifiée dans `backups/` avant modification.
- Ne rien supprimer : préservation du contenu pédagogique et de la progression (localStorage).
- Toute interaction ajoutée doit réellement fonctionner (pas de maquette).
- CSS par variables, thème clair/sombre, propriétés logiques RTL, lisible à 400 px.
- Le style/script partagés vivent dans `assets/` ; ne pas dupliquer de gros blocs dans une page.
- Si le nombre de cases change, mettre à jour le `total` de la matière dans `ZLEARN_MATIERES`.
- Après modification : `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .`
  puis sous-agent `qa-verifier`.

Rends compte : modifications, fichiers, sauvegarde, résultat des tests exécutés.
