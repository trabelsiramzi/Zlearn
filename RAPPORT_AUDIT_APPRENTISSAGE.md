# Rapport d’audit et de refonte — expérience d’apprentissage Zlearn

**Date :** 14 octobre 2026
**Périmètre :** accueil, sept matières, progression, styles/scripts partagés, consignes et validateur.
**Orientation retenue :** conserver le contenu du cours et signaler clairement tout ajout pédagogique externe vérifié.

## Synthèse

Zlearn est désormais présenté comme un **parcours d’apprentissage** : l’accueil propose de commencer ou de reprendre un dars, chaque leçon affiche ses objectifs, son contenu et une activité contextualisée, puis propose de marquer la leçon terminée et de naviguer vers le dars précédent/suivant ou une autre matière. Les listes de mémorisation et l’auto-évaluation restent des outils de soutien, séparés du suivi des leçons terminées.

Le site contient **7 matières, 21 dars publiés et 234 cases de mémorisation** (3 dars par matière actuellement). Ce décompte décrit le contenu publié, pas la couverture complète des programmes. Il faut conserver cette distinction tant qu’un référentiel officiel complet n’est pas fourni.

## Changements réalisés

- Accueil recentré sur le démarrage et la reprise d’apprentissage, avec un accès direct à chaque dars.
- Suivi local du dernier dars ouvert et du nombre de leçons terminées, distinct des cases et auto-évaluations. Une commande de fin de leçon et la navigation entre dars/matières sont disponibles.
- Objectifs pédagogiques explicites dans les 21 dars.
- Ajout d’une activité d’application par dars, tirée du contenu présent. Le critère de réponse reste masqué jusqu’à sa demande. Ces activités sont des exercices du cours, pas des compléments disciplinaires externes.
- Libellés de navigation harmonisés autour de l’apprentissage et de l’entraînement.
- Consignes du projet, gabarit et validateur adaptés au site à sept matières et au parcours d’apprentissage. Le validateur contrôle aussi le nombre de dars déclaré au manifeste.
- Les compléments externes, s’ils sont ajoutés à l’avenir, doivent porter le libellé **إضافة تعليمية** et une référence vérifiable à proximité. Les incertitudes restent signalées plutôt que comblées par supposition.

## Points qui restent à traiter

### 1. Couverture des programmes

Les pages présentent trois dars chacune, sans référentiel indiquant le nombre total de dars attendus. Le site doit continuer à afficher le nombre disponible sans annoncer un taux de complétude. Pour construire un véritable plan de programme, il faudra disposer des plans de cours officiels ou validés par les enseignants.

### 2. Évaluation formative

Les questions existantes reposent surtout sur la révélation d’un modèle et une auto-évaluation (« عرفتها » / « أحتاج مراجعة »). Le score mesure la confiance déclarée, pas la correction de la réponse. Les nouvelles activités développent l’application, mais ne sont pas corrigées automatiquement et leurs critères sont qualitatifs. Une prochaine étape pourrait ajouter des exercices à réponse saisie ou à choix multiples, avec correction et lien vers la notion concernée, après validation des réponses par un enseignant.

### 3. Provenance et validation des contenus

Les fiches sont fondées sur les transcriptions déjà fournies, mais les références de séance, dates et minutages ne sont pas toujours disponibles. Les formulations attribuées à des auteurs ou des textes religieux doivent rester fidèles à la séance et être relues par l’enseignant lorsqu’une vérification savante est nécessaire. Les exercices nouvellement ajoutés restent dans le périmètre du contenu existant et n’ajoutent pas de règle externe.

### 4. Relecture disciplinaire du Nahw

Le découpage pédagogique du dars 3 reprend les catégories présentées par l’enseignant et signale déjà que certains classements/exemples méritent confirmation. Le dars 2 expose la distinction temporelle selon le moment de parole telle que donnée dans la transcription. Une relecture par un enseignant de نحو demeure souhaitable avant de présenter ces formulations comme des règles exhaustives.

### 5. Portabilité de la progression

La progression est sauvegardée dans `localStorage` sur l’appareil courant ; elle n’est pas synchronisée. Une fonction d’export/import serait utile aux apprenants qui changent d’appareil. Elle n’a pas été ajoutée dans cette refonte.

### 6. Accessibilité réelle

Les fichiers prévoient RTL, thème clair/sombre, navigation clavier et adaptation mobile. Le validateur structurel ne remplace pas un contrôle visuel dans un navigateur à 400 px, un test au clavier/lecteur d’écran, ni une mesure de contraste WCAG. Ces contrôles manuels restent à réaliser.

## Vérification technique

Le contrôle obligatoire du projet est :

```sh
python3 .opencode/skills/transcript-to-lesson/scripts/validate_site.py .
```

Il vérifie les pages, les identifiants/ancres, les matières du manifeste, les nombres de leçons et les totaux de cases. Il ne valide ni l’exactitude disciplinaire, ni l’ergonomie réelle sur appareil.

## Priorités recommandées

1. Faire relire les passages techniques et citations par les enseignants concernés.
2. Obtenir les plans officiels pour afficher une couverture réelle des programmes.
3. Développer des évaluations avec feedback validé, au-delà de la révélation de réponse.
4. Ajouter l’export/import de progression locale.
5. Réaliser les contrôles d’accessibilité et d’affichage sur appareils réels.
