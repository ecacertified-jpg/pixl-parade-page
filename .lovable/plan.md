# Module "Inspiration" — Anniversaire / Événement

## Objectif
Ajouter un bouton icône **Inspiration** sur la vidéo de couverture (entre "Mes coulisses" et "Partage") des pages anniversaire ET événement. Il ouvre une modale multi-onglets où utilisateurs (et admins) peuvent publier vidéos / images / textes, chaque publication générant un lien de partage social qui ré-ouvre l'élément dans une modale sur la page cible.

## Arborescence des catégories
4 onglets → sous-rubriques (fixes) :
1. **Divertissement** — films, musique, spectacles, people
2. **Astuces** — beauté, cuisine, autres
3. **Conseils** — bien-être, santé, business, motivation
4. **Formations** — diplôme, certification, autres

## Base de données (migration)

### Table `inspiration_items`
Champs métier : `page_kind` ('birthday' | 'event' | 'global'), `page_id` (nullable pour global/admin), `author_id`, `is_admin_post` (bool), `category` (enum 4 valeurs), `subcategory` (text), `media_type` ('video' | 'image' | 'text'), `media_url`, `thumbnail_url`, `title`, `body`, `share_token` (unique, court), `is_active`, `views_count`, `shares_count`.

- **GRANT** SELECT anon+authenticated ; INSERT/UPDATE/DELETE authenticated ; ALL service_role.
- **RLS** :
  - SELECT : `is_active = true` visible à tous (nécessaire pour deep-link partagé).
  - INSERT : `auth.uid() = author_id` ; posts admin (`is_admin_post = true` + `page_kind='global'`) réservés via `has_role(auth.uid(),'super_admin' | 'regional_admin')`.
  - UPDATE/DELETE : auteur OU admin.
- Trigger `updated_at`, génération auto de `share_token` (10 chars base62).

### Bucket storage `inspiration-media` (public)
Policies : upload authenticated, lecture publique.

## Frontend utilisateur

### Composants
- `src/components/inspiration/InspirationButton.tsx` — icône `Lightbulb` dans `CoverVideoCarousel` via nouveau prop `onInspirationClick` (placé entre Coulisses et Share).
- `src/components/inspiration/InspirationModal.tsx` — Dialog avec `Tabs` (4 catégories) + sous-onglets `Tabs` internes. Grille type TikTok (thumbnails vidéo, images, cartes texte). Bouton "+ Publier".
- `src/components/inspiration/InspirationComposer.tsx` — form (catégorie, sous-catégorie, type média, upload, titre/texte).
- `src/components/inspiration/InspirationItemCard.tsx` — vignette + bouton partage (copie `https://joiedevivre-africa.com/{page_kind}/{slug}?inspiration={share_token}` + Web Share API).
- `src/components/inspiration/InspirationDetailModal.tsx` — lecture plein écran (vidéo autoplay/mute, image, texte), compteur vues.

### Hook
- `src/hooks/useInspirationItems.ts` — fetch par `page_kind`+`page_id` **UNION** posts admin globaux (`page_kind='global'`), filtres catégorie/sous-catégorie, création, suppression, incrément vues/partages via RPC.

### Intégration pages
- `src/pages/BirthdayPage.tsx` et `src/pages/EventPage.tsx` :
  - Passer `onInspirationClick` au `CoverVideoCarousel`.
  - Monter `<InspirationModal pageKind="birthday|event" pageId={page.id} />`.
  - Lire `?inspiration=<token>` dans l'URL → ouvrir `InspirationDetailModal` automatiquement au chargement (fetch par token).

## Admin

### Page `src/pages/Admin/AdminInspiration.tsx`
- Onglet dans la nav admin (route `/admin/inspiration`, permission `manage_content`).
- Liste + filtres (catégorie, type, statut).
- CRUD publications admin (`is_admin_post=true`, `page_kind='global'`) — s'affichent sur TOUTES les pages anniversaire/événement.
- Bouton partage identique (le lien renvoie vers la homepage de l'utilisateur ? → clarification : on ouvrira sur la page anniversaire courante du destinataire ; à défaut de destination, le lien pointe vers `/inspiration/{share_token}` qui redirige vers une page publique dédiée).
- Modération : désactiver posts utilisateurs.

## Partage type TikTok
- Chaque item a `share_token`. URL générée :
  - Post utilisateur → `https://<domain>/{birthday|event}/{slug}?inspiration={token}`
  - Post admin global → même URL depuis la page où l'utilisateur clique partager.
- Bouton "Partager" : copie le lien + ouvre `navigator.share` si dispo, sinon toast + boutons WhatsApp / Facebook / X.

## Détails techniques
- Compression image existante (`compressImage.ts`), génération thumbnail vidéo (`videoThumbnails.ts`).
- Quota : intégrer avec `useQuota` existant (nouveau `feature: 'inspiration_post'`, plans gratuits limités, sinon CTA upgrade déjà en place).
- i18n : libellés français.
- Analytics : `views_count`, `shares_count` incrémentés via RPC `SECURITY DEFINER`.

## Fichiers créés / édités
**Créés**
- migration SQL (`inspiration_items` + bucket + RLS + RPC)
- `src/hooks/useInspirationItems.ts`
- `src/components/inspiration/{InspirationButton,InspirationModal,InspirationComposer,InspirationItemCard,InspirationDetailModal}.tsx`
- `src/pages/Admin/AdminInspiration.tsx`
- (option) `src/pages/InspirationRedirect.tsx` pour tokens orphelins

**Édités**
- `src/components/birthday/CoverVideoCarousel.tsx` (nouveau prop + bouton)
- `src/pages/BirthdayPage.tsx`, `src/pages/EventPage.tsx`
- `src/App.tsx` (routes admin + redirect)
- Nav admin (ajout entrée "Inspiration")
- `src/features/subscription/featureCatalog.ts` (nouveau feature quota)
