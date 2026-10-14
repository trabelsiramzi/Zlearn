---
name: Transformer une transcription en leçon d’apprentissage
description: Convertit une transcription de cours (YouTube, audio, PDF recopié) en un parcours de leçon (objectifs, explications, exemples, pratique, feedback et aides de révision) puis l'intègre proprement au site HTML existant sans casser les dars précédents. À utiliser dès que l'utilisateur fournit une transcription et demande d'ajouter un dars, un chapitre ou une matière.
---

# Transformer une transcription en leçon d’apprentissage

Référence fonctionnelle : `SKILL-general.md` à la racine du projet. **La lire d'abord** et
appliquer ses règles (fidélité à la transcription, format du bloc, navigation, design).
Cette compétence ajoute les conventions **propres à ce projet** et le mode opératoire
d'intégration dans la page de la matière (`<matière>/index.html`).

> **Adaptation projet** : le site est **multi-pages** (accueil + un dossier par matière +
> assets partagés). Chaque dars s'intègre dans la page **de sa matière** ; le CSS/JS vit
> dans `assets/` et n'est pas dupliqué dans les pages.

## Étape 0 — Établir la certitude

Déterminer : **matière** (`fiqh`, `aqida`, `tajwid`, `sira`, `hadith`, `akhlaq`, `nahw`, ou nouvelle), **numéro du dars** et
**titre**. Si la matière ou le numéro ne peuvent pas être établis avec certitude,
**poser une question ciblée avant d'intégrer**. Ne jamais deviner un numéro de dars.

Vérifier les doublons : un dars déjà présent ne doit pas être réintégré.

## Étape A — Analyser la transcription

1. Lire la transcription **en entier**.
2. Lister les erreurs manifestes d'auto-transcription (noms, dates, termes techniques)
   et les corriger **uniquement** quand le contexte le permet.
3. Signaler, dans la réponse à l'utilisateur (jamais dans la page), chaque correction,
   approximation ou passage ambigu. Ne rien inventer pour combler un passage douteux.
4. Repérer ce qui peut tomber à l'examen : définitions, règles, classifications,
   énumérations, exemples, dates, noms propres.

## Étape B — Construire un parcours d’apprentissage

Hiérarchie : **Matière → Dars → Chapitres → Sous-chapitres → Notions essentielles**.

⚠️ Le brouillon (`brouillon-dars-<id>.md`) est **temporaire** : il doit être supprimé
dès que le dars est intégré et validé. Ne jamais le laisser dans le dépôt.

Construire le bloc de dars dans cet ordre (aligné sur `SKILL-general.md`) :

1. En-tête et **2 à 4 objectifs observables**.
2. Orientation courte : intérêt du dars et prérequis seulement s’ils sont connus.
3. Explications découpées en étapes, avec le visuel adapté au contenu.
4. Exemple résolu, puis un exercice parallèle à essayer avant de révéler le modèle.
5. **Pratique avec feedback** : rappel, compréhension et application ; réponses expliquées et renvoi au passage concerné.
6. Glossaire et synthèse de fin de leçon.
7. Contrôle d’apprentissage distinct des cases de mémorisation.
8. Navigation précédent/suivant et marqueur local « leçon terminée ».
9. Résumé, carte mentale et mémorisation comme aides complémentaires, pas comme cœur du parcours.

## Étape C — Intégrer au parcours du site

Le gabarit est dans `templates/lesson-block.html`. Les conventions de nommage sont dans
`references/project-conventions.md`. Méthode :

1. Identifier la **page de la matière** (`<matière>/index.html`) selon le dars.
2. Sauvegarder cette page :
   `cp "fiqh/index.html" "backups/fiqh-index.$(date +%Y%m%d-%H%M%S).html"`.
3. Écrire le bloc du dars dans un fichier séparé `dars-<id>.html` (jamais éditer à la main
   les très longues lignes du site).
4. Fusionner avec `scripts/merge_lesson.py`, qui **vérifie une ancre unique** avant
   d'insérer et échoue sinon (méthode recommandée par `SKILL-general.md` §Technique).
   **Ancre correcte** : la fermeture du conteneur `.subject`, c'est-à-dire le texte
   `</div>\n\n</main>` (par défaut dans le script, sans `--after` : on insère **avant**,
   donc le nouveau dars devient un enfant direct de `.subject`). Exemple :
   ```
   python3 .opencode/skills/transcript-to-lesson/scripts/merge_lesson.py \
     --site fiqh/index.html --fragment dars-l4.html
   ```
   Prendre le `</div>` de fin du dars précédent placerait le nouveau dars
   **imbriqué dans l'ancien** : erreur à éviter absolument.
5. Mettre à jour, **dans la page de la matière** : onglet `.tab` du dars, ligne `chips`
   du dars, et si besoin nouvelle matière (dossier `<matière>/index.html` + carte dans
   `index.html`). Le script de navigation du site **génère automatiquement** les liens de
   section manquants : au minimum, fournir la ligne `chips`. Relier le tab à son panneau
   par `aria-controls` / `aria-labelledby`, puis ajouter les titres et ancres du dars à
   `assets/search-index.js` pour la recherche inter-matières.
6. Si une **nouvelle matière** est créée : ajouter une entrée dans le manifeste
   `ZLEARN_MATIERES` de `assets/site.js` (avec `total` = nombre de cases) et une carte
   dans `index.html`. Si une matière existante gagne un dars contenant de nouvelles cases,
   vérifier que le `total` du manifeste reste juste (le validateur la vérifie).
7. Valider : `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .`
   puis vérification manuelle.

## Contrôles obligatoires (les mêmes que le site)

- Aucun id dupliqué ; tous les `href="#..."` pointent vers un id existant.
- Balises équilibrées ; `<html lang="ar" dir="rtl">`.
- Nombre de cases = compteur de progression du groupe.
- Quiz : chaque `data-target` de `.toggle-all` existe.
- Contenus précédents intacts (comparer le nombre de leçons avant/après).
- RTL et responsive : lisible à 400 px.

Lancer `scripts/validate_site.py` : il échoue (code ≠ 0) si un contrôle casse.

## Règles de contenu, de vérification et de droit d'auteur

- Ne jamais recopier un poème, des versets ou de longs passages. Paraphraser ; pour la
  mémorisation d'un texte, fournir une zone vide où l'utilisateur colle son propre texte
  (comme le composant `.verses` déjà présent).
- Pas de section « notes sur la transcription » dans la page : les corrections vont dans
  la réponse à l'utilisateur.
- Ton simple, progressif et orienté compréhension et application.

## Réponse finale à l'utilisateur

- Ajouté : matière, dars n°, contenu.
- À vérifier : corrections apportées, dates/noms incertains, tout ajout personnel,
  éventuel décalage de numérotation.
