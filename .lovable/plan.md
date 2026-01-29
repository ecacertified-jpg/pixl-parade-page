

# Rendre les Métriques Dynamiques dans le Modal Admin

## Diagnostic

L'analyse révèle que la fonction RPC `get_user_stats_for_admin` existe et est appelée correctement dans `UserProfileModal.tsx`. Cependant, elle compte les "Amis" dans la table `contact_relationships` (relations bidirectionnelles entre utilisateurs JDV - seulement **5 entrées**), alors que vous avez ajouté des amis dans la table `contacts` (carnet d'adresses - **18 entrées**).

**Différence entre les deux tables :**

| Table | Description | Données |
|-------|-------------|---------|
| `contacts` | Carnet d'adresses personnel (noms, téléphones, anniversaires) | 18 entrées |
| `contact_relationships` | Relations mutuelles entre utilisateurs inscrits sur JDV | 5 entrées |

## Solution Proposée

Modifier la fonction SQL `get_user_stats_for_admin` pour compter les **contacts** (carnet d'adresses) au lieu des `contact_relationships`, car c'est plus représentatif de l'activité réelle de l'utilisateur.

## Modifications Techniques

### Migration SQL : Mise à jour de la fonction

Modifier la requête pour compter les contacts au lieu des relationships :

```sql
-- Avant (actuel)
SELECT COUNT(*) INTO v_friends_count
FROM contact_relationships 
WHERE user_a = target_user_id OR user_b = target_user_id;

-- Après (proposé)
SELECT COUNT(*) INTO v_friends_count
FROM contacts 
WHERE user_id = target_user_id;
```

### Fichier de Migration

Créer une migration qui met à jour la fonction `get_user_stats_for_admin` :

```sql
-- Modification pour compter les contacts (carnet d'adresses) 
-- au lieu des contact_relationships

CREATE OR REPLACE FUNCTION public.get_user_stats_for_admin(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  v_gifts_given integer;
  v_gifts_received integer;
  v_funds_created integer;
  v_contacts_count integer;  -- Renommé pour clarté
  v_contributions_count integer;
  v_total_contributed numeric;
  v_community_points integer;
BEGIN
  -- Vérifier que l'appelant est admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Accès non autorisé';
  END IF;

  -- Cadeaux donnés
  SELECT COUNT(*) INTO v_gifts_given
  FROM gifts WHERE giver_id = target_user_id;

  -- Cadeaux reçus
  SELECT COUNT(*) INTO v_gifts_received
  FROM gifts WHERE receiver_id = target_user_id;

  -- Cagnottes créées
  SELECT COUNT(*) INTO v_funds_created
  FROM collective_funds WHERE creator_id = target_user_id;

  -- Nombre de contacts dans le carnet d'adresses
  SELECT COUNT(*) INTO v_contacts_count
  FROM contacts WHERE user_id = target_user_id;

  -- Contributions
  SELECT COUNT(*), COALESCE(SUM(amount), 0) 
  INTO v_contributions_count, v_total_contributed
  FROM fund_contributions WHERE contributor_id = target_user_id;

  -- Points communauté
  SELECT COALESCE(total_points, 0) INTO v_community_points
  FROM community_scores WHERE user_id = target_user_id;

  result := jsonb_build_object(
    'giftsGiven', COALESCE(v_gifts_given, 0),
    'giftsReceived', COALESCE(v_gifts_received, 0),
    'fundsCreated', COALESCE(v_funds_created, 0),
    'friendsCount', COALESCE(v_contacts_count, 0),  -- Utilise contacts
    'contributionsCount', COALESCE(v_contributions_count, 0),
    'totalContributed', COALESCE(v_total_contributed, 0),
    'communityPoints', COALESCE(v_community_points, 0)
  );

  RETURN result;
END;
$$;
```

### Mise à jour du Hook useUserStats.ts

Synchroniser également le hook client pour cohérence :

```typescript
// Changer de contact_relationships à contacts
supabase
  .from("contacts")
  .select("*", { count: "exact", head: true })
  .eq("user_id", user.id),
```

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/XXXXXXXX_update_user_stats_function.sql` | Créer migration SQL |
| `src/hooks/useUserStats.ts` | Aligner le comptage sur `contacts` |

## Résultat Attendu

Après cette modification :
- Le modal Admin affichera le nombre de **contacts** ajoutés par l'utilisateur
- Le ProfileDropdown affichera également les contacts
- Les 18 contacts ajoutés seront visibles dans les statistiques

