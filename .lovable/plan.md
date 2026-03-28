

# Plan : Declenchement fiable de l'onboarding via flag en base

## Probleme

L'onboarding se declenche uniquement si le compte a ete cree il y a moins de 5 minutes. Si l'utilisateur met plus de temps (verification email, reseau lent), il rate l'onboarding. Le flag localStorage est fragile (changement de navigateur/device).

## Solution

### 1. Migration : ajouter `onboarding_completed` a `profiles`

```sql
ALTER TABLE profiles 
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;
```

La valeur par defaut `false` garantit que tous les utilisateurs existants et nouveaux commencent avec l'onboarding non complete.

### 2. Hook `useOnboarding.ts` — nouvelle logique

Remplacer `fetchOnboardingStatus` :

```typescript
// Avant : verifie localStorage + created_at < 5 min
// Apres : verifie profiles.onboarding_completed en base
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_completed')
  .eq('user_id', userId)
  .single();

return profile?.onboarding_completed === false;
```

Mettre a jour `completeOnboarding` :

```typescript
// Avant : localStorage seulement
// Apres : update en base + localStorage (cache local)
await supabase
  .from('profiles')
  .update({ onboarding_completed: true })
  .eq('user_id', userId);
localStorage.setItem(`onboarding_completed_${userId}`, 'true');
```

Le localStorage reste comme **cache rapide** pour eviter un appel reseau a chaque visite, mais la source de verite est la base de donnees.

### 3. Gestion des utilisateurs existants

Les utilisateurs existants auront `onboarding_completed = false` par defaut. Pour eviter qu'ils voient l'onboarding, on ajoute dans la migration :

```sql
-- Marquer les comptes existants (crees il y a plus de 1 heure) comme deja completes
UPDATE profiles SET onboarding_completed = true
WHERE created_at < NOW() - INTERVAL '1 hour';
```

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonne `onboarding_completed` + update existants |
| `src/hooks/useOnboarding.ts` | Lire/ecrire le flag en base au lieu du critere 5 min |

