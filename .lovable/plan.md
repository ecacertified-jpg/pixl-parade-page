

# Plan : Remplacer le fil d'actualités par les albums souvenirs des pages créées

## Objectif

Le fil d'actualités de la page d'accueil (`/home`) affichera uniquement les pages d'anniversaire et d'événement créées par les utilisateurs (avec leur album photo/vidéo et cagnotte), en remplacement des publications classiques (table `posts`).

## Architecture des données

Sources de données à combiner :
- **`birthday_pages`** : `id, user_id, slug, title, cover_image_url, celebration_year, fund_id, is_active, created_at`
- **`event_pages`** : `id, creator_id, slug, title, occasion, cover_image_url, fund_id, event_date, is_active, created_at`
- **`birthday_page_photos`** : photos/vidéos/souvenirs liés aux pages anniversaire
- **`event_page_photos`** : photos/vidéos/souvenirs liés aux pages événement
- **`collective_funds`** : cagnotte liée (`target_amount, current_amount, status`)
- **`profiles`** : infos du créateur

## Changements

### 1. Créer un hook `usePagesFeed.ts`

Nouveau hook qui récupère les pages actives (birthday + event) triées par date, avec :
- Le profil du créateur
- Le nombre de photos/vidéos dans l'album
- Le nombre de vœux/messages
- Les infos de la cagnotte liée (montant, progression)
- Interface unifiée `FeedPage` avec un champ `type: 'birthday' | 'event'`

### 2. Créer un composant `PageFeedCard.tsx`

Carte affichant une page dans le fil, avec :
- Avatar et nom du créateur
- Image de couverture de la page
- Titre et occasion (🎂 Anniversaire, 💒 Mariage, etc.)
- Miniatures de l'album (grille 2x2 des premières photos)
- Barre de progression de la cagnotte (si liée)
- Nombre de vœux et photos
- Bouton "Voir la page" naviguant vers `/birthday/:slug` ou `/event/:slug`
- Date de création

### 3. Modifier `NewsFeed.tsx`

- Remplacer `usePosts` par `usePagesFeed`
- Remplacer `PostCard` par `PageFeedCard`
- Supprimer les onglets "Tous" / "Abonnements" (les pages sont toujours publiques)
- Conserver le header avec le titre "Fil d'actualités"
- Supprimer le toggle TikTok (non pertinent pour les albums)
- État vide adapté : "Aucun album souvenir pour le moment"

### 4. Adapter `Home.tsx`

- Supprimer le `feedMode` state et le mode TikTok (plus de `TikTokFeed`)
- Simplifier le `NewsFeed` sans les props `onModeChange`/`currentMode`

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/hooks/usePagesFeed.ts` | **Créer** — hook pour récupérer birthday_pages + event_pages avec album et fund |
| `src/components/PageFeedCard.tsx` | **Créer** — carte d'affichage d'un album souvenir dans le fil |
| `src/components/NewsFeed.tsx` | **Modifier** — remplacer posts par pages feed |
| `src/pages/Home.tsx` | **Modifier** — supprimer TikTok mode, simplifier props NewsFeed |

