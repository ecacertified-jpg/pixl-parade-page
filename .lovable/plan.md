

## Problème

L'onboarding utilise **localStorage** comme source unique de persistance pour l'étape atteinte. Cela cause 2 problèmes :

1. **Cross-device** : changer d'appareil/navigateur ou nettoyer le cache → tout est perdu
2. **Race condition** : à l'ouverture, `user.id` n'est pas encore chargé quand `storedFurthestStep` est lu (vaut `0`), tandis que `firstIncompleteStep` retourne déjà `2` depuis le cache `useQuery`. Le `Math.max(2, 0) = 2` fige l'utilisateur sur l'étape Goûts même s'il avait déjà atteint Souhaits

De plus, l'**auto-save des catégories** (debounce 500ms ligne 107) peut échouer silencieusement si l'utilisateur clique « Continuer » trop vite → tastes pas en DB → `firstIncompleteStep=2` au prochain login.

## Solution

Ajouter une **persistance DB authoritative** via une nouvelle colonne `profiles.onboarding_furthest_step` (integer), couplée au localStorage existant comme cache local rapide.

### Changements

| Fichier | Action |
|---|---|
| Migration SQL | Ajouter colonne `onboarding_furthest_step integer DEFAULT 0` à `profiles` |
| `src/hooks/useOnboarding.ts` | Lire `onboarding_furthest_step` dans `fetchOnboardingStatus`. Calculer `effectiveCurrentStep = max(firstIncompleteStep, storedFurthestStep, dbFurthestStep)`. Dans `setCurrentStep`, écrire en DB **et** localStorage |
| `src/components/OnboardingExperience.tsx` | Renforcer l'auto-save des catégories : sauver de façon synchrone à chaque toggle (sans debounce) OU bloquer le bouton « Continuer » tant que la save n'est pas confirmée. Afficher un toast en cas d'échec de l'auto-save |
| `src/integrations/supabase/types.ts` | Régénéré automatiquement par la migration |

### Détails techniques

1. **Migration** :
   ```sql
   ALTER TABLE public.profiles 
   ADD COLUMN IF NOT EXISTS onboarding_furthest_step integer NOT NULL DEFAULT 0;
   ```

2. **`fetchOnboardingStatus`** (useOnboarding.ts) : ajouter `onboarding_furthest_step` au SELECT, retourner `dbFurthestStep` dans le résultat.

3. **`effectiveCurrentStep`** : `Math.max(firstIncompleteStep, storedFurthestStep, dbFurthestStep)` — la DB devient la vérité ultime cross-device.

4. **`setCurrentStep`** : faire un `update` non-bloquant sur `profiles.onboarding_furthest_step` quand le step augmente (fire-and-forget pour ne pas ralentir l'UI).

5. **Auto-save catégories renforcé** : remplacer le debounce 500ms par une sauvegarde **immédiate** à chaque clic de catégorie + un état `savingCategories` qui désactive « Continuer » pendant l'écriture. Garantit qu'au moment du `Continuer`, les tastes sont en DB.

6. **`completeOnboarding`** : reset également `onboarding_furthest_step = 0` quand l'onboarding est complété.

## Résultat

L'utilisateur reprend exactement à l'étape qu'il a atteint en dernier, **quel que soit l'appareil**, le navigateur ou l'état du cache, et la sélection de catégories est garantie d'être persistée avant tout passage à l'étape suivante.

