

# Plan : Réactions (like, cœur, etc.) sur les photos/souvenirs de l'album d'anniversaire

## Objectif

Permettre aux utilisateurs authentifiés de réagir avec des emojis (❤️, 😂, 😮, 👏, 🎉) aux éléments de l'album (photos, vidéos, souvenirs texte) des pages d'anniversaire.

## Étape 1 — Migration base de données

### Table `album_photo_reactions`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| photo_id | uuid FK birthday_page_photos | Élément de l'album |
| user_id | uuid FK auth.users | Utilisateur qui réagit |
| reaction_type | text | 'heart', 'laugh', 'wow', 'clap', 'party' |
| created_at | timestamp | Horodatage |
| UNIQUE(photo_id, user_id, reaction_type) | | Un seul de chaque type par user |

### RLS
- Lecture publique (authentifié + anon)
- Insert/Delete pour les utilisateurs authentifiés sur leurs propres réactions

## Étape 2 — Composant `AlbumItemReactions.tsx`

Petit composant affiché sous chaque item de la grille et dans le lightbox :
- Barre de 5 emojis cliquables : ❤️ 😂 😮 👏 🎉
- Affiche le compteur de chaque réaction non-nulle
- Toggle : cliquer ajoute/retire sa réaction
- Animation Framer Motion au clic (scale bounce)

## Étape 3 — Mise à jour de `BirthdayAlbum.tsx`

- Charger les réactions groupées par photo_id lors du fetch initial (dans `BirthdayPage.tsx`)
- Ajouter `AlbumItemReactions` dans chaque carte de la grille (overlay en bas, au-dessus du badge auteur)
- Ajouter `AlbumItemReactions` dans le lightbox sous le contenu
- Passer `user` pour gérer l'état actif/inactif des réactions de l'utilisateur courant

## Étape 4 — Chargement des réactions dans `BirthdayPage.tsx`

- Après le fetch des `birthday_page_photos`, faire un second fetch groupé des réactions
- Passer les données au composant `BirthdayAlbum` via une nouvelle prop `reactions`

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx.sql` | Table `album_photo_reactions` + RLS + index |
| `src/components/AlbumItemReactions.tsx` | **Créer** — composant réactions emoji |
| `src/components/BirthdayAlbum.tsx` | **Modifier** — intégrer les réactions dans grille + lightbox |
| `src/pages/BirthdayPage.tsx` | **Modifier** — charger les réactions avec les photos |

