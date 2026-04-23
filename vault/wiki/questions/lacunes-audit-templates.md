---
title: Lacunes de l'audit de templates (2026-04-23)
type: question
created: 2026-04-23
updated: 2026-04-23
sources: []
tags: [audit, templates, atelier, quality, exercise-templates, poc-core]
---

## Question

Après avoir parcouru le dashboard Atelier sur la PR #186 (templates CEB core-9, [[questions/nouveaux-types-exercices-ceb]]), plusieurs défauts sautent aux yeux malgré un score audit moyen de **96.1/100** et **0 template signalé cassé**. L'audit (`tools/template_audit/{layer2,combine,dashboard}.py`) rate des classes entières d'erreurs. Quelles sont ces lacunes et quelles vérifications faut-il ajouter ?

## Diagnostic — 5 lacunes

### 1. Couverture par difficulté très inégale

Sur **110 compétences**, seules **7** ont un template de difficulté 3 (et la majorité s'arrêtent à d2, parfois d1). L'audit ne traite pas la couverture de palier comme un défaut — il rapporte `status: ok` pour toutes les compétences ayant au moins un template, sans égard à la progressivité.

Conséquence : le mode diagnostic ne peut monter en difficulté que sur une poignée de skills. Pour les autres, un élève fort plafonne à d2 artificiellement.

### 2. Templates sans réponse atteignable

Certains des nouveaux templates CEB (ajoutés dans l'issue #110) produisent un `answer` qu'aucune saisie élève ne peut matcher via le validator actif. L'audit actuel teste que `instantiate()` ne jette pas, mais pas que `validate(input_type, student_answer, answer, params)` est satisfiable. Score = 100, template = cassé.

### 3. Rendu UI incompatible avec l'answer — `missing_operator` sur `resolution_problemes` P6

Exemple observé :
- Prompt : `84 ? 7 = 12`
- Boutons rendus : `<` · `=` · `>`
- Answer attendue : `÷` (ou `+`/`−`/`×`)

Le générateur `missing_operator` émet des opérateurs arithmétiques, mais `input_type: symbol` déclenche `SymbolInput` dont le validator `symbol.py` n'autorise que `{<, >, =}`. L'UI fait pareil. Aucun clic ne peut donc produire une réponse correcte. Voir [[concepts/egalite-mathematique]] pour la distinction de sens entre opérateurs arithmétiques et symboles d'ordre.

L'audit ne vérifie pas que `answer ∈ valeurs-admissibles-pour-input_type`. C'est une incompatibilité `template_type ↔ input_type` qui devrait être impossible à merger.

### 4. Templates invisibles dans l'Atelier

Certains templates CEB n'apparaissent pas dans le dashboard filtré (mentionné : variantes de `verification_pick`). À investiguer : bug du nouveau filtre `Type` (valeurs `template_type` mal peuplées sur le payload live ?), ou skill non rattachée à la grille (un rattachement unique sur `maitrise_*` alors que l'Atelier groupe par compétence primaire).

### 5. Nouveaux templates CEB cantonnés à P6

Les 8 familles CEB (`equality_trap`, `verification_pick`, `operator_identity_fill`, `pick_equivalents`, `rang_decimal`, `inference_from_known`, `fix_false_equality`, +divisibility_fill pending) ont toutes été seedées **uniquement** sur des compétences P6 (`maitrise_add_soustr`, `maitrise_mult_div`, `maitrise_calcul_mental`, `num_lire_ecrire_milliard`) — alors que les attendus CEB qu'elles probent existent dès P2/P3 :

- `equality_trap` (piège commutativité) → `prop_commutativite_add` dès P1, `prop_commutativite_mult` dès P2
- `verification_pick` (opération réciproque) → attendu à partir de P3 ([[concepts/resolution-problemes-math]])
- `operator_identity_fill` → `cm_distributivite` P3, `cm_compensation` P3
- `pick_equivalents` → dès que la distributivité est vue (P3+)
- `rang_decimal` → numération décimale progresse P3→P6

Voir [[questions/nouveaux-types-exercices-ceb]] pour la justification CEB. Les bornes numériques peuvent être descendues : `verification_pick` fonctionne avec `a ∈ [10,50]` et division exacte dès P3, pas besoin de `a ∈ [40,400]`.

L'audit ne détecte pas ce défaut parce qu'il ne croise pas la couverture des nouveaux `template_type` avec la profondeur de grade attendue. Un seed à P6 ne signale rien si le template fonctionne.

## À résoudre — vérifications à ajouter à l'audit

### Layer 2 (structurel)

- [ ] **Satisfiabilité** : pour chaque template, générer K instances et vérifier que pour chacune, `validate(input_type, answer, answer, params) == True` (auto-validation). Si la réponse générée ne passe pas son propre validator, le template est cassé.
- [ ] **Compatibilité `answer ↔ input_type`** : pour chaque `input_type`, lister l'ensemble des valeurs admissibles côté UI + validator, et vérifier que tous les `answer` générés appartiennent à cet ensemble. Devient une contrainte bloquante de seed.
- [ ] **Couverture de palier par skill** : rapporter par skill `{d1, d2, d3}` et signaler toute skill `status: single_tier` (déjà là) OU `no_d3` (nouveau). Agréger un score de couverture `n_d3_skills / n_total_skills`.
- [ ] **Distribution des options MCQ** : pour `mcq`/`mcq_multi`, vérifier que les distractors ne dupliquent pas la bonne réponse (bug attrapé empiriquement sur `pick_equivalents`).

### Layer 3 (curated)

- [ ] Ajouter une section `grade_portage` : liste de couples `(template_type, skills_cibles_à_ajouter)` pour forcer le portage P1→P6.
- [ ] Ajouter `ui_compatibility_matrix` : mapping `input_type → allowed_answer_shape` (string regex, union de valeurs, etc.).

### Métrique rapportée

- [ ] Redéfinir `status: ok` d'une skill : exige au moins 1 template par difficulté (`d1 + d2 + d3`), OR un score de couverture ≥ seuil. Le statut actuel "1 template suffit" fait passer 110/110 skills en `ok` alors que 103 n'ont pas de d3.

## See also

- [[questions/nouveaux-types-exercices-ceb]] — la roadmap CEB qui a motivé les templates de #110
- [[concepts/ceb-attendus-p6-arithmetique]] — attendus P6 ; confirme que les probes CEB ne sont pas P6-only
- [[concepts/egalite-mathematique]] — distinction opérateur vs symbole de relation, pertinente pour le bug `missing_operator`
- [[concepts/resolution-problemes-math]] — vérification par opération réciproque est un attendu dès P3
- [[concepts/numeration-decimale]] — progression P1→P6 du rang décimal, contexte pour porter `rang_decimal` plus bas

## Filed under

`questions/` — audit gaps surfacés pendant la revue manuelle de PR #186, en attente d'implémentation.
