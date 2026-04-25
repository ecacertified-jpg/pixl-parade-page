## Diagnostic

L'erreur "Accès refusé / Vous n'avez pas l'autorisation de contribuer" vient de la fonction SQL `can_contribute_to_fund(fund_uuid)` appelée par `ContributionModal.tsx` (ligne 309). Cette fonction renvoie `false` si l'utilisateur n'est PAS :
- le créateur de la cagnotte, OU
- ami du créateur (avec `can_see_funds = true`), OU
- ami du bénéficiaire.

Elle ignore complètement le drapeau `is_public = true` de la cagnotte, ainsi que le `share_token`. Conséquence : un utilisateur arrivant via un lien partagé sur les réseaux sociaux est bloqué dès qu'il n'est pas dans le cercle d'amis — exactement le cas du screenshot ("Sandales GUESS Logo pour Moi-même", `is_public=true`).

De plus, les **non-inscrits** sont totalement bloqués :
- `ContributionModal.tsx` ligne 222 : `if (!user) return;`
- `FundPreview.handleContribute` redirige vers `/auth` si pas connecté.
- L'INSERT dans `fund_contributions` exige `auth.uid() = contributor_id` (RLS), donc impossible sans compte.

## Objectif

Quand un lien de cagnotte est partagé via les réseaux sociaux (cagnotte `is_public = true` OU accès via `share_token`) :
1. Tout utilisateur **connecté** peut contribuer — sans avoir besoin d'être ami.
2. Tout utilisateur **non inscrit** peut contribuer en tant que **donateur invité** (guest) sans créer de compte au préalable, en saisissant simplement nom + téléphone.

## Plan d'implémentation

### 1) Migration SQL — Élargir l'accès des cagnottes publiques

Mettre à jour la fonction `can_contribute_to_fund(fund_uuid)` pour autoriser **tout utilisateur authentifié** dès que la cagnotte est `is_public = true` (en plus des règles d'amitié existantes) :

```sql
-- Après les vérifications existantes, ajouter :
IF EXISTS (
  SELECT 1 FROM public.collective_funds
  WHERE id = fund_uuid AND is_public = true AND status = 'active'
) THEN
  RETURN true;
END IF;
```

Les amis privés conservent leur accès aux cagnottes non publiques.

### 2) Migration SQL — Contributions invité (non inscrits)

Ajouter à la table `fund_contributions` les colonnes nécessaires pour identifier un donateur sans compte :
- `guest_name text` (nullable)
- `guest_phone text` (nullable)
- `guest_email text` (nullable)
- `is_guest boolean default false`

Contrainte : soit `contributor_id IS NOT NULL`, soit `is_guest = true AND guest_phone IS NOT NULL`.

### 3) Edge Function `contribute-as-guest` (publique, sans auth)

Nouvelle fonction Edge sans vérification JWT (`verify_jwt = false` dans `supabase/config.toml`), qui :
- Accepte `{ fund_id, amount, message?, is_anonymous?, guest_name, guest_phone, guest_email? }`
- Vérifie que la cagnotte est `is_public = true` et `status = 'active'`
- Vérifie que `amount > 0` et que `current_amount + amount <= target_amount`
- Insère via `service_role` dans `fund_contributions` avec `contributor_id = NULL, is_guest = true`
- Met à jour `current_amount` de la cagnotte
- Déclenche la notification au créateur (existante)
- Rate-limit par IP (table `rate_limit_buckets`) pour éviter le spam

Cette fonction utilise la `service_role_key` côté serveur uniquement — jamais exposée au front.

### 4) Migration SQL — RLS pour SELECT public des contributions

Conserver l'INSERT non-anonyme aux invités (via Edge Function uniquement). Côté SELECT : ne rien changer pour préserver la confidentialité (les détails restent visibles au créateur et aux contributeurs).

### 5) Front — `ContributionModal.tsx`

- Supprimer le pré-check `can_contribute_to_fund` quand `isFromPublicFund === true` (le check côté serveur reste via la RLS mise à jour).
- Si `!user && isFromPublicFund` : afficher des champs additionnels obligatoires **Nom** et **Téléphone** (+ email optionnel), puis appeler la nouvelle Edge Function `contribute-as-guest` au lieu de l'INSERT direct.
- Si `user && isFromPublicFund` : conserver le flux INSERT direct (la nouvelle politique l'autorise).
- Conserver toute la logique Wave / Mobile Money en aval (le `WavePaymentRedirect` ne dépend pas du compte).

### 6) Front — `FundPreview.tsx` & `BirthdayPage.tsx`

- `FundPreview.handleContribute` : ne plus rediriger vers `/auth` quand l'utilisateur n'est pas connecté ; ouvrir le modal directement (le modal gère le mode invité).
- `BirthdayPage` : remplacer le bouton "Participer au cadeau" qui redirige vers `/auth?redirect=...` par une ouverture directe du `ContributionModal` en mode invité (avec `isFromPublicFund={true}`).

### 7) Mémoire & traçabilité

Mettre à jour `mem://features/collective-funds/navigation-and-contribution-flow` pour documenter :
- Cagnottes `is_public = true` → accessibles à tout authentifié et aux invités via Edge Function.
- Champs `guest_name / guest_phone / is_guest` sur `fund_contributions`.
- Edge Function publique `contribute-as-guest`.

## Fichiers impactés

- `supabase/migrations/<timestamp>_public_fund_contributions.sql` (nouveau)
- `supabase/functions/contribute-as-guest/index.ts` (nouveau)
- `supabase/config.toml` (ajouter `verify_jwt = false` pour la nouvelle fonction)
- `src/components/ContributionModal.tsx`
- `src/pages/FundPreview.tsx`
- `src/pages/BirthdayPage.tsx`
- `.lovable/mem/features/collective-funds/navigation-and-contribution-flow.md`

## Résultat attendu

1. ✅ Le partage du lien d'une cagnotte sur WhatsApp/Facebook/etc. permet à n'importe quel inscrit de contribuer sans demande d'amitié préalable.
2. ✅ Un visiteur non inscrit qui clique sur le lien peut contribuer immédiatement en saisissant nom + téléphone (+ payer via Wave / Mobile Money).
3. ✅ L'erreur "Vous n'avez pas l'autorisation de contribuer" disparaît pour les cagnottes publiques.
4. ✅ Les cagnottes privées (`is_public = false`) restent protégées par les règles d'amitié existantes.
