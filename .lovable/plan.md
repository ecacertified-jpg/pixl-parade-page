

# Historique de connexion utilisateurs — Dashboard Admin Realtime

## Contexte

Il n'existe actuellement aucune table de suivi des sessions utilisateurs (seul `admin_sessions` existe pour les admins). Supabase Auth fournit `last_sign_in_at` mais pas d'historique ni de durée de session.

## Plan

### 1. Nouvelle table `user_session_logs`

```sql
CREATE TABLE public.user_session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_minutes numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(ended_at, last_active_at) - started_at)) / 60
  ) STORED,
  ip_address text,
  user_agent text
);
```

RLS : admins can SELECT all, users can SELECT their own.

Index on `user_id`, `started_at DESC`.

### 2. Tracking automatique via `usePresenceTracker`

Modifier le hook existant pour :
- **On mount** : `INSERT` une nouvelle session dans `user_session_logs` et stocker l'ID
- **Heartbeat** (toutes les 2 min via `setInterval`) : `UPDATE last_active_at = now()` sur la session courante
- **On unmount** : `UPDATE ended_at = now()` sur la session courante

Cela donne un historique précis avec durée réelle.

### 3. Hook `useSessionHistory`

Nouveau hook admin qui récupère :
- Les dernières sessions (jointure avec `profiles` pour nom/avatar)
- Statistiques agrégées : durée moyenne, nombre de sessions aujourd'hui, utilisateurs actifs dernières 24h

```sql
-- Dernières sessions
SELECT sl.*, p.first_name, p.last_name, p.avatar_url
FROM user_session_logs sl
JOIN profiles p ON p.user_id = sl.user_id
ORDER BY sl.started_at DESC LIMIT 50;

-- Stats agrégées
SELECT 
  COUNT(*) as total_sessions_today,
  COUNT(DISTINCT user_id) as unique_users_today,
  AVG(duration_minutes) as avg_duration_minutes
FROM user_session_logs
WHERE started_at >= CURRENT_DATE;
```

### 4. Composant `RealtimeSessionHistory`

Nouvelle card dans le dashboard `/admin/realtime` :
- **En-tête** : 3 mini-stats (sessions aujourd'hui, utilisateurs uniques, durée moyenne)
- **Tableau** : dernières connexions avec colonnes : Utilisateur (avatar+nom), Début, Dernière activité, Durée, Statut (en ligne/hors ligne)
- Badge vert "En ligne" si `ended_at IS NULL`

### 5. Intégration dans `RealtimeDashboard.tsx`

Ajouter le composant entre la section "Online Users" et les charts, dans une card pleine largeur.

### Fichiers impactés

| Fichier | Action |
|---------|--------|
| Migration SQL | Créer `user_session_logs` + RLS + index |
| `src/hooks/usePresenceTracker.ts` | Ajouter insert/heartbeat/close session |
| `src/hooks/useSessionHistory.ts` | Nouveau hook (fetch + stats) |
| `src/components/admin/RealtimeSessionHistory.tsx` | Nouveau composant |
| `src/pages/Admin/RealtimeDashboard.tsx` | Intégrer le composant |

