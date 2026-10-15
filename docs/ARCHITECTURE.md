# Architecture Zlearn

Zlearn reste un site statique sans dépendance runtime. `content/subjects.json` et les
dossiers `content/<matière>/<NN>-<slug>/` sont la source. Le build standard-library Python
combine ces données avec `templates/`, `src/` et les ressources partagées pour créer `site/`.

`site/` contient l’accueil, les sommaires par matière, une page par dars, la révision mêlée,
les anciennes routes de redirection, les assets, le manifeste PWA, le service worker et
`404.html`. Il est reproductible et ne doit jamais être modifié directement.

Le JavaScript est écrit en ES5 et concaténé au build. `src/js/storage.js` assure compatibilité
avec les clés v1 et le schéma `zlearn:v2`; quiz et révision utilisent des ids de questions
stables. Le texte de leçon est présent dans chaque page HTML générée même sans JavaScript.

Flux local :

```sh
python3 scripts/build.py
python3 scripts/validate.py
python3 scripts/build.py --check
```

La CI suit le même flux et publie le dossier `site/` depuis la branche `restructuration`.
Voir `docs/CONVENTIONS.md` pour les contrats détaillés.
