# Décisions de restructuration — phase 0

- D1 — Publication : génération dans `site/`, publiée par GitHub Actions.
- D2 — JavaScript : conserver ES5 ; modules concaténés au build.
- D3 — Préfixes sira : normaliser `h1/s2/s3` en `sr1/sr2/sr3`, avec migration des clés `localStorage` en phase 3.
- D4 — Révision : intervalles 1, 3, 7, 14 et 30 jours ; maximum 20 cartes par séance.
- D5 — URLs : conserver `index.html` à la racine publiée et rediriger les anciennes URLs.

Confirmées par l'utilisateur le 15 octobre 2026.

## Décisions pédagogiques — phase 1 (confrontées le 16 octobre 2026)

- D6 — Blocs `<details>` historiques : option A. Les fragments `lesson.html` ne sont pas
  modifiés ; le build les enveloppe, après la clôture, dans un bloc replié
  « مراجعة إضافية », sans bouton « tout afficher ».
- D7 — Seuil de maîtrise d'une leçon : 80 % des cartes en boîte ≥ 2 avec dernière réponse
  juste.
- D8 — Estimations de durée : 30 s par carte, 4 min par 500 mots.

Confirmées par l'utilisateur le 16 octobre 2026.

