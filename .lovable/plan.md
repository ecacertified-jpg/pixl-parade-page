
# Plan : Persister les goûts sélectionnés dans l'onboarding

## Analyse de l'existant

| Étape | Donnée | Persistée en DB ? |
|-------|--------|-------------------|
| 1 - Anniversaire | `profiles.birthday` | ✅ Sauvé au clic "Suivant" |
| 2 - Goûts | `selectedCategories` | ❌ **État local uniquement, perdu à la fermeture** |
| 3 - Souhaits | `user_favorites` | ✅ Sauvé immédiatement au toggle |
| 4 - Amis | `friend_form_tokens` | ✅ Sauvé côté serveur |

**Seule l'étape 2 (Goûts) n'est pas persistée.** Les autres étapes sont déjà sauvegardées en base et restaurées au retour de l'utilisateur.

## Solution

Ajouter une colonne `selected_tastes` (tableau de textes) à la table `profiles`, sauvegarder les goûts au clic "Suivant", et les recharger à l'ouverture.

## Modifications

### 1. Migration SQL — Ajouter la colonne

```sql
ALTER TABLE public.profiles 
ADD COLUMN selected_tastes text[] DEFAULT '{}';
```

### 2. `src/components/OnboardingExperience.tsx`

- **Chargement** (lignes ~106-117) : ajouter `selected_tastes` au `select` du profil, et initialiser `setSelectedCategories` si le tableau n'est pas vide
- **Sauvegarde** (ligne ~471) : quand `currentStep === 2`, sauvegarder les goûts en DB :
  ```typescript
  if (currentStep === 2) {
    await supabase.from('profiles')
      .update({ selected_tastes: selectedCategories })
      .eq('user_id', user.id);
  }
  ```

### 3. `src/hooks/useOnboarding.ts`

- Ajouter la vérification de l'étape 2 dans `fetchOnboardingStatus` : si `selected_tastes` est vide/null, retourner `firstIncompleteStep: 2`
- Modifier le `select` existant pour inclure `selected_tastes` :
  ```typescript
  supabase.from('profiles').select('birthday, selected_tastes').eq('user_id', userId).single()
  ```
- Ajouter la condition entre les vérifications birthday et favorites :
  ```typescript
  if (!profileRes.data?.selected_tastes?.length) {
    return { shouldShow: true, firstIncompleteStep: 2 };
  }
  ```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter colonne `selected_tastes text[]` à `profiles` |
| `src/components/OnboardingExperience.tsx` | Charger et sauvegarder les goûts |
| `src/hooks/useOnboarding.ts` | Vérifier l'étape 2 dans le statut d'onboarding |
