## Corrections des 3 bugs signalés

### Bug 1 — Cagnotte Jumia : "violates foreign key constraint collective_funds_creator_id_fkey"

**Cause** : `collective_funds.creator_id` référence `profiles.user_id`. Certains utilisateurs (Google Auth, comptes réclamés, anciens comptes) n'ont pas de ligne `profiles` créée, donc l'insertion échoue.

**Correctif**
1. Ajouter une fonction SQL security-definer `public.ensure_profile_exists()` qui insère une ligne minimale dans `profiles` pour `auth.uid()` si absente (idempotente).
2. Dans `ExternalProductFundModal.handleSubmit` (avant l'insert de la cagnotte), appeler `supabase.rpc('ensure_profile_exists')`.
3. Appliquer le même garde-fou dans les autres flux de création de cagnotte (`WishlistFundPickerModal`, `CreateFund`…) via un petit hook `useEnsureProfile` réutilisable.

### Bug 2 — Publication visiteur d'un vœu : "Edge Function returned a non-2xx status code"

**Cause** : reproduit via curl → l'edge function `post-birthday-message` renvoie 404 "Page introuvable ou inactive" pour un slug `event_pages` valide (le même slug retourne bien la ligne via REST/service role). La version déployée de la fonction ne comporte pas encore le support `page_kind: "event"` (n'a pas été redéployée depuis l'ajout des pages événement).

**Correctif**
1. Forcer le redéploiement de `supabase/functions/post-birthday-message/index.ts` (retouche mineure : nettoyer la ligne morte `const status = ALLOWED_MEDIA.includes(args.status)` qui compare à la mauvaise liste, et logger `pageErr` explicitement pour debug futur).
2. Vérifier après déploiement via curl que `page_kind:"event"` renvoie 200.

### Bug 3 — L'un des avatars du couple disparaît après recherche de la page

**Cause** : l'avatar du créateur est chargé depuis la vue `public_profiles`, filtrée sur `privacy_setting = 'public'`. Si le créateur du mariage a un profil `friends`/`private`, la vue ne renvoie rien → seul l'avatar du conjoint (stocké sur `event_pages.spouse_avatar_url`) reste visible. Sur la page directement ouverte par le propriétaire, `useAuth` peut charger l'avatar par un autre chemin, d'où l'incohérence.

**Correctif**
1. Ajouter une fonction Postgres `public.get_event_page_creator_avatar(page_id uuid)` security-definer qui renvoie `first_name, avatar_url` pour le créateur **uniquement si** la page est active — indépendamment de `privacy_setting`.
2. Dans `EventPage.tsx`, remplacer la requête `public_profiles` par un appel `supabase.rpc('get_event_page_creator_avatar', { page_id })`.
3. Faire de même côté `BirthdayPage` (mémo suivant) — hors scope de ce bugfix, on documente juste. (uniquement Event ici.)

### Fichiers touchés
- Migration SQL : nouvelles fonctions `ensure_profile_exists`, `get_event_page_creator_avatar`.
- `src/components/ExternalProductFundModal.tsx` : appel RPC ensure-profile avant insert.
- `src/hooks/useEnsureProfile.ts` : petit hook réutilisable.
- `src/pages/EventPage.tsx` : nouvelle source pour l'avatar créateur.
- `supabase/functions/post-birthday-message/index.ts` : nettoyage + log → force redeploy.

### Vérifications
- curl `post-birthday-message` avec slug event → 200.
- Créer une cagnotte Jumia avec un compte sans profil → cagnotte créée, redirection `/f/:id`.
- Ouvrir la page mariage en navigation privée → les deux avatars s'affichent.
