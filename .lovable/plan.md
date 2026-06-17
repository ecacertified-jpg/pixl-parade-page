## Module Souvenirs

Route principale: `/souvenirs` (alias `/memories`), accessible depuis le Dashboard.

Source unique des souvenirs en v1: **agrégation automatique** depuis `birthday_pages` + `event_pages` (photos, vidéos, messages audio/texte de l'utilisateur connecté + pages où il est invité). Aucun upload manuel séparé — moins de friction, réutilise tout ce qui existe.

### 1. Hub `/souvenirs` (gratuit)
- Header émotionnel ("Tes plus beaux moments, gardés pour toujours") avec compteur (X souvenirs, Y années).
- **3 onglets**:
  - **Galerie** — grille TikTok-style de toutes les photos/vidéos, tri récent.
  - **Albums** — cartes par page (anniversaire 2024, mariage 2023…), couverture = 1ʳᵉ photo, badge nombre de médias. Clic → page existante `/birthday/:slug` ou `/event/:slug`.
  - **Timeline** — voir §2.
- Filtres: année, type d'occasion (birthday, wedding, baptism…), type de média (photo/vidéo/audio).
- Pas de duplication de stockage: on lit `birthday_page_photos` et `event_page_photos`.

### 2. Timeline émotionnelle (gratuit)
- Vue chronologique verticale par mois, regroupée par occasion.
- Chaque carte: média + nom de l'événement + date relative ("Il y a 2 ans") + chip émotion.
- **Émotion auto-déduite** depuis l'occasion (birthday→joie, wedding→amour, baptism→famille, graduation→fierté, memorial→gratitude). Pas d'IA en v1, mapping statique dans `src/data/memory-emotions.ts`.
- Filtre par émotion (chips horizontales).

### 3. Capsules temporelles (Premium)
- Nouveau bouton "Sceller une capsule" sur le hub.
- Modal: sélectionner ≥1 photo des souvenirs + message texte + date d'ouverture (3 mois à 10 ans) + destinataires (soi-même et/ou amis du cercle).
- Stocké dans une **nouvelle table** `memory_capsules` (scellée jusqu'à `unlock_date`).
- Avant unlock: carte verrouillée avec compte à rebours, contenu chiffré côté DB via RLS (lecture du contenu interdite avant `unlock_date`).
- Le jour J: notification WhatsApp + push "Ta capsule de 2026 s'ouvre aujourd'hui 🎁" → route `/souvenirs/capsule/:id`.
- Cron quotidien `unlock-memory-capsules` qui marque les capsules dues comme `unlocked` et déclenche les notifs.

### 4. Rétrospective annuelle "Mon année" + Livre PDF (Premium)
- Bouton "Génère ma rétro 2026" disponible à partir du 1ᵉʳ décembre, sinon "Voir ma rétro 2025".
- Page `/souvenirs/retrospective/:year`: format stories Wrapped (1 carte plein écran par étape, swipe vertical):
  1. Couverture "Ton année 2025 en souvenirs"
  2. Stats (X moments, Y événements, Z amis présents)
  3. Top 6 photos (par nombre de réactions/favoris)
  4. Mois le plus joyeux
  5. Top occasion
  6. Carte finale partage + bouton "Télécharger le livre PDF"
- Génération PDF côté edge function `generate-memory-book` (reportlab/pdf-lib): couverture, sommaire, 1 page par occasion avec ses photos en grille, messages associés. Stockée dans bucket Storage `memory-books`, lien renvoyé.

### Premium gating
- Gérer via le hook existant `usePlan` / `useQuota`. Free = consultation hub + timeline. Premium = capsules + rétrospective vidéo + livre PDF + archivage >2 ans (filtre serveur).

### Technique

**Migration DB** (une seule):
- Table `memory_capsules`: `id`, `user_id`, `title`, `message`, `media_refs jsonb` (refs vers `birthday_page_photos.id` ou `event_page_photos.id` + type), `unlock_date`, `recipients jsonb` (user_ids), `is_unlocked`, `notified_at`, `created_at`. RLS: créateur lit/modifie; destinataires lisent métadonnées uniquement; contenu (`message`, `media_refs`) lisible seulement si `is_unlocked = true OR user_id = auth.uid()` via vue/colonne calculée. GRANTs `authenticated` + `service_role`.
- Bucket Storage `memory-books` (privé, signed URLs).

**Code (frontend)**:
- `src/pages/Souvenirs.tsx` (hub avec onglets)
- `src/pages/SouvenirsRetrospective.tsx`
- `src/pages/SouvenirsCapsule.tsx`
- `src/components/souvenirs/MemoriesGallery.tsx`, `MemoriesAlbumsGrid.tsx`, `MemoriesTimeline.tsx`, `SealCapsuleModal.tsx`, `CapsuleCard.tsx`, `RetrospectiveStory.tsx`
- `src/hooks/useAggregatedMemories.ts` (fetch + cache react-query des photos/vidéos depuis birthday_pages + event_pages où user est owner ou invité)
- `src/hooks/useMemoryCapsules.ts`
- `src/data/memory-emotions.ts` (mapping occasion→émotion)
- Route ajoutée dans `src/App.tsx` + lien dans Dashboard.

**Code (backend)**:
- Edge function `unlock-memory-capsules` (cron quotidien via pg_cron + pg_net)
- Edge function `generate-memory-book` (génère PDF, upload Storage, retourne signed URL)
- Edge function `notify-capsule-unlock` (WhatsApp + push, appelée par `unlock-memory-capsules`)

**Hors scope v1** (mentionnés dans la demande mais déjà couverts ou reportés):
- Galerie/albums/vidéos souvenirs/archivage cloud → couverts via agrégation des pages existantes.
- Souvenirs privés familiaux → reportés v2 (nécessite cercles famille dédiés).
- Mémoire émotionnelle IA avancée (suggestions de souvenirs à revisiter) → reportée v2.