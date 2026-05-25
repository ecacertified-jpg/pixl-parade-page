
# Accès visiteur "Hybride Freemium" pour JDV

## Objectif
Permettre à un visiteur non connecté de **naviguer librement** dans toute l'app (home, feed, pages anniversaire, cagnottes, boutiques, profils publics, album, messages) et de ne déclencher une **modale d'inscription contextuelle** que sur une **action engageante** (réagir, commenter, contribuer, ajouter contact, créer page, commander, ouvrir panier/notifs/profil). Après inscription/connexion, **l'action initiale est rejouée** automatiquement sur la même page.

## Périmètre

### Pages ouvertes en lecture aux visiteurs
Toutes les routes actuellement protégées par `ProtectedRoute` deviennent accessibles **sauf** celles intrinsèquement personnelles :

**Ouvertes (lecture)** : `/home`, `/index`, `/shop`, `/category/:slug`, `/boutique/:businessId`, `/explore-map`, `/community`, `/publications`, `/profile/:userId`, `/u/:userId/pages`, `/gift-ideas/:contactId` (déjà publiques : `/birthday/:slug`, `/event/:slug`, `/fund/...`).

**Restent strictement protégées (données perso/admin)** : `/dashboard`, `/cart`, `/checkout`, `/collective-checkout`, `/orders`, `/order-confirmation`, `/favorites`, `/followed-shops`, `/preferences`, `/profile-settings`, `/notification-settings`, `/reciprocity-profile`, `/invitations`, `/referral-codes`, `/account-linking`, `/wishlist-catalog`, `/business-*`, `/event/create`, toutes les routes `/admin/*`.

### Actions qui déclenchent la modale (sur pages ouvertes)
- Réactions (❤️ 😂 etc.), commentaires, ajouts favoris
- Contribution à une cagnotte, création de cagnotte/page/événement
- Ajout au panier, "offrir"
- Suivre un profil/boutique, demande d'ami
- Upload média (album, messages, posts)
- Clic sur icônes header : notifications, panier, profil dropdown
- Clic sur entrées du bottom nav menant aux routes protégées

## Architecture technique

### 1. Nouveau composant `PublicRoute`
Wrapper léger qui rend `children` sans contrôle d'auth, mais qui :
- Sauvegarde `last_visited_route` (comme `ProtectedRoute`)
- Lance `usePresenceTracker` seulement si `user` existe

### 2. Hook `useAuthGate`
```ts
const { requireAuth } = useAuthGate();
// usage : onClick={requireAuth('react_to_message', () => doReact(id))}
```
- Si `user` existe → exécute le callback immédiatement
- Sinon → ouvre `AuthGateModal` avec un `intent` sérialisable et stocke le callback dans un ref/registry en mémoire + l'intent en `sessionStorage` (clé `pending_intent`) pour résister au reload post-OAuth
- Throttling : pour les micro-actions (réactions), si l'utilisateur a refusé dans la même session, n'affiche la modale qu'une fois toutes les 5 actions

### 3. Composant `AuthGateModal`
- Titre contextualisé selon l'`intent` (table de libellés : `contribute_fund`, `react_post`, `add_to_cart`, `open_cart`, `follow_business`, etc.)
- Sous-titre : nom de la cible si dispo ("…pour souhaiter à Aminata")
- Toggle Connexion / Inscription intégré (réutilise composants de `/auth`)
- Bouton "Continuer à explorer" (ferme la modale, action ignorée)
- Lien WhatsApp support déjà actif sur pages publiques

### 4. Provider `AuthGateProvider`
Monté dans `App.tsx` au-dessus des routes, expose `requireAuth`, contient l'état de la modale et le registry des callbacks en attente.

### 5. Rejouage post-auth
Dans `AuthContext` (ou un effet dans `AuthGateProvider`) :
- À chaque transition `SIGNED_IN` (via `onAuthStateChange`), lire `sessionStorage.pending_intent`
- Résoudre l'action : soit re-déclencher le callback s'il est encore en mémoire, soit naviguer vers l'URL canonique de l'intent (ex: `intent=contribute_fund&fundId=xxx` → ouvre directement la sheet de contribution sur la page courante)
- Nettoyer `pending_intent`

### 6. Adaptations UI conditionnelles
Sur les pages ouvertes, quand `!user` :
- `ProfileDropdown` → bouton "Se connecter / S'inscrire" qui ouvre la modale
- `NotificationPanel` → icône cliquable qui ouvre la modale (intent `open_notifications`)
- `ShoppingCart` header → modale intent `open_cart`
- `BottomNavigation` items personnels → modale intent correspondant
- `FriendsCircleReminderCard` masquée
- `WelcomeSection` adaptée ("Bienvenue ! Crée ton compte pour…")

### 7. SEO et données publiques
- Vérifier que les RLS des tables affichées sur les pages désormais publiques autorisent bien la lecture anonyme nécessaire (`public_profiles`, `business_public_info`, `collective_funds_public`, messages d'anniversaire actifs — déjà OK selon les memories).
- Pour `Shop` / `Home` : s'assurer que les requêtes tolèrent `user = null` (sinon adapter les hooks pour utiliser des vues publiques).

## Découpage technique

```text
1. PublicRoute + AuthGateProvider + AuthGateModal + useAuthGate (foundation)
2. App.tsx : remplacer ProtectedRoute → PublicRoute sur les routes "ouvertes"
3. Adaptation des composants header (ProfileDropdown, Notif, Cart, BottomNav)
4. Câblage requireAuth sur :
   a. Réactions / commentaires (AlbumItemReactions, message wall, posts)
   b. Cagnottes : contribuer, créer, suivre
   c. Album : upload, favoris, partage
   d. Boutique : ajout panier, suivre, favoris
   e. Profils : follow, demande d'ami
5. Rejouage post-auth (sessionStorage + onAuthStateChange)
6. Audit RLS / hooks pour tolérance user=null
7. QA : parcours visiteur sur home, /birthday/:slug, /shop, /boutique/:id
```

## Détails techniques

**Pas de migration DB nécessaire** dans un premier temps : la majorité des données affichées en lecture passent déjà par des vues publiques ou des RLS compatibles anon. Un audit ciblé sera fait à l'étape 6.

**Compatibilité onboarding** : après inscription via la modale, on n'envoie PAS dans le flow onboarding 6 étapes — on rejoue l'intent et on reste sur la page. L'onboarding sera proposé via la prochaine visite de `/home` ou un toast non bloquant ("Termine ton profil pour débloquer X"). Cela contredit la règle actuelle "onboarding 6 étapes forcé" — à confirmer par le user (voir question ouverte ci-dessous).

**Storage clé** : `sessionStorage.pending_intent = { type, payload, returnUrl }`

**Memory à mettre à jour** : créer `mem://auth/visitor-access-and-auth-gate` documentant ce contrat.

## Question ouverte à trancher après approbation
L'onboarding forcé 6 étapes (mem `onboarding-experience-and-logic`) doit-il rester obligatoire après inscription via la modale, ou être adouci (proposé mais skippable) pour préserver l'intention initiale du visiteur ? Ma reco : **skippable** dans ce contexte, sinon le rejouage d'intent est neutralisé par 6 écrans.

## Hors périmètre
- Refonte de la landing
- Changements de design des modales / pages existantes
- Modifications backend autres que d'éventuels ajustements RLS minimes détectés à l'étape 6
