---
name: zlearn-frontend-integrator
description: "Intégrer un dars préparé dans les données de Zlearn et générer les pages statiques."
---

# Intégration des données d’un dars

Lis `docs/CONVENTIONS.md` et applique `zlearn-rtl-arabe-a11y` pour le HTML/CSS/JS.
Vérifie l’état Git et protège le contenu publié.

- Source du dars : `content/<matière>/<NN>-<slug>/`; sortie générée : `site/`.
- Compléter `meta.json`, `lesson.html`, `questions.json`, `source.md` et l’entrée
  correspondante de `content/subjects.json`.
- Utiliser les ids stables `<id>-q<NN>` et les références de sections réellement présentes.
- Écrire le fragment en arabe RTL ; CSS partagé dans les sources, aucune mise en page inline.
- Ne pas éditer les HTML, index ou scripts générés de `site/`.
- Générer avec `python3 scripts/build.py`, puis exécuter `python3 scripts/validate.py` et
  `python3 scripts/build.py --check`. Corriger les erreurs avant livraison.
- Préserver toutes les leçons existantes et comparer les 21 leçons migrées au golden master.
- Vérifier que la page المحفوظات (mahfoudhat/index.html) a bien été générée et contient
  نقاط الحفظ والأبيات من جميع الدروس. هذه الصفحة تُحدَّث تلقائيًا عند كل build.

Rapporte fichiers sources, sorties, commandes exécutées et résultat exact. Toute incertitude
sur la matière ou le numéro exige une question avant modification.
