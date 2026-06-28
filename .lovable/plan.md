## 1. Bouton « Voir » (œil) sur les cartes Clients réclamées

**Symptôme** : La carte « Mathurin Tagro » est marquée « Réclamé » mais aucun bouton œil n'apparaît.

**Cause** : Dans `useOrganizerClients.ts`, le join `birthday_page:birthday_page_id(slug)` peut renvoyer `null` parce que la RLS de `birthday_pages` empêche l'organisateur de lire la page une fois le `creator_id` réattribué au client (au claim). Le rendu conditionne le bouton à `slug && claimed`, donc il disparaît.

**Fix** :
- Dans `supabase/functions/create-client-account/index.ts` : renvoyer aussi le `slug` dans la réponse ET le stocker en colonne dénormalisée `birthday_page_slug` sur `client_accounts` (migration : `ADD COLUMN birthday_page_slug text`).
- Dans `supabase/functions/claim-client-account/index.ts` : déjà calcule le slug — l'écrire sur `client_accounts.birthday_page_slug` au moment du claim (au cas où il aurait été régénéré).
- `useOrganizerClients.ts` : lire `birthday_page_slug` directement (plus de join fragile).
- `ClientsManager.tsx` : utiliser ce slug pour le bouton œil, condition `claimed && slug` → le bouton apparaît systématiquement quand la page est réclamée.

## 2. Photo de profil du créateur qui ne s'affiche pas

**Symptôme** : Sur la page mariage, l'avatar du haut affiche l'initiale « M » alors que l'utilisateur a uploadé une photo (la photo du conjoint s'affiche bien).

**Causes possibles identifiées dans `EventPage.tsx` et `EventHeroOverlay.tsx`** :
- `setCreatorProfile((p) => (p ? { ...p, avatar_url: url } : p))` — si `creatorProfile` est `null` au moment du callback (édition rapide / re-render), la mise à jour est ignorée.
- `EditAvatarModal` met à jour `profiles.avatar_url` mais l'`<img>` n'a pas de fallback `onError` ni de cache-buster, donc une URL signée expirée ou une image manquante reste sur l'initiale silencieusement.
- L'avatar du créateur est rendu via `<img>` brut à l'intérieur de `<Avatar>` (au lieu de `<AvatarImage>`), ce qui empêche le mécanisme natif Radix de basculer sur le fallback en cas d'erreur — mais surtout, si l'URL est valide mais cassée, on n'a aucun signal.

**Fix** :
- Dans `EventPage.tsx` : rendre le setter robuste — si `creatorProfile` est null, initialiser avec `{ first_name: '', avatar_url: url }` puis refetch la ligne profil.
- Après upload, ajouter un cache-buster (`?v=${Date.now()}`) à l'URL renvoyée.
- Dans `EventHeroOverlay.tsx` : remplacer les `<img>` bruts par `<AvatarImage src=… onError=…>` et garder `<AvatarFallback>` afin d'avoir un vrai fallback visuel + ajouter `referrerPolicy="no-referrer"` (utile pour les avatars Google).
- Refetch le profil créateur après fermeture de `EditAvatarModal` (en plus du callback), pour garantir une source de vérité.

## 3. Pilule « Événement terminé » — lisibilité mobile

Actuellement (`EventCountdown.tsx`) la pilule utilise `text-sm md:text-base`, padding `py-2.5`, gradient `from-primary to-accent`. Sur mobile, dans le contexte du hero (overlay sombre, image rose), elle manque de présence et son icône check est petite.

**Ajustements (uniquement style, pas de logique)** :
- Padding mobile plus généreux : `px-4 py-2 md:px-5 md:py-2.5`.
- Texte plus grand et plus lisible : `text-[15px] md:text-base` + `leading-none` + `tracking-tight` (au lieu de `tracking-wide`).
- Icône check légèrement agrandie : `h-5 w-5 md:h-5 md:w-5` + `stroke-[3]`.
- Renforcer le contraste : `shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.6)]` + `ring-1 ring-white/30` (au lieu de `border border-white/40`).
- Ajouter `max-w-full whitespace-nowrap` pour éviter tout retour à la ligne dans les conteneurs étroits.
- Marge supérieure réduite sur mobile pour ne pas chevaucher le titre tronqué : `mt-2 md:mt-3`.

Aucun changement sur la logique du compte à rebours ni sur les autres états (« Aujourd'hui », « Dans X jours », HH:MM:SS).

## Fichiers touchés

- `supabase/migrations/<new>.sql` — `ALTER TABLE client_accounts ADD COLUMN birthday_page_slug text`.
- `supabase/functions/create-client-account/index.ts`
- `supabase/functions/claim-client-account/index.ts`
- `src/hooks/useOrganizerClients.ts`
- `src/components/organization/ClientsManager.tsx`
- `src/pages/EventPage.tsx`
- `src/components/event/EventHeroOverlay.tsx`
- `src/components/EventCountdown.tsx`
