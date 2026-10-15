# Zlearn — consignes du dépôt

Zlearn est un site statique arabe RTL, généré depuis `content/` par `scripts/build.py`.
Les sources font foi ; `site/` est une sortie générée et ne se modifie jamais à la main.
L’architecture et les contrats sont décrits dans `docs/ARCHITECTURE.md` et
`docs/CONVENTIONS.md`.

## Règles impératives

1. Ne jamais supprimer, remplacer ou réécrire un dars publié. Préserver le texte arabe, les
   SVG, tableaux, questions et clés de progression. Les corrections se font par ajouts.
2. Travailler sur `restructuration` pour ce chantier, ou sur `lesson/<matière>-<NN>` pour un
   nouveau dars. Vérifier `git status` avant toute modification. Ne jamais pousser sur la
   branche principale.
3. La transcription est la source. Un complément extérieur vérifié porte l’étiquette
   **إضافة تعليمية** et sa référence ; un point incertain est « à confirmer avec l’enseignant ».
   Paraphraser les textes protégés, poèmes et longs passages.
4. Les ids de leçon et de question sont stables. Ne jamais renommer un id de question ou une
   clé `localStorage` sans migration qui conserve l’ancienne donnée.
5. L’interface reste RTL, lisible à 400 px, accessible au clavier, cohérente en clair/sombre.
   Aucun `style=""`, bouton mort, CDN ou dépendance runtime.
6. Après modification de `content/`, lancer `python3 scripts/build.py`, puis
   `python3 scripts/validate.py`. Pour vérifier seulement les sources :
   `python3 scripts/validate.py --content-only`.
7. Après modification, rapporter les commandes et sorties réellement obtenues ; ne jamais
   déclarer un contrôle réussi sans l’avoir exécuté.

## Architecture et outils

- `content/subjects.json` : manifeste des matières et métadonnées de dars.
- `content/<matière>/<NN>-<slug>/` : `meta.json`, `lesson.html`, `questions.json`, `source.md`.
- `templates/`, `src/`, `assets/` : gabarits et sources partagées.
- `scripts/build.py` : génération déterministe de `site/` ; `--check` vérifie sa fraîcheur.
- `scripts/validate.py` : contrôle du contenu, du site généré et de la baseline.
- `scripts/new_lesson.py` : crée le squelette d’un dars dans `content/`.
- `tests/baseline.json` : golden master de migration ; ne pas supprimer sans confirmation.

## Flux de livraison

Pour un dars, lire les skills `zlearn-ajouter-dars`, `zlearn-pedagogy-organizer`,
`zlearn-frontend-integrator` et `zlearn-qa-verifier`. Préparer les fichiers sources,
mettre à jour `content/subjects.json`, construire, valider, comparer à la baseline, puis
commiter. Sous Codex, suivre les rôles successivement sans délégation automatique.

Commandes principales :

```sh
python3 scripts/build.py
python3 scripts/build.py --check
python3 scripts/validate.py
node --check site/assets/site.js
node tests/srs.cjs
node tests/storage.cjs
```

La publication est produite dans `site/` par GitHub Actions. Les choix de restructuration
confirmés sont consignés dans `docs/restructuration-decisions.md`.
