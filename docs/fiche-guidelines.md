# Rédiger la « ورقة الدرس » (fiche.json)

Chaque dars a une fiche de synthèse d'une page A4, affichée en tête de la page du dars et imprimable.
Elle est décrite par `content/<matière>/<NN>-<slug>/fiche.json` et rendue par `scripts/fiche.py`
(jamais de HTML écrit à la main). Modèle de référence : `content/fiqh/02-lesson/fiche.json`.

## Principe

La fiche **condense** le cours ; elle n'ajoute rien. Chaque phrase vient du `lesson.html` du même dars
(mêmes mots, raccourcis). Pas d'information nouvelle, pas de complément extérieur, pas de rappel
de mémoire. Un point incertain : le laisser de côté. Le cours reste intact (aucune modification de
`lesson.html`, `questions.json`, `meta.json`, `source.md`).

## Schéma

```json
{
  "subtitle": "( texte court sous le titre, ex. مقدمة «المرشد المعين» لابن عاشر )",
  "sticky": {"title": "الأبيات المطلوب حفظها", "abyatSection": "<id d'une <section> du cours contenant des .bayt>"},
  "blocks": [ { ... 3 à 6 blocs ... } ],
  "khulasa": "خلاصة في جملة إلى ثلاث جمل"
}
```

- `sticky` (post-it) est optionnel. Utiliser **`abyatSection`** si le cours contient un poème (`<div class="bayt">`) :
  les vers sont copiés tels quels. Sinon **`pointsSection`** avec l'id de la section « تحقق من فهمك »
  (cases à cocher) et `"title": "المطلوب حفظه"`. Si ni vers ni points : omettre `sticky`.
- 3 à 6 blocs, numérotés automatiquement dans l'ordre. Ordre conseillé : مدخل → idée centrale
  (tableau ou liste) → شرح الألفاظ → التقسيمات / الأمثلة → تنبيه. Adapter au dars.

### Bloc

| Champ | Valeurs |
|---|---|
| `title` | titre court (1 à 4 mots) |
| `icon` | `bulb scales pencil list star book alert pin target key compass clock flag question link heart mosque pen` |
| `type` | `bullets` · `rows` · `terms` · `cards` |
| `span` | `full` (pleine largeur, défaut) ou `half` (deux blocs `half` consécutifs côte à côte) |
| `tone` | optionnel : `green blue purple orange teal rose` (par défaut cycle automatique) |
| `warning` | optionnel `{"title": "تنبيه", "text": "…"}` : cadre pointillé |

- `bullets` : `"items": ["…"]` (1 à 6 phrases courtes).
- `rows` : `"rows": [{"term": "…", "text": "…"}]` (1 à 7) : tableau terme → définition/exemple/effet.
- `terms` : `"items": [{"term": "…", "text": "…"}]` (1 à 7) : lexique « شرح الألفاظ ».
- `cards` : `"cards": [{"title": "…", "text": "…"}]` (1 à 4) : petites cartes ; `warning` s'ajoute comme 3e carte.

### Balisage dans les textes

`**gras**` (mot clé coloré) et `[[terme]]` (terme coloré). Tout le reste est du texte brut (pas de HTML).

## Règles de rédaction

1. Phrases courtes (≤ 25 mots) ; un bloc tient en 3 à 6 lignes sur A4.
2. Garder les termes et la formulation du professeur ; les ids et titres du cours ne changent pas.
3. Ne pas paraphraser les vers ni les versets/hadiths cités : si besoin, les citer entre « » mot pour mot.
4. Le `khulasa` répond à : « qu'est-ce que je dois retenir ? » (1 à 3 phrases).
5. Une fiche par dars, 1 page A4 : pas plus de 6 blocs, pas plus de ~230 mots hors vers.

## Contrôles (obligatoires)

```sh
python3 scripts/validate.py --content-only   # structure, sections citées, fidélité au cours (≥ 60 % des mots)
python3 scripts/build.py && python3 scripts/validate.py
python3 scripts/build.py --check
```

Le validateur compare chaque texte de la fiche au texte du dars (mots normalisés) : sous 60 %,
erreur ; sous 75 %, avertissement. Un avertissement signale presque toujours une phrase
inventée ou trop éloignée du cours : la réécrire à partir des mots du cours.
