

# Plan : Persister les partages onboarding en base de données

## Probleme

Les partages de l'etape 6 de l'onboarding sont stockes uniquement dans `localStorage`. Quand l'utilisateur ferme l'application ou change d'appareil, le compteur revient a 0/3 et il doit tout recommencer.

## Solution

Creer une table `onboarding_shares` dans Supabase pour persister les partages, et modifier le code pour lire/ecrire depuis cette table au lieu de `localStorage`.

## Changements

### 1. Migration SQL -- nouvelle table `onboarding_shares`

```sql
CREATE TABLE public.onboarding_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  share_method text NOT NULL, -- 'whatsapp', 'sms', 'copy'
  page_slug text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own shares"
  ON public.onboarding_shares FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own shares"
  ON public.onboarding_shares FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

### 2. `src/hooks/useOnboarding.ts`

- Remplacer `localStorage.getItem('onboarding_shares_...')` par un `SELECT count(*)` depuis `onboarding_shares` dans `fetchOnboardingStatus`.

### 3. `src/components/OnboardingExperience.tsx`

- `incrementShareCount` : inserer une ligne dans `onboarding_shares` + mettre a jour le state local.
- Chargement initial : fetch le count depuis la table au lieu de localStorage.
- Garder localStorage en fallback pour le state local immediat.

## Fichiers concernes

| Fichier | Changement |
|---------|------------|
| Migration SQL | Nouvelle table `onboarding_shares` avec RLS |
| `src/hooks/useOnboarding.ts` | Lire le count depuis la DB au lieu de localStorage |
| `src/components/OnboardingExperience.tsx` | Inserer en DB dans `incrementShareCount`, charger le count depuis la DB |

## Resultat

Le compteur de partages (ex: 2/3) est preserve meme apres fermeture de l'application, changement d'appareil ou vidage du cache.

