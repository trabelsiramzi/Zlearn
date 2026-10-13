# Exemple de transformation d'une transcription (illustratif)

> **Exemple de démonstration**, à but pédagogique. La transcription ci-dessous est un
> court texte fictif ; il a servi à tester mécaniquement le pipeline
> (`pedagogy-organizer` → `frontend-integrator` → `qa-verifier`) sur une **copie** du site.
> Il n'a pas été ajouté au site réel. Le contenu de sciences islamiques, quand il est
> réel, doit toujours venir de la transcription du professeur.

## 1. Entrée : transcription brute

Fichier fourni par l'utilisateur, par ex. `transcript-tj3.txt` :

```text
... اليوم نتحدث عن أحكام النون الساكنة والتنوين. للنون الساكنة والتنوين أربعة أحكام:
الإظهار، والإدغام، والإقلاب، والإخفاء. الإظهار حروفه ستة... الإدغام حروفه ستة «يرملون»
وهو قسمان... الإقلاب حرفه واحد وهو الباء... الإخفاء حروفه خمسة عشر...
```

## 2. Analyse (`pedagogy-organizer`)

- **Matière** : `tajwid`. **Dars** : n° 3. **Titre** : أحكام النون الساكنة والتنوين.
- Chapitre repéré : « الأحكام الأربعة » avec 4 sous-chapitres (الإظهار/الإدغام/الإقلاب/الإخفاء).
- Définitions : 4 termes. Données chiffrées : 6 / 6 / 1 / 15.
- Visuels retenus : encadrés « règle » (`.rule-box`) pour chaque hukm + glossaire (`.terms`).
- Points d'examen : les 4 noms, les nombres de lettres, le seul حرف de l'الإقلاب.
- Livrable : `brouillon-dars-tj3.md` (résumé 3 phrases + plan + glossaire + quiz + checklist).

## 3. Intégration (`frontend-integrator`)

Préfixe d'id `tj3-`, clé de progression `tj3`. Gabarit `templates/lesson-block.html` →
`dars-tj3.html`, puis fusion **dans la page de la matière** (`tajwid/index.html`) :

```sh
cp "tajwid/index.html" "backups/tajwid-index.$(date +%Y%m%d-%H%M%S).html"
python3 .opencode/skills/transcript-to-lesson/scripts/merge_lesson.py \
  --site "tajwid/index.html" \
  --fragment dars-tj3.html
```

Puis ajout de l'onglet dans la ligne `.tabs[data-subject="tajwid"]` :

```html
<button class="tab" type="button" role="tab" data-lesson="3" aria-selected="false">
  الدرس الثالث<small>أحكام النون الساكنة</small>
</button>
```

La ligne `.chips` est facultative : la TOC est complétée automatiquement au chargement.
Si un dars ajoute des cases, penser à mettre à jour le `total` de `tajwid` dans le
manifeste `ZLEARN_MATIERES` (`assets/site.js`).

## 4. Contrôle (`qa-verifier`)

```sh
python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .
# optionnel, si jsdom est installé :
node .opencode/skills/transcript-to-lesson/scripts/dom_test.cjs
```

Résultat attendu après ajout : 9 groupes de mémorisation au total (3 par matière), 9 quiz,
aucun id dupliqué par page, toutes les ancres résolues, un onglet par dars.

## 5. Correspondance transcription → bloc

| Élément de la transcription | Élément du bloc de dars            |
| --------------------------- | ---------------------------------- |
| Les 4 noms d'ahkam          | `<section id="tj3-parts">` + 4 `.rule-box` |
| Les définitions             | `<section id="tj3-terms">` (`<dl class="terms">`) |
| Les nombres de lettres      | checklist `<input id="tj3-kN">`    |
| Les questions d'examen      | `<section id="tj3-quiz">` (10-12 `<details>`) |
| L'idée générale             | `<section id="tj3-summary">` (3 phrases) |
