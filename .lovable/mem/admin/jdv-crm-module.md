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
