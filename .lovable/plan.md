# JDV_CRM — Phase 2 : audit, correction et fiabilisation

## 1. Audit réalisé (vérifié en base et dans le code)

Implémentation actuelle :

- Vue SQL `crm_user_overview` (1 114 lignes) — agrégats par utilisateur.
- RPC admin : `crm_get_overview`, `crm_get_rules`, `crm_get_history`, `crm_set_status`, `crm_add_history`, `crm_provision_profiles`.
- Logique métier unique côté client : `src/lib/crmCore.ts` (`computeCrmRecord`, `matchesFilters`, `detectDuplicateGroups`).
- Hook `src/hooks/useJdvCrm.ts` : les cartes, la liste, la fiche et l'export partagent déjà le même dataset calculé — la source de vérité existe donc déjà pour segment/score/priorité.
- UI : `src/pages/Admin/JdvCrmDashboard.tsx`, `src/components/admin/crm/CrmUserSheet.tsx`, `crmExportColumns.ts`.

### Incohérence « Inactifs > 30j = 1 098 » vs « S5 = 3 » — cause confirmée

Les deux chiffres sont produits par deux règles différentes, et c'est la conception qui est fautive, pas le calcul :

- La carte compte le **niveau d'activité** (`jours_depuis_derniere_activite > 30`) : 1 098 utilisateurs.
- S5 est un segment **résiduel** évalué en 5e position : un inactif qui a une page sans cagnotte tombe d'abord en S2. D'où seulement 3 utilisateurs.

Distribution réelle mesurée en base avec la règle actuelle : S1 53, S2 373, S3 7, S4 635, S5 3, S6 2, S7 2, S8 39 — total 1 114. Les segments sont donc bien exclusifs et exhaustifs (Tests 1 et 2 déjà satisfaits).

### Deuxième problème confirmé : l'activité est en partie inventée

Dans la vue, `last_activity_at = GREATEST(COALESCE(last_sign_in_at, created_at), COALESCE(last_session_at, created_at))`. La date d'inscription sert donc de repli : aucune ligne n'a d'activité nulle (0 sur 1 114), « Jamais actif » est impossible et un compte jamais connecté paraît « actif le jour de son inscription ». Mesures réelles : 1 042 comptes ont une vraie `last_sign_in_at`, 816 ont au moins une session, 16 seulement ont une activité réelle < 30 jours.

Autre écart : `days_since_activity = null` est aujourd'hui compté comme « inactif » dans la carte mais comme « donnée inconnue » nulle part — à séparer.

## 2. Corrections prévues

### 2.1 Définition unique de l'activité (source de vérité)

Dans `crmCore.ts` : `computeActivity()` basée uniquement sur des signaux réels (`last_sign_in_at`, `last_session_at`), jamais sur la date d'inscription. Champs ajoutés : `niveau_activite`, `date_derniere_activite`, `jours_depuis_derniere_activite`, `date_derniere_connexion`.

Niveaux : `Actif` (≤ 7 j), `Inactif > 7 jours`, `Inactif > 30 jours`, `Inactif > 90 jours`, `Jamais actif` (aucune connexion ni session), `Inconnu` (donnée absente). Affichage « Inconnue » — aucune valeur inventée.

