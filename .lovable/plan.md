

# Plan : Corriger le lien de la page anniversaire dans l'onboarding

## Probleme

L'onboarding (etape 5) genere un slug **cote client** (`prenom-2026`) et affiche un lien `joiedevivre-africa.com/birthday/prenom-2026`. Mais la page anniversaire reelle est creee par l'Edge Function `birthday-wishes` qui s'execute **plus tard** (le jour de l'anniversaire). Donc quand l'utilisateur copie ce lien pendant l'onboarding, la page n'existe pas encore en base — d'ou le "introuvable".

De plus, si le prenom est vide, le slug est vide et le lien devient `/birthday/` (ce qui correspond a la capture d'ecran montrant "Anniversaire de vous").

## Solution

A l'etape 5 de l'onboarding, creer la page anniversaire **en base de donnees** (`birthday_pages`) immediatement, au lieu de simplement generer un slug client-side. Ainsi le lien partage sera fonctionnel.

### 1. Creer la page birthday au chargement de l'etape 5

Dans `OnboardingExperience.tsx`, remplacer la generation de slug locale par un appel a Supabase :

```tsx
useEffect(() => {
  if (currentStep === 4 && firstName && user) {
    // Verifier si une page existe deja pour cette annee
    const createOrFetchPage = async () => {
      const currentYear = new Date().getFullYear();
      
      const { data: existing } = await supabase
        .from('birthday_pages')
        .select('slug')
        .eq('user_id', user.id)
        .eq('celebration_year', currentYear)
        .maybeSingle();
      
      if (existing) {
        setBirthdayPageSlug(existing.slug);
        return;
      }
      
      // Generer le slug
      const slug = `${firstName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')}-${currentYear}`;
      
      const { data, error } = await supabase
        .from('birthday_pages')
        .insert({
          user_id: user.id,
          slug,
          celebration_year: currentYear,
          is_active: true,
        })
        .select('slug')
        .single();
      
      if (error?.code === '23505') {
        // Collision — ajouter suffixe
        const fallbackSlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: d2 } = await supabase
          .from('birthday_pages')
          .insert({ user_id: user.id, slug: fallbackSlug, celebration_year: currentYear, is_active: true })
          .select('slug')
          .single();
        if (d2) setBirthdayPageSlug(d2.slug);
      } else if (data) {
        setBirthdayPageSlug(data.slug);
      }
    };
    
    createOrFetchPage();
  }
}, [currentStep, firstName, user]);
```

### 2. Supprimer `generateBirthdaySlug`

La fonction `generateBirthdaySlug` et son `useCallback` ne sont plus necessaires.

### 3. Verifier la politique RLS sur `birthday_pages`

S'assurer que les utilisateurs authentifies peuvent inserer dans `birthday_pages` pour leur propre `user_id`. Si la politique manque, ajouter une migration.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Remplacer generation locale par insert Supabase |
| Table `birthday_pages` | Verifier/ajouter politique RLS INSERT |

