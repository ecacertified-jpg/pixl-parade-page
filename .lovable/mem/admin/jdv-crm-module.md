---
name: JDV_CRM module
description: Module CRM admin (/admin/crm) — fiches utilisateurs, segmentation S1-S8, score 0-100, priorités, doublons et historique de réactivation, en lecture seule sur les données sources.
type: feature
---
Route `/admin/crm` (`JdvCrmDashboard`). Couche d'analyse en LECTURE SEULE : ne modifie jamais profiles, pages, cagnottes ni partages.

- Tables : `crm_profiles` (CRM ID stable via `crm_id_seq`, statut_reactivation, statut_doublon, admin_notes, last_contacted_at), `crm_reactivation_history`, `crm_scoring_rules` (poids configurables). RLS restreinte aux `admin_users` actifs.
- Vue `crm_user_overview` (security_invoker) : agrégats comportementaux (dernière activité, jours avant anniversaire, pages, cagnottes, contributions, partages, sessions, messages) via lateral joins.
- Accès données : RPC SECURITY DEFINER `crm_get_overview`, `crm_get_rules`, `crm_get_history`, `crm_provision_profiles`, `crm_set_status`, `crm_add_history` (contrôle `admin_users` actif + filtrage `assigned_countries`). Pas d'edge function : la création de nouvelles edge functions est bloquée sur ce projet (quota atteint).
- Logique métier côté client dans `src/lib/crmCore.ts` : segmentation S1-S8, score 0-100 basé sur les règles, priorité et prochaine action recommandée, détection de doublons (téléphone/email/nom normalisés) — jamais de fusion ni suppression automatique, validation humaine obligatoire.

- UI : KPIs, segments cliquables, filtres avancés, tableau paginé, fiche latérale détaillée, export CSV (global ou fiche unique) via `crmExportColumns.ts`. Valeurs manquantes affichées « Non disponible » / « Date inconnue ».

## Phase 2 — activité, segments exclusifs, cohérence
- **Activité (définition unique)** : basée uniquement sur `auth.users.last_sign_in_at` et `user_session_logs`. La date d'inscription n'est JAMAIS un repli. Niveaux : Actif (≤7j), Inactif > 7 / 30 / 90 jours, Jamais actif, Inconnu. Colonne `last_real_activity_at` ajoutée à `crm_user_overview` (sans `GREATEST(..., created_at)`).
- **Segments S1→S8** mutuellement exclusifs, ordre fixe : S1 anniv ≤30j sans cagnotte → S2 page sans cagnotte → S3 cagnotte non partagée → S4 sans page → S5 inactif → S6 actif sans cagnotte → S7 actif → S8 données insuffisantes.
- **Une carte = un filtre** : `KPI_DEFINITIONS` dans `crmCore.ts` est la source unique ; les compteurs et la liste filtrée partagent le même prédicat `matchesFilters`.
- **Priorité** = tranche de score, relevée par le segment, forcée TRÈS HAUTE si anniv ≤30j sans cagnotte ; justification affichée (`priority_reasons`).
- **Parcours** : Inscrit → Page → Cagnotte → Partage → Contribution, avec `blocage_principal`.
- `runCoherenceTests()` alimente le panneau « Contrôle de cohérence » du dashboard (T1→T12).

## Audit de segmentation S1→S8 (lecture seule)
- `auditSegmentation()` / `evaluateSegmentConditions()` dans `crmCore.ts` : évalue indépendamment les 8 prédicats, compare le segment attribué au segment attendu (ordre S1 > … > S8), classe les cas (Aucune, Segment incohérent/inconnu/absent, Données insuffisantes, Interprétations multiples) et propose une action — jamais appliquée automatiquement.
- Exposé par `useCrmStats().segment_audit`, affiché par `CrmSegmentAuditPanel` (résumé, répartitions, tableau paginé, détail des règles, export CSV via `crmAuditColumns.ts`). Conclusion explicite « AUDIT TERMINÉ — … ».
