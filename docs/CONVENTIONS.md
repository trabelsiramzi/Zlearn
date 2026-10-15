# Conventions Zlearn — architecture générée

## Source et génération

`content/` est la source éditoriale, `templates/` et `src/` contiennent la présentation et le
comportement, et `site/` est généré. Ne pas éditer `site/` à la main. Après tout changement de
source, exécuter :

```sh
python3 scripts/build.py
python3 scripts/validate.py
```

`python3 scripts/build.py --check` doit réussir dans la CI et après un build déterministe.
La sortie publiée est `site/`.

## Données d’un dars

Chaque dars réside dans `content/<matière>/<NN>-<slug>/` :

- `meta.json` : identifiant, matière, numéro, slug, titre, titre court, préfixe et lien
  historique si nécessaire ;
- `lesson.html` : fragment HTML arabe RTL, sans layout global ;
- `questions.json` : tableau de questions avec id stable, type, phase, consigne, réponse,
  explication, section cible et difficulté ;
- `source.md` : transcription brute ou mention honnête qu’elle n’est pas conservée.

Le manifeste `content/subjects.json` est la liste ordonnée des matières et des leçons. Les
métadonnées du manifeste et le `meta.json` du dossier doivent rester identiques. Slugs de
dossier : `NN-slug`; id de dars et préfixe : `<préfixe matière><N>`; questions :
`<id>-q<NN>`. Les ids de sections sont uniques et stables. Ne jamais renommer un id de
question ni réutiliser un id retiré.

Utiliser `python3 scripts/new_lesson.py <matière> <numéro> <slug> <titre> <titre-court>`
pour créer un squelette. Compléter toutes ses données avant de builder ou publier ; le
squelette contient volontairement des champs de travail.

## Contenu pédagogique

Ordre recommandé : objectifs observables → pré-test de 2 questions → explication par blocs →
exemples résolus et parallèles → pratique → synthèse → étape suivante. Viser 2 à 4 objectifs,
8 à 12 questions, et des questions de rappel, compréhension et application ; chaque réponse
est expliquée et renvoie à la section pertinente. Une question entre dans la révision après
une première tentative. Une case cochée ne prouve pas la maîtrise.

Le contenu reste fidèle à l’enseignant. Une correction ASR n’est faite que si certaine et est
signalée à l’utilisateur. Un complément extérieur vérifié est séparé, étiqueté
**إضافة تعليمية** et sourcé. Un point incertain est marqué « à confirmer avec l’enseignant ».
Paraphraser les poèmes, versets et longs passages.

## Progression et compatibilité

Toute lecture ou écriture passe par `src/js/storage.js`. Le schéma courant est `zlearn:v2` ;
la migration v1 conserve les anciennes clés et doit être idempotente. Les imports acceptent
les formats v1 et v2 et n’importent que les clés prévues au catalogue généré. Les ids de
questions alimentent le catalogue de révision : ils ne changent pas après publication.

## HTML, RTL et accessibilité

- Le document a `lang="ar" dir="rtl"`, un seul `h1`, une hiérarchie logique, un viewport et
  des liens internes résolus.
- Préfixer les ids de sections et de contrôles avec l’id du dars. Préserver l’unicité dans la
  page générée ; les SVG informatifs ont un nom accessible.
- CSS dans `assets/site.css`, couleurs par variables avec thèmes clair/sombre, propriétés
  logiques, sans attribut `style`. Contraste texte/fond ≥ 4,5:1.
- JavaScript ES5 vanilla, concaténé par le build. Stockage navigateur protégé par `try/catch`
  avec repli mémoire. Le contenu reste lisible sans JavaScript.
- Focus visible, interactions clavier, annonces `aria-live`, zones tactiles confortables,
  affichage utilisable à 400 px. Aucun bouton ou lien factice.

## Validation et publication

`scripts/validate.py` contrôle les données, le site généré, les liens et le golden master
`tests/baseline.json`. Les anciens cours migrés peuvent avoir des écarts pédagogiques
historiques ; le validateur les signale sans modifier leur contenu. GitHub Actions exécute la
validation et le contrôle de build, puis publie `site/` sur GitHub Pages.
