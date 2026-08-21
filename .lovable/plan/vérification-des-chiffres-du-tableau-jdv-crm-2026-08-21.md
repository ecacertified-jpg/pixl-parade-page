# Vérification des chiffres du tableau JDV_CRM

## Verdict : les zéros affichés sont faux

Les vrais chiffres, mesurés directement en base (source `crm_user_overview`, 1114 comptes) :

| Indicateur affiché | Valeur affichée | Valeur réelle |
| --- | --- | --- |
| Utilisateurs | 0 | 1 114 |
| Anniversaire < 30j | 0 | 52 |
| Sans page | 0 | 725 |
| Page sans cagnotte | 0 | 378 |
| Cagnotte non partagée | 0 | 11 |
| Inactifs > 30j | 0 | 1 098 |
| Doublons potentiels | 0 | calculé par la fonction (non mesurable en base seule) |

## Cause

La fonction `admin-crm` n'est pas déployée : un appel direct renvoie `404 NOT_FOUND`. Le tableau de bord ne reçoit donc aucune donnée et affiche `0` partout (valeur par défaut quand la réponse est absente). Confirmé aussi par la table `crm_profiles`, qui est vide alors que la fonction devrait provisionner une fiche par utilisateur au premier chargement.

## Correctifs proposés

1. Déployer la fonction `admin-crm` (code déjà présent dans `supabase/functions/admin-crm/`) et l'enregistrer dans `supabase/config.toml`.
2. Après déploiement, vérifier l'action `stats` et comparer aux valeurs réelles ci-dessus.
3. Dans `JdvCrmDashboard.tsx` : ne plus afficher `0` quand la requête échoue ou charge — afficher un état de chargement (squelette) et un bandeau d'erreur explicite avec bouton « Réessayer ». Un zéro ne doit s'afficher que lorsqu'il s'agit d'un vrai zéro.
4. Même traitement pour la liste paginée et les compteurs de segments.

## Détails techniques

- Vérification faite : `crm_user_overview` retourne bien 1114 lignes ; la vue et les tables CRM sont en place.
- L'écart « Inactifs > 30j » très élevé (1 098) vient de `last_activity_at` souvent nul ; à confirmer visuellement après déploiement, mais la logique actuelle du code est conforme à la spécification.
