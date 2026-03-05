

# Tableau admin des utilisateurs inactifs et taux de retour

## Approche

Créer un hook `useInactiveUsersStats` et un composant `AdminInactiveUsersTable` qui affiche :
1. **KPI cards** : total inactifs 7j+, total inactifs 14j+, notifications envoyées (par tier), taux de retour
2. **Tableau** : liste des utilisateurs inactifs avec dernière activité, nombre de notifications envoyées, tier le plus récent, et s'ils sont revenus après notification

Le taux de retour se calcule en vérifiant si un utilisateur notifié a une session dans `user_session_logs` postérieure à sa dernière notification dans `inactive_user_notifications`.

## Fichiers à créer/modifier

### 1. `src/hooks/useInactiveUsersStats.ts` (nouveau)
- Requête `inactive_user_notifications` pour obtenir tous les envois groupés par user_id
- Pour chaque utilisateur notifié, vérifier s'il a une session `user_session_logs.started_at` postérieure à la dernière notification
- Joindre les profils (first_name, last_name, avatar_url) via `profiles`
- Calculer les stats agrégées : total notifiés, retours tier1, retours tier2, taux global
- Exposer `data`, `loading`, `stats`

### 2. `src/components/admin/AdminInactiveUsersTable.tsx` (nouveau)
- 4 KPI cards en haut : Utilisateurs inactifs notifiés, Notifications tier 1, Notifications tier 2, Taux de retour global
- Tableau avec colonnes : Utilisateur, Dernière activité, Jours inactifs, Notifications envoyées, Tier, Revenu (oui/non avec badge), Date retour
- Badge vert "Revenu" / rouge "Inactif" pour le statut
- Pagination ou scroll si beaucoup de données

### 3. `src/pages/Admin/RealtimeDashboard.tsx` (modifier)
- Importer et ajouter `AdminInactiveUsersTable` dans le dashboard, après la section Session History

## Logique du taux de retour

```text
Pour chaque user dans inactive_user_notifications :
  1. Trouver la date de la dernière notification envoyée
  2. Chercher une session dans user_session_logs avec started_at > sent_at
  3. Si trouvée → "revenu", sinon → "inactif"
  
Taux = (nombre de "revenus" / nombre total notifiés) × 100
```

## Aucune migration nécessaire
Toutes les données existent déjà dans `inactive_user_notifications`, `user_session_logs` et `profiles`.

