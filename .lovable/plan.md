## Refonte de l'album souvenir façon Flickr

Transformer la section « Album souvenir de X » de la page d'anniversaire en une expérience inspirée de Flickr : 4 onglets principaux (Galerie / Événements / Souvenirs / Favoris), des sous-onglets Photos/Vidéos partout où ils ont du sens, et un parcours en 3 niveaux pour les événements (liste d'événements → cartes d'événements avec couverture → grille interne → lecteur plein écran).

### 1. Modèle de données

Ajouter à `birthday_page_photos` :
- `event_kind` (text, nullable) — slug parmi `anniversaire`, `mariage_traditionnel`, `mariage_religieux`, `mariage_civil`, `reussite_academique`, `reussite_scolaire`, `promotion_pro`. NULL = élément hors événement (toujours visible dans Galerie).
- `view_count` (int, défaut 0).

Nouvelles tables :
- `birthday_page_photo_views` (photo_id, viewer_id nullable, viewer_fingerprint, viewed_at) — 1 vue / utilisateur / 24 h, déclenche un trigger qui incrémente `view_count`.
- `birthday_page_photo_favorites` (photo_id, user_id, created_at) — l'étoile « Favoris » de Flickr ; PK composite.

RLS : lecture publique (page active), insert favoris/views par utilisateur authentifié, suppression de son propre favori.

Constante front `EVENT_KINDS` avec label FR + parent (Mariage / Réussite groupent leurs sous-types pour l'UI).

### 2. Architecture des composants

```text
BirthdayAlbumFlickr/
  index.tsx                  ← orchestrateur (4 onglets principaux)
  GalleryTab.tsx             ← tout sauf souvenirs, sous-onglets Photos/Vidéos
  EventsTab.tsx              ← niveau 1 : grille des cartes d'événements
    EventCoverCard.tsx       ← 1ʳᵉ photo/vidéo + titre + n photos/vidéos · n vues
    EventDetailView.tsx      ← niveau 2 : header Flickr + grille interne
    EventUploadSheet.tsx     ← upload ciblé sur un event_kind + sous-type
  MemoriesTab.tsx            ← cartes texte (existant migré)
  FavoritesTab.tsx           ← items mis en favori, sous-onglets Photos/Vidéos
  shared/
    MediaGrid.tsx            ← grille pleine largeur (style Tent-making Bats / Brown Basilisk)
    MediaTile.tsx            ← tuile + métriques (★ favoris · 💬 commentaires) + réactions au survol
    MediaLightbox.tsx        ← lecteur immersif + barre d'actions (★, 💬, ↗, ⬇, ⋯)
    SearchBar.tsx            ← recherche locale (légende, uploader, type)
```

`BirthdayAlbum.tsx` actuel est remplacé par `BirthdayAlbumFlickr` dans `BirthdayPage.tsx` ; tout le code de réactions, upload, edit/delete est extrait dans des hooks (`useAlbumUpload`, `useAlbumReactions`, `useAlbumFavorites`) pour rester DRY.

### 3. Comportement détaillé

**Onglets principaux** (barre soulignée bleue façon Flickr, scroll horizontal sur mobile)
- **Galerie** : tout le contenu non-textuel + sous-onglets Photos / Vidéos. Tri « Date d'importation » dans un Select.
- **Événements** : remplace Albums. Sous-onglets Photos / Vidéos qui filtrent ce qui apparaît dans les cartes événements et dans la vue détail.
- **Souvenirs** : conserve les cartes texte avec citations (état actuel).
- **Favoris** : items favorisés par l'utilisateur courant, + sous-onglets Photos / Vidéos (vue désactivée pour visiteurs anonymes avec CTA login).

**Niveau 1 — grille des cartes événements**
- Une carte par `event_kind` ayant ≥ 1 média : couverture = 1ʳᵉ photo/vidéo (poster vidéo si vidéo), overlay bas gauche avec titre FR + ligne `309 photos · 60 vues` (somme des `view_count`).
- Boutons `+` discrets par événement → ouvre `EventUploadSheet` pré-rempli avec `event_kind` + filtre photo/vidéo selon le sous-onglet actif.
- Mariage / Réussite : la carte parent regroupe ses sous-types (tradi/religieux/civil) et expose `+` par sous-type dans une popover.

**Niveau 2 — détail d'événement** (vue Panama)
- Header : flèche retour ←, icône partage ↗, titre en très grand (Poppins semibold), `par {nom_de_l_utilisateur_celebre}`, ligne `n photos · n vues`, barre d'icônes vue (slideshow ▷, grille dense, grille large, liste).
- Grille pleine largeur (1 col mobile, 2 col tablette, 3 col desktop) — tuiles `MediaTile` avec titre + métriques `★ 36  💬 4  +` sous chaque média (style Tent-making Bats).
- Tap sur tuile → `MediaLightbox`.

**Niveau 3 — lightbox réactive**
- Média plein écran fond noir, swipe + flèches.
- Barre d'actions bas : `★ 36` (favoris), `💬 4` (commentaires), `↗` (partage), `⬇` (download), `⋯` (menu edit/delete/définir comme image de partage social — droits inchangés).
- Réactions emoji existantes (`AlbumItemReactions`) intégrées dans cette barre.

**Galerie & Favoris** réutilisent `MediaGrid` + `MediaTile` (mêmes hover/réactions, mêmes métriques) avec une `SearchBar` en haut (filtre `caption`, `uploader_name`, `event_kind`).

### 4. Upload contextuel
- Depuis Événements, l'upload pré-remplit `event_kind` et impose `media_type` selon le sous-onglet actif.
- Depuis Galerie, `event_kind` reste NULL (élément non rangé).
- Validation : sous-types Mariage/Réussite obligent à choisir un sous-type avant envoi.

### 5. Migration progressive
- Les items existants gardent `event_kind = NULL` → apparaissent dans Galerie. Aucune perte.
- Un bouton « Classer dans un événement » apparaît sur les tuiles dont l'utilisateur est propriétaire pour les ranger a posteriori.

### 6. Détails techniques

- Tracking de vue : appel `rpc('record_photo_view', { photo_id })` à l'ouverture de la lightbox, dédupliqué par `localStorage` côté client + contrainte unique `(photo_id, viewer_id|fingerprint, date_trunc('day', viewed_at))` côté DB.
- Pré-chargement vidéo : `<video preload="metadata" poster={video_thumbnail_url}>` dans les tuiles, autoplay muet uniquement dans la lightbox (cohérent avec `CoverVideoCarousel`).
- Accessibilité : focus trap dans la lightbox, alt = `caption || uploader_name`, tailles tactiles ≥ 44 px.
- Tokens design : conserver `--primary`, `--secondary`, `--shadow-card`. Soulignement d'onglet actif = `border-primary` (jamais `border-blue-500`).
- Aucune modification de logique métier hors album : réactions, partage social, OG cache restent câblés comme aujourd'hui.

### Livrables
1. Migration SQL (colonnes + 2 tables + RLS + RPC + trigger).
2. `src/components/birthday/album/` (10 fichiers ci-dessus).
3. Hooks `useAlbumUpload`, `useAlbumReactions`, `useAlbumFavorites`, `usePhotoViewTracking`.
4. Branchement dans `BirthdayPage.tsx` ; suppression progressive de `BirthdayAlbum.tsx` après vérif.
5. QA visuelle dans le preview à 758×588 (mobile-first).