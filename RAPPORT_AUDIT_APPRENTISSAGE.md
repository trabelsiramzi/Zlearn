# Rapport d’audit — expérience d’apprentissage Zlearn

**Date :** 14 octobre 2026  
**Périmètre :** page d’accueil, sept pages de matières, script partagé, styles, consignes pédagogiques et validateur.  
**But :** identifier les manques qui empêchent le site de devenir un outil d’apprentissage fiable, motivant, accessible et efficace sur la durée.

## Synthèse

Zlearn possède déjà une bonne base de révision : pages séparées par matière, RTL arabe, mode clair/sombre, recherche, navigation par matière et dars, liens vers les sections, cartes mentales adaptées au petit écran, cases mémorisées, quiz à réponses révélées et suivi « à revoir ». Le validateur passe sur l’ensemble du site.

La limite principale n’est donc pas l’absence de composants, mais le manque d’un parcours pédagogique complet et cohérent. Le dépôt compte actuellement **7 matières, 21 dars et 234 cases de mémorisation** ; chaque matière n’a que trois dars. Certaines pages présentent explicitement un contenu progressivement enrichi : il faut donc afficher cet état comme un parcours en cours, et ne pas laisser croire que les trois dars couvrent le programme entier.

### État mesuré

| Matière | Dars présents | Cases de mémorisation | Quiz |
|---|---:|---:|---:|
| Fiqh | 3 | 35 | 3 |
| Aqida | 3 | 41 | 3 |
| Tajwid | 3 | 36 | 3 |
| Sira | 3 | 36 | 3 |
| Hadith | 3 | 36 | 3 |
| Akhlaq | 3 | 23 | 3 |
| Nahw | 3 | 27 | 3 |
| **Total** | **21** | **234** | **21** |

Les quiz contiennent de 10 à 12 questions par dars. Les pages Akhlaq et Nahw n’ont pas de section explicite d’objectifs d’apprentissage dans leurs trois dars. Les autres pages en ont une.

## Points forts à préserver

- La séparation des matières évite un document monolithique et facilite le repérage.
- Chaque dars a une structure de révision reconnaissable : résumé, carte, notions, glossaire, checklist et quiz.
- Le contenu reprend généralement le cours fourni et signale parfois qu’une explication suit le propos de l’enseignant.
- Les réponses des quiz sont masquées par défaut ; la mémorisation des cases et l’auto-évaluation sont sauvegardées localement.
- La recherche arabe ignore les voyelles et normalise plusieurs variantes de lettres, ce qui est utile pour retrouver une notion.
- Navigation clavier des onglets, lien d’évitement, focus visible, labels de recherche et adaptations mobiles des cartes mentales sont déjà présents.
- Le mode sombre et les couleurs reposent en grande partie sur des variables partagées.

## Constats et améliorations à prioriser

### P0 — Clarifier la couverture du programme

**Constat.** Chaque matière affiche exactement trois dars. L’accueil annonce une mise à jour progressive, mais ne donne ni nombre de dars attendus, ni statut de complétude, ni indication des prochains chapitres. Le manifeste `ZLEARN_MATIERES` contient le nombre de cases, pas l’avancement du programme.

**Risque.** Un étudiant peut confondre « trois dars disponibles » avec « matière couverte » et réviser un corpus incomplet avant une évaluation.

**À faire.** Ajouter pour chaque matière un statut explicite (« en cours », « programme complet »), le nombre de dars disponibles et, si le programme est connu, le nombre attendu. Ajouter une carte du programme qui distingue les dars publiés, les dars à venir et les notions non encore traitées. N’annoncer un taux de couverture que si le programme de référence est établi.

**Réussite mesurable.** Depuis l’accueil, l’étudiant sait en un coup d’œil ce qui est disponible et si la matière est complète ; aucune progression de mémorisation n’est présentée comme une progression de couverture du cours.

### P0 — Ajouter des objectifs et un chemin d’étude à chaque dars

**Constat.** Les six dars Akhlaq et Nahw n’ont pas d’objectifs pédagogiques explicites, contrairement aux dars des autres matières. Les pages de matière ne proposent pas non plus un chemin uniforme du type « apprendre → s’exercer → vérifier → revenir ».

