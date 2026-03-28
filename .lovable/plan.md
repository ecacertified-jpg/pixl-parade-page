

# Plan : Corriger la page anniversaire vide et le slug manquant

## Problemes identifies

1. **Slug vide** : L'etape 5 affiche "Anniversaire de vous" et le lien `/birthday/` sans slug. Le `useEffect` de creation (ligne 218) depend de `firstName`, mais celui-ci peut ne pas etre charge quand l'utilisateur atteint l'etape 5.

2. **Table vide** : Aucune page n'existe dans `birthday_pages` — l'insert echoue silencieusement car `firstName` est vide (le slug genere serait `-2026`).

3. **`window.location.origin` restant** : `BirthdayPage.tsx` (ligne 275) et `BirthdayCelebrationModal.tsx` (ligne 429) utilisent encore `window.location.origin` au lieu de `getAppBaseUrl()`.

## Solution

### 1. Rendre la creation de page plus resiliente (`OnboardingExperience.tsx`)

- Retirer la condition `!firstName` du `useEffect` — utiliser un fallback si le prenom est vide (ex: `user-${userId.slice(0,8)}-${year}`)
- Ajouter `firstName` comme dependance pour mettre a jour le titre si le prenom arrive apres la creation
- Empecher le partage tant que le slug n'est pas genere (desactiver les boutons)

```tsx
useEffect(() => {
  if (currentStep !== 4 || !user) return;
  const createOrFetchPage = async () => {
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from('birthday_pages')
      .select('slug')
      .eq('user_id', user.id)
      .eq('celebration_year', currentYear)
      .maybeSingle();
    if (existing) { setBirthdayPageSlug(existing.slug); return; }

    const nameForSlug = firstName 
      ? firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-')
      : `user-${user.id.slice(0, 8)}`;
    const slug = `${nameForSlug}-${currentYear}`;
    // ... reste du code insert identique
  };
  createOrFetchPage();
}, [currentStep, firstName, user]);
```

### 2. Corriger `window.location.origin` dans 2 fichiers

| Fichier | Ligne | Correction |
|---------|-------|------------|
| `src/pages/BirthdayPage.tsx` | 275 | `getAppBaseUrl()` |
| `src/components/BirthdayCelebrationModal.tsx` | 429 | `getAppBaseUrl()` |

### 3. Desactiver les boutons de partage si slug vide

Dans l'etape 5, conditionner les boutons "Partager sur WhatsApp" et "Copier le lien" a `birthdayPageSlug` non vide.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Resilience creation page, boutons conditionnels |
| `src/pages/BirthdayPage.tsx` | `getAppBaseUrl()` |
| `src/components/BirthdayCelebrationModal.tsx` | `getAppBaseUrl()` |

