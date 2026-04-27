## Objectif

Transformer l'entrée "Publications" en "Mes pages" : un espace centralisé où l'utilisateur retrouve toutes ses pages (anniversaires + événements) publiées, son compte à rebours d'anniversaire, ses amis en commun cliquables vers leurs pages, et un bouton "Ajouter" qui ouvre le même modal que le bouton PLUS du menu du bas.

## Ce qui sera fait

### 1. Renommage du libellé "Publications" → "Mes pages"

Dans `src/components/ProfileDropdown.tsx` :
- Remplacer le texte "Publications" par "Mes pages".
- Remplacer l'icône `Users` par `BookHeart` (ou `LayoutGrid`) plus représentative de pages.
- Conserver la route `/publications` pour compatibilité (pas de migration de chemins nécessaire).

### 2. Refonte de la page `/publications` (`src/pages/Publications.tsx`)

La page sera entièrement repensée. L'ancien contenu (liste de `posts`) est supprimé. Nouvelle structure verticale, mobile-first :

```text
┌─────────────────────────────────────┐
│ ← Mes pages              [+ Ajouter]│  ← header avec bouton icône
├─────────────────────────────────────┤
│ 🎂 Compte à rebours anniversaire    │  ← BirthdayCountdownCard existant
├─────────────────────────────────────┤
│ Mes pages publiées                  │
│ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │cover │ │cover │ │cover │  ← grille│
│ │Année │ │Mariage│ │ ... │  cliquable│
│ └──────┘ └──────┘ └──────┘          │
├─────────────────────────────────────┤
│ Amis en commun                      │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐                 │
│ │👤│ │👤│ │👤│ │👤│  ← avatars      │
│ └──┘ └──┘ └──┘ └──┘    cliquables   │
└─────────────────────────────────────┘
```

#### a) En-tête
- Garder le bouton retour.
- Titre : "Mes pages".
- Bouton icône `Plus` à droite (variant outline, h-9 w-9). Au clic, ouvre le `BirthdayPageBuilderModal`.

#### b) Compte à rebours
- Réutiliser tel quel le composant `BirthdayCountdownCard` (déjà utilisé dans `Dashboard.tsx`).
- Récupérer `birthday` et `first_name` depuis `profiles` via une simple requête Supabase au montage.
- N'afficher la carte que si l'utilisateur a renseigné une date d'anniversaire.

#### c) Section "Mes pages publiées"
- Source de données : créer un petit hook `useMyPublishedPages` qui fait deux requêtes en parallèle :
  - `birthday_pages` où `user_id = auth.uid()` ET `is_active = true`.
  - `event_pages` où `creator_id = auth.uid()` ET `is_active = true`.
- Fusionner et trier par `celebration_year`/`event_date` desc.
- Afficher en grille 2 colonnes avec : image de couverture, titre, occasion, année.
- Au clic : navigation vers `/p/:slug` (birthday) ou `/event/:slug` (event), routes existantes.
- État vide : message + CTA secondaire qui ouvre aussi le `BirthdayPageBuilderModal`.

#### d) Section "Amis en commun"
- Source : la table `contact_relationships` (déjà utilisée par `useFriendRequests.ts`) — ce sont les liens d'amitié réciproques de l'utilisateur.
- Créer un hook `useMyFriends` qui :
  - Récupère depuis `contact_relationships` toutes les paires impliquant `auth.uid()`.
  - Récupère les `profiles` correspondants (first_name, avatar_url).
- Affichage : carrousel horizontal d'avatars (taille 14) avec prénom dessous.
- Au clic sur un avatar :
  - Naviguer vers `/u/:userId` (route profil public si elle existe) OU vers la dernière page publiée de cet ami (`birthday_pages` la plus récente). On utilisera la route profil publique si présente, sinon on rabattra sur la page anniversaire la plus récente de l'ami.
- État vide : "Aucun ami pour le moment" avec lien vers `/invitations`.

### 3. Bouton "Ajouter" — réutilisation du modal existant

- Importer `BirthdayPageBuilderModal` depuis `@/components/BirthdayPageBuilderModal`.
- État local `isBuilderOpen` ; le bouton `+` du header et la CTA d'état vide partagent le même setter.
- Le modal est exactement le même que celui ouvert depuis `CreateActionMenu` (bouton PLUS du menu du bas), donc cohérence garantie.

## Détails techniques

- Aucune nouvelle table ni migration.
- Aucun changement aux routes (la route `/publications` reste).
- Hook `useMyPublishedPages` : type `PublishedPage = { id, type: 'birthday'|'event', slug, title, cover_image_url, occasion, year }`. Stockage local via `useState`/`useEffect` (cohérent avec `useBirthdayPages`).
- Hook `useMyFriends` : type `FriendItem = { user_id, first_name, avatar_url }`.
- L'icône du bouton "+" : `Plus` de `lucide-react`, déjà disponible.
- Conventions de couleurs/typographie : conserver le style existant de la page (gradient `from-background via-violet-50/30 to-rose-50/20`, font Poppins pour le titre).

## Fichiers impactés

- Modifié : `src/components/ProfileDropdown.tsx` (libellé + icône)
- Modifié : `src/pages/Publications.tsx` (refonte complète)
- Créé : `src/hooks/useMyPublishedPages.ts`
- Créé : `src/hooks/useMyFriends.ts`

## Hors scope

- Pas de renommage de la route `/publications` (compatibilité liens existants).
- Pas de modification du `BirthdayPageBuilderModal` lui-même.
- Pas de nouveau breadcrumb.