**À faire.** Pour chaque dars, écrire 2 à 4 objectifs observables en arabe, par exemple « يميّز بين… », « يشرح… », « يطبّق… ». Ajouter un encart de démarrage avec durée indicative, prérequis et ordre conseillé des sections. Garder les objectifs strictement liés au contenu effectivement enseigné.

**Réussite mesurable.** Chaque dars a des objectifs évaluables ; chaque objectif est relié à au moins une activité ou une question du quiz.

### P1 — Faire des quiz un véritable outil de diagnostic

**Constat.** Les questions et réponses sont des éléments de rappel à réponse révélée. L’apprenant s’attribue lui-même « عرفتها » ou « أحتاج مراجعة » : le score mesure donc sa confiance déclarée, pas la justesse d’une réponse. Les exercices d’application, de distinction entre cas proches et de transfert sont peu standardisés.

**À faire.** Garder la révélation pour les questions de mémorisation, mais ajouter un petit nombre d’exercices à réponse saisie ou choix multiple avec correction explicite. Varier les niveaux : rappel, compréhension, application, repérage d’erreur. Pour chaque mauvaise réponse, renvoyer au paragraphe concerné. Présenter le score comme « auto-évaluation » tant qu’il n’est pas calculé depuis les réponses.

**Réussite mesurable.** Un étudiant peut démontrer ce qu’il sait faire sans devoir déclarer lui-même qu’il a réussi ; les erreurs conduisent directement au passage à revoir.

### P1 — Transformer la progression locale en plan de révision fiable

**Constat.** Les cases et les auto-évaluations sont stockées dans `localStorage` du navigateur. La progression n’est pas synchronisée entre appareils et peut disparaître si les données du navigateur sont effacées. La recommandation de révision espacée repose sur la date de dernière auto-évaluation du quiz, pas sur une mesure de maîtrise indépendante.

**À faire.** Afficher clairement « sauvegardé sur cet appareil », proposer export/import de la progression (JSON) comme solution adaptée au site statique, et distinguer « vu », « à revoir » et « maîtrisé ». Rendre les dates de révision visibles et permettre de reprendre les éléments à revoir depuis l’accueil.

**Réussite mesurable.** L’étudiant sait où sa progression est conservée, peut la transférer et retrouve une liste exploitable de notions à revoir.

### P1 — Donner une provenance aux affirmations et citations

**Constat.** Les fiches ne donnent généralement pas de référence précise au dars source (lien, date, chapitre ou minutage). Certaines présentent des hadiths, des paroles rapportées et des formulations doctrinales. Les textes sont signalés comme venant du cours à certains endroits, mais la provenance n’est pas systématique.

**À faire.** Ajouter une référence compacte par dars : enseignant, titre ou lien de la séance, date si connue, et repères temporels si disponibles. Distinguer clairement citation, paraphrase et commentaire de l’enseignant. Pour les hadiths ou propos attribués à un auteur, conserver la formulation fidèle au cours et faire vérifier l’attribution par un enseignant compétent avant de présenter une référence critique. Ne pas ajouter de correction de fond non sourcée dans les fiches.

**Réussite mesurable.** Une affirmation importante peut être retrouvée dans sa source et l’étudiant distingue ce qui a été dit en cours de ce qui relève d’une vérification éditoriale.

### P1 — Mettre en place une validation pédagogique des contenus de grammaire

**Constat ciblé.** Dans Nahw, dars 2, la leçon présente `يخرج` comme lié au moment de parole ; cette présentation est attribuée au cours, mais la portée du مضارع et la distinction entre forme verbale et valeur temporelle méritent une relecture selon le programme enseigné. Dars 3 classe les exemples de حروف المعاني selon le nombre de lettres écrites ; il faut vérifier que ce classement et les exemples correspondent bien au référentiel de l’enseignant.

**À faire.** Faire relire ces passages par un enseignant de نحو, en conservant une note éditoriale « selon l’explication du cours » quand il s’agit d’une simplification pédagogique. Établir une petite procédure de relecture des termes, exemples et citations pour toutes les matières.

