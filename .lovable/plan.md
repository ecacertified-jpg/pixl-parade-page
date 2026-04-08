

# Plan : Messages de partage incitatifs, skip étape Amis, et onboarding terminé persistant

## 3 modifications

### 1. Messages de partage plus incitatifs dans l'onboarding

**Fichier : `src/components/OnboardingExperience.tsx`**

Remplacer les messages dans les 3 fonctions de partage :

- `handleSharePageWhatsApp` (ligne 508-509) : remplacer par `🎂 C'est bientôt mon anniversaire ! 🎉\n\nÉcris-moi un petit mot, ajoute une photo souvenir ou participe au cadeau collectif 🎁\n\nClique ici, ça prend 30 secondes ⬇️\n\n${pageUrl}`
- `handleCopyPageLink` (ligne 527) : même message
- `handleSharePageSMS` (ligne 519) : même message (version SMS)

### 2. Sauter l'étape Amis si ≥3 amis dans le cercle d'amis

**Fichier : `src/hooks/useOnboarding.ts`**

À l'étape 4 (Amis), en plus de vérifier les `friend_form_tokens` complétés, vérifier aussi le nombre de membres dans `friend_circle_members` liés aux cercles de l'utilisateur. Ajouter aux requêtes parallèles :

```typescript
supabase.from('friend_circles').select('id').eq('user_id', userId)
```

Puis compter les `friend_circle_members` de ces cercles. Si ≥3 membres → considérer l'étape 4 comme complète (ne pas afficher l'onboarding à cette étape).

Alternative plus simple : compter directement les `friend_circle_members` via une jointure ou deux requêtes séquentielles (cercles puis membres).

### 3. Ne plus afficher l'onboarding si toutes les étapes sont achevées

**Fichier : `src/hooks/useOnboarding.ts`**

Dans `fetchOnboardingStatus`, ajouter une vérification **au début** (après le check URL) :

```typescript
// Check DB flag first
const { data: profile } = await supabase
  .from('profiles')
  .select('onboarding_completed')
  .eq('user_id', userId)
  .single();

if (profile?.onboarding_completed === true) {
  return { shouldShow: false, firstIncompleteStep: 0 };
}
```

Cela court-circuite toutes les vérifications si l'onboarding a déjà été marqué comme terminé en DB. Le flag `onboarding_completed` est déjà mis à `true` dans `completeOnboarding()` — il suffit de le lire au début.

Optimisation : fusionner cette requête avec la requête `profiles` existante en ajoutant `onboarding_completed` au select (ligne 20).

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Messages de partage incitatifs (3 fonctions) |
| `src/hooks/useOnboarding.ts` | Check `onboarding_completed` + check cercle d'amis ≥3 |

