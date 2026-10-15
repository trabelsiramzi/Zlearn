# Zlearn — instructions projet

Site d’apprentissage de la première année (enseignement zaytounien) en arabe RTL : un site
**statique multi-pages** (accueil + un dossier par matière + assets partagés), sans build
ni dépendance runtime.

## Fichiers de référence

- `SKILL-general.md` — **référence fonctionnelle** pour transformer une transcription en leçon qui enseigne, fait pratiquer et permet de vérifier sa compréhension. Les compléments externes doivent être vérifiés et signalés.
- `index.html` — page d'accueil : liste les matières, leurs dars et leur progression.
- `fiqh/index.html`, `aqida/index.html`, `tajwid/index.html`, `sira/index.html`,
  `hadith/index.html`, `akhlaq/index.html`, `nahw/index.html` — **une page par matière**
  contenant ses dars. C'est **l'unique** document à modifier pour une matière donnée.
  Ne jamais créer un site parallèle ni réinitialiser les contenus existants.
- `assets/site.css` — tout le style (variables `--xxx`, thème clair/sombre).
- `assets/site.js` — script partagé ES5, progression et interactions ;
- `assets/search-index.js` — titres des sections de toutes les matières pour la recherche globale.
- `backups/` — sauvegardes horodatées avant toute modification importante.

## Règles non négociables

1. **Préserver le contenu pédagogique** : ne jamais supprimer ni remplacer un dars/chapitre existant.
2. Toujours **sauvegarder** la page modifiée avant une modification de masse (`backups/`).
3. Chaque nouvelle section reçoit un **id unique préfixé par le dars** (ex. `l4-summary`).
4. Les **checkbox**, les ids SVG et les cibles de quiz restent uniques dans toute la page ;
   les sections n'ont pas à être uniques **entre** les pages (chaque dars a son préfixe).
5. Le site doit rester **lisible à 400 px**, RTL, thème clair/sombre cohérent.
6. Interactions réelles uniquement : pas de maquette, pas de bouton mort.
7. Après toute modification, lancer le **validateur** (dossier = toutes les pages +
   cohérence du manifeste) :
   `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .`

## Workflow d'ajout d'un dars

Utiliser `/nouveau-dars` (commande `.opencode/commands/nouveau-dars.md`) qui orchestre :
`pedagogy-organizer` (analyse) → `frontend-integrator` (intégration) → `qa-verifier` (contrôle).
La compétence `.opencode/skills/transcript-to-lesson` détaille les étapes et les conventions.

### Utilisation avec Codex

Les workflows adaptés à Codex sont dans `.agents/skills/` (format `SKILL.md`). Les charger
selon la tâche :

- ajout de leçon depuis une transcription : `$zlearn-ajouter-dars` ;
- amélioration ciblée : `$zlearn-ameliorer-site` ;
- audit sans modification : `$zlearn-verifier-site` ;
- exigences RTL/accessibilité : `$zlearn-rtl-arabe-a11y`.

Les compétences `zlearn-pedagogy-organizer`, `zlearn-frontend-integrator` et
`zlearn-qa-verifier` reprennent les responsabilités des agents OpenCode comme étapes
distinctes. Elles ne lancent pas automatiquement des sous-agents ; Codex applique ces
rôles dans le workflow courant, sauf si l'utilisateur demande explicitement une délégation.
Les fichiers `.opencode/` restent la référence historique pour OpenCode ; ne pas les
modifier lors d'une adaptation Codex.

## Adaptation projet

Le site a été découpé depuis un fichier unique initial vers un site multi-pages pour
alléger chaque page. La cible d'écriture est la page de la matière. Chaque dars doit d’abord enseigner, puis faire pratiquer et guider l’étudiant vers la suite. Les résumés, listes de mémorisation et quiz de rappel restent des aides complémentaires. Les styles/scripts sont mutualisés dans `assets/`.

## Style du code

- CSS : variables `--xxx` uniquement, compatibles thème sombre ; pas de couleur en dur.
- JS : ES5 vanilla (le site cible des navigateurs mobiles anciens), enveloppé dans des IIFE.
- Arabe : `dir="rtl" lang="ar"`, police `Amiri` (titres) + `IBM Plex Sans Arabic` (texte).
- Mémorisation : chaque page matière enregistre son agrégat sous `mourshid-prog-<matière>` ;
  les `total` du manifeste `ZLEARN_MATIERES` (dans `assets/site.js`) doivent correspondre
  au nombre réel de cases. Le parcours de leçons terminées est stocké séparément sous
  `mourshid-learning-<matière>` ; `lessons` doit correspondre aux dars publiés.
