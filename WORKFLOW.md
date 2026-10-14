# Zlearn — guide d'utilisation et workflow

Site d’apprentissage de la première année, **statique et multi-pages** :
- `index.html` — accueil (liste des matières, parcours, progression d’apprentissage) ;
- `fiqh/index.html`, `aqida/index.html`, `tajwid/index.html`, `sira/index.html`,
  `hadith/index.html`, `akhlaq/index.html`, `nahw/index.html` — une page par matière ;
- `assets/site.css` / `assets/site.js` — style et script partagés.

Aucun build, aucune dépendance runtime. Ouvrir `index.html` dans un navigateur suffit.
Pour que `localStorage` (progression, thème) et les chemins relatifs fonctionnent
partout, servir le dossier est recommandé.

## Lancer le site

```sh
# recommandé : petit serveur local (localStorage fiable)
python3 -m http.server 8000             # puis http://localhost:8000/

# ou au choix (ouverture directe du fichier)
xdg-open index.html                     # Linux
open    index.html                      # macOS
```

## Ajouter un dars à partir d'une transcription

Utiliser la commande OpenCode `/nouveau-dars` :

```text
/nouveau-dars  <collez ici la transcription>
# ou
/nouveau-dars  chemin/vers/transcription.txt
```

Elle enchaîne automatiquement :
1. `pedagogy-organizer` — transforme la transcription en parcours d’apprentissage (objectifs, explications, exemples, exercices, feedback, sources et aides de révision) dans un brouillon temporaire
   `brouillon-dars-<id>.md` (supprimé après intégration).
2. `frontend-integrator` — sauvegarde la **page de la matière** (`<matière>/index.html`),
   écrit le bloc depuis le gabarit, fusionne et met à jour la navigation de la page.
3. `qa-verifier` — contrôle indépendant (ids, ancres, quiz, progression, RTL, JS, régressions).
4. **Suppression du brouillon** — le fichier temporaire est supprimé une fois le dars
   intégré et validé.

Si la matière ou le numéro du dars est incertain, l'agent **pose une question** avant d'intégrer.

### Format attendu de la transcription

- Un fichier texte/`.md` (sous-titres YouTube collés, sortie d'ASR, PDF recopié) ou la transcription collée directement.
- Idéalement, préciser en tête : **matière** (`fiqh` / `aqida` / `tajwid` / `sira` / `hadith` / `akhlaq` / `nahw`) et **numéro du dars**
  (il sera déduit du contenu s'il est absent, mais une indication évite toute ambiguïté).
- Indiquer le **titre** s'il est connu.

## Vérifier le site

```sh
# contrôle obligatoire (sans dépendance) — dossier = toutes les pages + manifeste
python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .

# contrôle DOM optionnel (nécessite jsdom) — idem, toutes les pages
npm install jsdom
node .opencode/skills/transcript-to-lesson/scripts/dom_test.cjs

# ou la commande OpenCode :
/verifier-site
```

## Autres commandes

- `/verifier-site` — lance le validateur et le QA.
- `/ameliorer-site <axe>` — améliore le site (UX/UI, accessibilité, RTL…) sans casser l'existant.

## Sauvegardes

Avant toute modification de masse, une copie horodatée est créée dans `backups/`
(le dossier est ignoré par git). Ne jamais supprimer ni réécrire un dars existant.

## Fichiers clés

| Fichier | Rôle |
| ------- | ---- |
| `SKILL-general.md` | Référence fonctionnelle de transformation des transcriptions |
| `index.html` | Accueil : matières, dars, progression |
| Pages `fiqh/`, `aqida/`, `tajwid/`, `sira/`, `hadith/`, `akhlaq/`, `nahw/` | Une page par matière |
| `assets/site.css`, `assets/site.js` | Style et script partagés (+ manifeste `ZLEARN_MATIERES`) |
| `AGENTS.md` | Instructions projet pour OpenCode |
| `.opencode/skills/transcript-to-lesson/` | Compétence + scripts + gabarit + conventions |
| `.opencode/skills/rtl-arabic-a11y/` | Règles RTL / arabe / accessibilité |
| `.opencode/agents/` | Agents `pedagogy-organizer`, `frontend-integrator`, `qa-verifier` |
| `.opencode/commands/` | Commandes `/nouveau-dars`, `/verifier-site`, `/ameliorer-site` |
