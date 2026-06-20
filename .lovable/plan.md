
# Plan — Inscription express & pages anniversaire déléguées

## 1. Parcours d'inscription express (auto-création de la page)

**Objectif** : raccourcir l'inscription. Dès que le compte est créé (Google OAuth OU OTP WhatsApp validé), JDV crée et publie automatiquement la page d'anniversaire de l'utilisateur pour l'année en cours, puis le redirige vers cette page. L'onboarding complet (goûts, souhaits, amis, cagnotte, partages, photos) reste accessible **plus tard** via :
- le modal d'onboarding du dashboard (déjà existant) ;
- l'entrée "Ma page d'anniversaire" du bouton **+** de la bottom bar (déjà existante).

### Comportement
- Marqueur `intent=express_birthday` (et alias `create_birthday_page` déjà utilisé par `VisitorConversionCTA`) ajouté à l'URL `/auth`.
- À la fin de l'inscription **réussie** (Google callback OU OTP vérifié) et **seulement pour ce intent** :
  1. Vérifier qu'aucune page d'anniversaire n'existe pour l'année en cours.
  2. Créer la ligne `birthday_pages` minimale : `user_id`, `celebration_year = year(now)`, `slug` auto, `is_active = true`, `published_at = now()`, `published_via_onboarding = false`, `title = "{prénom} fête son anniversaire"`. La date d'anniversaire est déjà collectée en pré-auth (`PreAuthDiscovery`), donc disponible dans les metadata.
  3. Marquer un flag local `bp_type_${userId} = 'self'` pour cohérence avec `useOnboarding`.
  4. Rediriger vers `/birthday/{slug}?welcome=1` au lieu de `/dashboard`.
- L'onboarding obligatoire est **désactivé en bloc** pour ces utilisateurs : `profiles.onboarding_completed = true` n'est **pas** mis à jour ; à la place le hook `useOnboarding` continue de calculer les étapes restantes et de proposer la complétion dans le dashboard. Aucun blocage de navigation.
- Si la création de page échoue (réseau, doublon), on log et on redirige tout de même vers `/dashboard?bp_express_failed=1` qui ouvrira le `BirthdayPageBuilderModal`.

### Réutilisation par `VisitorConversionCTA`
- Le CTA visiteur (`src/components/VisitorConversionCTA.tsx`) construit déjà `intent=create_birthday_page`. On le bascule sur `intent=express_birthday` (même comportement côté `/auth`). Texte CTA inchangé.

## 2. Onglet "Clients" dans Mes coulisses (organisateurs)

**Objectif** : un organisateur d'événement peut créer des pages d'anniversaire **au nom de ses clients**, générer un lien magique d'inscription/connexion, et conserver les droits d'admin sur le compte créé.

