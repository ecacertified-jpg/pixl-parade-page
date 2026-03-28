

# Plan : Supprimer le cast `as any` dans useOnboarding.ts

## Constat

Les types Supabase (`src/integrations/supabase/types.ts`) contiennent deja `onboarding_completed: boolean` dans la definition de la table `profiles` (Row, Insert, Update). Le cast `as any` a la ligne 69 est donc inutile et peut etre simplement retire.

## Modification

**`src/hooks/useOnboarding.ts` — ligne 69**

Avant :
```typescript
.update({ onboarding_completed: true } as any)
```

Apres :
```typescript
.update({ onboarding_completed: true })
```

Un seul fichier, une seule ligne.

