# Correction du chargement des données CRM

## Diagnostic confirmé

Le message affiché est « Impossible de charger les données CRM : O(...).catch is not a function ».

- Les fonctions SQL nécessaires existent bien en base (`crm_get_overview`, `crm_get_rules`, `crm_provision_profiles`, `crm_get_history`, `crm_set_status`, `crm_add_history`). Le backend n'est donc pas en cause.
- Dans `src/hooks/useJdvCrm.ts` (ligne 109), l'appel de provisionnement en arrière-plan fait `rpc('crm_provision_profiles').catch(...)`. Le client Supabase renvoie un objet « thenable » (avec `.then`) mais sans méthode `.catch`. L'appel plante donc immédiatement, l'exception remonte dans la requête et tout le tableau de bord bascule en erreur — alors que les données d'aperçu ont déjà été chargées correctement.

## Correctif

Dans `src/hooks/useJdvCrm.ts` :

1. Remplacer l'appel fautif par un lancement réellement non bloquant, par exemple `void Promise.resolve(rpc('crm_provision_profiles')).catch(() => undefined)`, de sorte qu'un échec de provisionnement n'empêche jamais l'affichage.
2. Encadrer ce déclenchement d'un `try/catch` pour garantir qu'aucune erreur synchrone ne remonte à la requête.

Aucune modification de base de données, de RLS ni d'autres écrans n'est nécessaire.

## Vérification

- Recharger `/admin/crm` et confirmer que les KPI affichent les valeurs réelles (environ 1 114 utilisateurs, 725 sans page, etc.) au lieu de « — » et du bandeau d'erreur.
- Vérifier qu'après le premier chargement les fiches CRM se provisionnent (CRM ID visibles dans le tableau).
