

# Plan : Fil d'actualités avec pages des proches et système d'abonnement

## Problème actuel

Le fil d'actualités (`usePagesFeed`) charge bien les `birthday_pages` et `event_pages` actives depuis Supabase. Les données existent (160 birthday pages actives) mais la plupart n'ont ni photos, ni couverture, ni cagnotte — ce qui rend les cartes vides visuellement. Le code fonctionne techniquement, mais ne filtre pas par relation sociale ni ne priorise le contenu enrichi.

## Objectifs

1. **Corriger le fil** : prioriser les pages avec contenu (photos/cagnotte) et afficher aussi les pages sans contenu avec un visuel par défaut
2. **Filtrer par réseau social** : montrer les pages des amis/proches (via `user_follows`) + toutes les pages publiques
3. **Ajouter l'abonnement aux pages** : bouton "Suivre" sur chaque carte du fil

## Changements

### 1. Migration — Table `page_follows`

Nouvelle table pour l'abonnement spécifique aux pages (birthday/event) :

```sql
CREATE TABLE public.page_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_type text NOT NULL CHECK (page_type IN ('birthday', 'event')),
  page_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, page_type, page_id)
);

ALTER TABLE public.page_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their follows" ON public.page_follows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can follow pages" ON public.page_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unfollow pages" ON public.page_follows
  FOR DELETE USING (auth.uid() = user_id);
-- Public count visibility
CREATE POLICY "Anyone can count follows" ON public.page_follows
  FOR SELECT USING (true);
```

### 2. `usePagesFeed.ts` — Ajout onglets et filtre social

- Ajouter un paramètre `filter: 'all' | 'following'`
- **Mode "Tous"** : toutes les pages actives, triées par date (comportement actuel)
- **Mode "Abonnements"** : pages créées par les utilisateurs suivis (`user_follows.following_id`) + pages explicitement suivies (`page_follows`)
- Ajouter un champ `is_following: boolean` à `FeedPage` pour afficher l'état du bouton
- Charger les `page_follows` de l'utilisateur connecté en parallèle
- Pour les pages sans photo ni couverture, générer un visuel par défaut (gradient + icône occasion)

### 3. `NewsFeed.tsx` — Onglets Tous / Abonnements

- Ajouter deux onglets en haut : **Tous** et **Abonnements**
- L'onglet actif filtre le flux via le paramètre du hook
- Animation de transition entre les onglets (framer-motion fade)

### 4. `PageFeedCard.tsx` — Bouton Suivre + visuels par défaut

- Ajouter un bouton **Suivre / Suivi** à côté de l'icône occasion dans le header
- Toggle optimiste : insert/delete dans `page_follows`
- Pour les pages sans image : afficher un **placeholder visuel** avec un gradient coloré et l'icône de l'occasion (🎂, 💒, etc.) en grand format
- Badge "Ami" si le créateur est dans `user_follows`

### 5. `usePageFollow.ts` — Hook d'abonnement

Nouveau hook gérant :
- `isFollowing(pageType, pageId)` : état local
- `toggleFollow(pageType, pageId)` : insert/delete optimiste
- Chargement initial des follows de l'utilisateur

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | **Créer** — table `page_follows` avec RLS |
| `src/hooks/usePagesFeed.ts` | **Modifier** — filtre all/following, champ is_following, placeholder |
| `src/hooks/usePageFollow.ts` | **Créer** — hook toggle follow/unfollow |
| `src/components/NewsFeed.tsx` | **Modifier** — onglets Tous/Abonnements |
| `src/components/PageFeedCard.tsx` | **Modifier** — bouton Suivre, placeholder visuel, badge ami |

## Détails techniques

- `user_follows` (existant) sert à déterminer si le créateur est un ami → badge "Ami" + filtre Abonnements
- `page_follows` (nouveau) sert à l'abonnement spécifique à une page → notifications futures + filtre Abonnements
- Les deux tables sont combinées dans le mode "Abonnements" : pages des amis OU pages suivies explicitement
- Le toggle follow utilise une mise à jour optimiste (state local avant confirmation serveur)