### UI
- Nouveau `TabsTrigger value="clients"` dans `OrganizationSection.tsx` (visible uniquement pour `isOwner` ou rôle `admin`).
- Nouveau composant `ClientsManager.tsx` listant les clients créés par l'organisateur courant pour cet événement, avec :
  - Bouton **"Créer une page client"** → formulaire (prénom, nom, téléphone, email facultatif, date d'anniversaire).
  - Pour chaque client : lien à copier (`Copier`), bouton WhatsApp pré-rempli, statut (`En attente d'activation` / `Réclamé`), bouton **Ouvrir la page**.

### Backend
- Nouvelle table `client_accounts` (organisateur ↔ client) :
  - `id`, `organizer_user_id`, `event_page_id` (nullable, page d'événement liée), `claim_token` (unique), `first_name`, `last_name`, `phone`, `email`, `birthday`, `created_user_id` (nullable, rempli à la réclamation), `birthday_page_id` (FK), `claimed_at`, timestamps.
  - RLS : l'organisateur (créateur) lit/écrit ses lignes ; `service_role` plein accès ; `anon` peut lire **uniquement** via token de claim (passe par edge function).
- Nouvelle table `client_admins` (qui peut administrer quel compte) :
  - `id`, `client_user_id`, `admin_user_id`, `granted_at`, `revoked_at`.
  - RLS : l'admin ou l'utilisateur cible peut lire ; aucune écriture client (gérée par edge functions).
- Édition légère des RLS de `birthday_pages` : un `admin_user_id` listé dans `client_admins` (actif) peut UPDATE/INSERT/DELETE sur les pages d'anniversaire de `client_user_id`. Idem pour `birthday_page_photos`, `collective_funds` créés via la page. Implémenté via `SECURITY DEFINER` `public.is_client_admin(_admin uuid, _client uuid)`.

### Edge functions
- `create-client-account` :
  - Auth requis (organisateur). Crée la ligne `client_accounts` + génère `claim_token` aléatoire. Si une page anniversaire doit être pré-créée (`birthday` fourni), crée un **placeholder** `birthday_pages` rattaché à `client_accounts.id` (sans `user_id` encore).
  - Insère immédiatement une ligne `client_admins` "en attente" qui sera activée à la réclamation.
  - Retourne `{ claim_url, share_message }`. Le `claim_url` pointe vers `/auth?tab=signup&claim={token}&intent=express_birthday`.
- `claim-client-account` :
  - Appelée juste après une inscription/connexion réussie quand un `claim` est présent dans l'URL.
  - Service role : vérifie le token, rattache `created_user_id`, transfère le `birthday_page` placeholder au nouvel utilisateur, active la ligne `client_admins` (`organizer_user_id` ↔ nouveau user). Idempotent.

### Flux côté `/auth`
- Si `claim` est présent : après Google OAuth callback **ou** validation OTP, appel à `claim-client-account` avant la redirection. Si la page existe déjà, on saute la création express ; sinon on retombe sur le flux express standard.

## 3. Détails techniques

### Fichiers créés
- `src/components/organization/ClientsManager.tsx`
- `src/hooks/useOrganizerClients.ts`
- `supabase/functions/create-client-account/index.ts`
- `supabase/functions/claim-client-account/index.ts`
- Migration SQL : tables `client_accounts`, `client_admins`, fonction `is_client_admin`, policies, GRANTs.

### Fichiers modifiés
- `src/pages/Auth.tsx` : à la fin du flux signup/OAuth, si `intent === 'express_birthday'` ou `claim` présent → appeler nouvel helper `runExpressPostSignup(userId, { claim })` (créé dans `src/utils/expressSignup.ts`) qui :
  - appelle `claim-client-account` si `claim` ;
  - sinon insère `birthday_pages` (year courante) en utilisant la birthday des metadata ;
  - redirige vers `/birthday/{slug}?welcome=1`.
- `src/components/VisitorConversionCTA.tsx` : intent → `express_birthday`.
- `src/components/organization/OrganizationSection.tsx` : nouvel onglet "👥 Clients" (visible si `isOwner`).
- `src/hooks/useOnboarding.ts` : ne pas forcer l'ouverture du modal bloquant pour les comptes créés via `express_birthday` (flag `localStorage.express_birthday_${userId} = '1'`). L'onboarding reste accessible et calculable, mais ne s'auto-affiche pas en plein écran ; il apparaît en bannière "Compléter ma page" dans le dashboard.

### Hors-scope
- Pas de refonte du `BirthdayPageBuilderModal` lui-même.
- Pas de modification des autres onglets de Mes coulisses.
- Pas de gestion multi-organisateurs sur un même client (1 organisateur principal par client pour cette V1, mais l'architecture le permettra plus tard).

### Risques / points d'attention
- Les RLS de `birthday_pages` actuelles supposent `user_id = auth.uid()`. L'ajout de la branche `is_client_admin(auth.uid(), birthday_pages.user_id)` doit être testée pour ne pas casser les policies existantes (on **ajoute** une policy permissive supplémentaire, on ne modifie pas l'existante).
- Le `birthday_pages` placeholder créé avant claim n'a pas de `user_id` valide → on stocke `user_id = organizer_user_id` temporairement avec un flag `is_placeholder=true` (nouvelle colonne nullable) pour rester compatible avec la FK existante. Au claim, on remplace par le `created_user_id`.

Confirme et je passe en build.