**Réussite mesurable.** Les simplifications sont signalées, les notions sont conformes au support de cours et les étudiants ne confondent pas une explication introductive avec une règle exhaustive.

### P2 — Corriger les incohérences de l’accueil

**Constat.** Le sous-titre de l’accueil cite les sept matières, mais les étiquettes de livres sous le titre n’en citent que trois (fiqh, aqida, tajwid). La page elle-même liste bien sept matières. Les liens des dars sont fonctionnels et mènent aux bons ids.

**À faire.** Remplacer ces trois étiquettes par une information complète et utile : nombre de matières, statut de mise à jour, ou courte explication du fonctionnement. Vérifier que les libellés de matière et le nom du livre sont uniformes entre l’accueil et le manifeste.

### P2 — Mesurer et améliorer l’accessibilité réelle

**Constat.** Le code comprend plusieurs bonnes pratiques (RTL, tailles de base confortables, focus visible, lien d’évitement, navigation clavier, alternatives textuelles des SVG, cartes mentales en liste sur mobile). Le validateur du site ne teste toutefois pas les contrastes, la navigation avec lecteur d’écran, la hauteur réelle des cibles tactiles, ni le rendu dans un navigateur à 400 px. Les boutons `.btn` et onglets n’ont pas tous une hauteur minimale explicitement fixée à 44 px. Le contenu des SVG est remplacé sur petit écran par une liste, mais l’équivalence doit être contrôlée visuellement.

**À faire.** Faire une vérification manuelle à 400 px et à fort zoom, au clavier seul et avec un lecteur d’écran. Mesurer les contrastes clair/sombre et garantir des cibles tactiles de 44 × 44 px. Vérifier le comportement lorsque les polices distantes ne chargent pas et lorsque `localStorage` est indisponible. Ajouter des attributs de valeur minimum/courante aux barres de progression de la page d’accueil si elles sont exposées comme `progressbar`.

**Réussite mesurable.** Aucun défilement horizontal de page, aucune information perdue sans couleur/SVG, navigation complète au clavier, contrastes WCAG AA et commandes tactiles confortables.

### P2 — Clarifier les métadonnées et les repères de reprise

**Constat.** Les pages affichent les onglets et le contenu, mais aucune date d’ajout, durée indicative, statut de mise à jour ou repère de prérequis n’est systématique. L’état du dernier dars consulté est conservé par navigateur, ce qui aide à reprendre, mais n’est pas rendu explicite.

**À faire.** Ajouter seulement les métadonnées disponibles et vérifiées, puis un lien « reprendre le dernier dars » ou un état visuel clair. Ajouter un glossaire global/recherche de notions seulement si la navigation entre matières le justifie ; l’actuelle recherche reste limitée à la matière ouverte.

## Limites de cet audit

Cet audit a porté sur les fichiers, le contenu et le fonctionnement lisible dans le code. Le validateur automatisé a été exécuté ; aucun audit visuel dans un navigateur réel, test d’appareil mobile, mesure de contraste automatisée ni test avec lecteur d’écran n’a été effectué. Les constats portant sur l’exactitude disciplinaire sont des points à faire relire, pas des corrections doctrinales.

## Vérification technique effectuée

Commande exécutée : `python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .`  
Résultat : **toutes les pages valides**, manifeste cohérent, ids et ancres vérifiés, progression conforme au nombre de cases, quiz et groupes de mémorisation détectés.

## Ordre recommandé pour l’amélioration

1. **Rendre la couverture du programme transparente** et corriger les métadonnées de l’accueil.
2. **Définir des objectifs observables** et un chemin d’étude par dars.
3. **Ajouter des exercices diagnostiques** et des liens de correction vers le cours.
4. **Ajouter provenance et relecture pédagogique** pour les formulations sensibles et les matières techniques.
5. **Rendre la reprise de progression portable** et l’accessibilité vérifiée sur de vrais appareils.

Ces étapes renforcent la confiance et l’apprentissage sans retirer les fiches, les quiz ni les progrès déjà enregistrés.