Migration SQL : la vue expose `last_real_activity_at` (sans repli sur l'inscription) en conservant l'ancien champ pour ne rien casser.

### 2.2 Segmentation S1→S8 conforme à la spécification

Ordre appliqué : S1 (anniversaire ≤ 30 j sans cagnotte) → S2 (page sans cagnotte) → S3 (cagnotte non partagée) → S4 (inscrit sans page) → S5 (inactif selon la définition officielle) → S6 (actif sans cagnotte) → S7 (actif engagé) → S8 (données insuffisantes). Activité et segment deviennent deux dimensions distinctes : la carte « Inactifs > 30j » filtre `niveau_activite`, pas S5, et son libellé le dira explicitement.

### 2.3 Parcours, blocage, prochaine action

Champs calculés ajoutés : `etape_parcours` (Inscrit → Page créée → Cagnotte créée → Page partagée → Contribution reçue → Données insuffisantes), `blocage_principal` (Aucun / Pas de page / Pas de cagnotte / Pas de partage / Inactivité / Données insuffisantes), `prochaine_action` (par segment, sans aucun envoi de message).

### 2.4 Score transparent et priorité cohérente

Score 0–100 depuis `crm_scoring_rules` (barème inchangé), avec `score_details` listant chaque facteur. Priorité = base par tranche de score (80+ Très haute, 60–79 Haute, 40–59 Moyenne, 20–39 Basse, <20 À analyser), puis **surclassement** par règles métier : anniversaire < 30 j sans cagnotte → Très haute, S2 → Très haute, S3/S4/S6 → au minimum Haute, S8 → À analyser. Un champ `priority_reasons` explique la priorité dans la fiche.

### 2.5 Cartes cliquables et cohérentes

Chaque carte KPI devient un bouton qui applique le filtre correspondant exactement à sa règle de calcul (même fonction `matchesFilters`), donc le compteur de la liste correspond au chiffre de la carte. Idem pour les cartes S1→S8, avec export CSV de la sélection.

### 2.6 Filtres enrichis

Ajout de : niveau d'activité (6 valeurs), étape du parcours, blocage principal, intervalle de score (min/max), jours avant anniversaire (déjà présent, conservé). Les filtres existants sont conservés.

### 2.7 Fiche individuelle restructurée

Sections : Identité / Anniversaire / **Parcours JDV** (Inscription ✓ → Page → Cagnotte → Partage → Contribution) / Comportement (segment, niveau d'activité, dernière activité, jours, dernière connexion) / **Intelligence CRM** (score, motifs, priorité + raisons, blocage principal, prochaine action) / Réactivation (statut, dernière relance, nombre de relances, dernière réponse) / Doublon. Rien de supprimé.

### 2.8 Export CSV

Colonnes ajoutées : niveau d'activité, étape parcours, blocage principal, motifs du score, raisons de priorité. Colonnes existantes conservées. Boutons : export global, export filtré, export segment, export individuel.

### 2.9 Contrôle de cohérence

Un panneau repliable « Contrôle de cohérence » en bas du tableau de bord exécute les tests 1 à 12 sur le dataset chargé (somme des segments = total, unicité du segment, score borné 0–100, égalité carte/liste, cohérence des inactifs, cas S1/S2/S3) et affiche succès/échec. Vérification manuelle en base sur ≥ 20 utilisateurs réels représentant chaque cas.

## 3. Données non calculables — signalées, jamais inventées

- **Vues de page** : aucune table de vues de page anniversaire/événement. Seules les vues de photos existent ; affichées explicitement comme telles.
- **Partages** : `viral_share_events` très peu alimentée — « partage non détecté » traduit un manque de tracking, pas une absence de partage réelle.
- **Interactions entrantes** : limitées aux messages d'anniversaire et contributions.
- **Nombre de relances / dernière réponse** : issus de `crm_reactivation_history` uniquement, vide tant qu'aucune relance n'est saisie.

## 4. Hors périmètre de cette phase

Aucun envoi WhatsApp/email, aucune campagne, aucun agent IA, aucune génération de message. Aucune donnée source (profiles, pages, cagnottes, partages) n'est modifiée : le CRM reste en lecture seule.

## 5. Détails techniques

- Migration SQL : ajout de `last_real_activity_at` à `crm_user_overview` (aucune table modifiée, aucune donnée supprimée).
- `src/lib/crmCore.ts` : source de vérité unique — activité, segment, score, priorité, parcours, blocage, action, filtres.
- `src/hooks/useJdvCrm.ts` : stats calculées avec les mêmes prédicats que les filtres de liste.
- `src/pages/Admin/JdvCrmDashboard.tsx` : cartes cliquables, nouveaux filtres, colonne « Niveau d'activité », panneau de contrôle de cohérence.
- `src/components/admin/crm/CrmUserSheet.tsx` : fiche restructurée en 7 sections.
- `src/components/admin/crm/crmExportColumns.ts` : nouvelles colonnes.
- Un résumé des corrections est affiché dans l'interface (panneau « Contrôle de cohérence »).
