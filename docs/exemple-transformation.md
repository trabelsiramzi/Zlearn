# Exemple de structure d'un dars Zlearn

Ce document explique le découpage des fichiers source. Les valeurs ci-dessous sont un
exemple de schéma, pas un contenu pédagogique à copier.

```text
content/nahw/04-example/
├── meta.json
├── lesson.html
├── questions.json
└── source.md
```

`meta.json` contient les mêmes métadonnées que l'entrée de `content/subjects.json` : id
stable (`nh4`), matière, numéro, slug, titre, titre court, préfixe, id historique si requis,
libellé de navigation et nom du fichier source.

`lesson.html` est un fragment, sans document HTML complet ni dépendance externe. Utiliser
`lang="ar" dir="rtl"`, des sections identifiées de façon stable et des contrôles accessibles.
Le gabarit `templates/lesson-page.html` fournit le cadre de page. Ne jamais modifier son
résultat généré sous `site/`.

`questions.json` est une liste dont chaque entrée contient `id`, `type`, `phase`, `prompt`,
`answer`, `explain`, `section` et `difficulty`. Les ids suivent `nh4-q01`, `nh4-q02`, etc. ;
la section est un id réellement présent dans `lesson.html`.

`source.md` conserve la transcription brute et les références vérifiées, ou précise
explicitement que la transcription d'origine n'a pas été conservée.

Générer et contrôler :

```sh
python3 scripts/build.py
python3 scripts/validate.py
python3 scripts/build.py --check
```
