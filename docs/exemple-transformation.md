# Exemple de transformation d'une transcription (illustratif)

> **Exemple de démonstration**, à but pédagogique. La transcription ci-dessous est un court
> texte fictif qui illustre l'enchaînement des trois rôles (analyse → intégration → contrôle).
> Il n'a pas été ajouté au site réel. Le contenu de sciences islamiques, quand il est réel,
> doit toujours venir de la transcription du professeur.

## 1. Entrée : transcription brute

Fichier fourni par l'utilisateur, par ex. `transcript-tj4.txt` :

```text
... اليوم نتحدث عن أحكام النون الساكنة والتنوين. للنون الساكنة والتنوين أربعة أحكام:
الإظهار، والإدغام، والإقلاب، والإخفاء. الإظهار حروفه ستة... الإدغام حروفه ستة «يرملون»
وهو قسمان... الإقلاب حرفه واحد وهو الباء... الإخفاء حروفه خمسة عشر...
```

## 2. Analyse (rôle `zlearn-pedagogy-organizer`)

- **Matière** : `tajwid`. **Dars** : n° 4 (le site en compte déjà 3). **Titre** : أحكام النون
  الساكنة والتنوين.
- Chapitre repéré : « الأحكام الأربعة », 4 sous-chapitres (الإظهار / الإدغام / الإقلاب / الإخفاء).
- Définitions : 4 termes. Données chiffrées : 6 / 6 / 1 / 15.
- Visuels : encadrés « règle » (`.rule-box`) par حكم + glossaire (`.terms`).
- Points d'examen : les 4 noms, les nombres de lettres, le seul حرف de الإقلاب.
- Livrable : `brouillon-dars-tj4.md` (résumé 3 phrases + plan + glossaire + questions +
  checklist + « À vérifier »).

## 3. Intégration (rôle `zlearn-frontend-integrator`)

Préfixe d'id `tj4-`, clé de progression `tj4`. Gabarit `templates/lesson-block.html` →
`dars-tj4.html`, puis fusion dans la page de la matière :

```sh
git switch -c lesson/tajwid-4
python3 scripts/merge_lesson.py --site tajwid/index.html --fragment dars-tj4.html
```

Puis, à la main : onglet dans la ligne `.tabs[data-subject="tajwid"]`, ligne `.chips`,
carte d'accueil, `assets/search-index.js`, et dans `assets/site.js` le manifeste
(`total` = cases, `lessons` = 4).

```html
<button class="tab" type="button" role="tab" id="tab-tajwid-4" aria-controls="lesson-tj4"
        data-lesson="4" aria-selected="false">الدرس الرابع<small>أحكام النون الساكنة</small></button>
```

## 4. Contrôle (rôle `zlearn-qa-verifier`)

```sh
python3 scripts/validate_site.py .
node scripts/dom_test.cjs        # optionnel, nécessite jsdom
```

Résultat attendu : aucun id dupliqué par page, toutes les ancres résolues, un onglet par dars,
compteurs et manifeste cohérents.

## 5. Correspondance transcription → bloc

| Élément de la transcription | Élément du bloc de dars                     |
| --------------------------- | ------------------------------------------- |
| Les 4 noms d'ahkam          | `<section id="tj4-parts">` + 4 `.rule-box`  |
| Les définitions             | `<section id="tj4-terms">` (`<dl class="terms">`) |
| Les nombres de lettres      | cases `<input id="tj4-kN">`                 |
| Les questions d'examen      | `<section id="tj4-quiz">` (8 à 12 `<details>`) |
| L'idée générale             | `<section id="tj4-summary">` (3 phrases)    |
| La mise en pratique         | `.application#tajwid4-activity`             |
