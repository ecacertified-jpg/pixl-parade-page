
# Module "Célébrer" — Plan d'implémentation

Module émotionnel pour faire ressentir l'amour, livré en 4 lots fonctionnels avec un hub global `/celebrer` **et** intégration contextuelle dans les pages anniversaires/événements existantes.

---

## Lot 1 — Fil de célébrations (cœur social)

**Données (nouvelles tables)**
- `celebration_posts` — publication dédiée célébration : `author_id`, `target_user_id` ou `target_contact_id`, `page_type` ('birthday'|'event'|'standalone'), `page_id`, `kind` ('text'|'photo'|'video'|'tribute'|'card'), `content`, `media_urls jsonb`, `music_track_id`, `is_premium`, `is_pinned`, `visibility`
- `celebration_reactions` — `post_id`, `user_id`, `emoji` (❤️🎉🙏👏🔥😍)
- `celebration_wall_messages` — mur de messages dédié (texte + audio court optionnel), avec `is_vip`
- `celebration_post_views` — comptage pour mise en avant

RLS : auteur écrit/édite/supprime ; lecture publique si page publique ; réactions/messages auth-only.

**UI**
- `src/pages/Celebrer.tsx` — feed global trié par fraîcheur + score d'engagement
- `src/components/celebrate/CelebrationFeed.tsx`, `CelebrationCard.tsx`, `ReactionBar.tsx`, `MessageWall.tsx`, `ComposerSheet.tsx`
- Intégration : nouvelle section "Célébrer" dans `BirthdayPage.tsx` et `EventPage.tsx` (au-dessus des artisans, après la bannière urgente)

---

## Lot 2 — Médias enrichis & montage auto

**Photos/vidéos**
- Réutilise les buckets existants `birthday-photos` / `event-photos` ; ajoute bucket `celebration-media` pour le hub global
- Composant `MediaUploader` accepte image + vidéo courte (≤ 30 s)
- Lecteur vidéo inline avec autoplay muet

**Vidéo hommage**
- Type de post `kind='tribute'` : 1 vidéo principale + dédicace texte + musique de fond

**Montage émotionnel automatique (client-side)**
- `src/components/celebrate/AutoMontage.tsx` (Framer Motion)
- Sélection auto des 8-12 meilleures photos d'une page (par vues/réactions), enchaînement Ken Burns + crossfade
- Piste audio sélectionnable depuis `celebration_music_tracks` (table seedée avec ~10 morceaux libres de droits hébergés en storage)
- Bouton "Lancer le montage" + mode plein écran ; pas d'export vidéo en V1

---

## Lot 3 — Premium & monétisation émotionnelle

**Tables**
- `celebration_premium_cards` — catalogue de cartes premium (designs animés, prix XOF)
- `celebration_digital_gifts` — catalogue cadeaux numériques (bouquet animé, feu d'artifice, etc.)
- `celebration_purchases` — `buyer_id`, `target_post_id`/`target_user_id`, `item_type`, `item_id`, `amount`, `wave_tx_ref`, `status`
- `celebration_vip_badges` — badge actif par utilisateur, niveau, expiration
- `celebration_boosts` — mise en avant publique d'un post (durée, portée)

**Paiement** : réutilise l'intégration Wave existante (lien manuel + validation admin), conforme à la mémoire `wave-payment-integration`.

**UI**
- `PremiumCardPicker`, `DigitalGiftPicker`, `BoostDialog`, badge VIP affiché sur l'avatar
- Section "À la une" dans `/celebrer` alimentée par les posts boostés

---

## Lot 4 — Lives

**Choix technique requis** : LiveKit Cloud (recommandé, SDK React mature, free tier) OU Mux Live OU Agora.
Si non décidé maintenant, ce lot reste en stub.

**Tables**
- `celebration_lives` — `host_id`, `target_page_id`, `title`, `status` ('scheduled'|'live'|'ended'), `started_at`, `ended_at`, `viewer_peak`, `recording_url`
- `celebration_live_messages` — chat live
- `celebration_live_viewers` — présence

**Edge functions**
- `create-live-room` — génère token serveur (clé API du provider en secret)
- `join-live-room` — token viewer
- Webhook provider → met à jour `status` + `recording_url`

**UI**
- `LiveStudio.tsx` (host), `LiveViewer.tsx`, badge "EN DIRECT" rouge clignotant dans le feed, notifications WhatsApp aux amis quand un live démarre

---

## Navigation & accès

- Route `/celebrer` ajoutée à `App.tsx`, item dans la bottom-nav mobile (icône ✨)
- Onglet "Célébrer" dans `BirthdayPage` et `EventPage` (à côté de Album, Messages, Cagnotte)
- SEO : meta title/description FR, JSON-LD Event pour les lives programmés

---

## Détails techniques

- **Stockage** : 3 nouveaux buckets publics `celebration-media`, `celebration-music`, `celebration-cards` (visuels des cartes premium)
- **Realtime** : abonnements `postgres_changes` sur `celebration_posts`, `celebration_reactions`, `celebration_live_messages` (cleanup obligatoire dans useEffect)
- **Notifications WhatsApp** : nouveau template pour "X a publié une célébration pour toi" + "Live de X commence" (respecte le routage WA-first existant)
- **Sécurité** : RLS sur toutes les tables, GRANTs explicites, edge functions valident JWT via Authorization header
- **Migrations** : ~5-6 migrations séquentielles (1 par lot + seeds musique/cartes)

---

## Ordre de livraison suggéré

1. **Lot 1** (fil + mur + réactions) — base sociale, débloque tout le reste
2. **Lot 2** (médias + montage auto musical) — différenciateur émotionnel principal
3. **Lot 3** (premium) — monétisation, dépend d'un catalogue à définir avec toi
4. **Lot 4** (lives) — dépend du choix de provider

## Questions ouvertes à trancher avant build

- **Provider Live** : LiveKit / Mux / Agora ?
- **Catalogue premium** : tu fournis les visuels/prix des cartes & cadeaux numériques, ou je propose un catalogue de démarrage ?
- **Musiques** : tu as une banque audio ou je sélectionne ~10 morceaux libres de droits ?
- Démarre-t-on directement par **Lot 1 + Lot 2** pour valider l'expérience, puis on enchaîne Premium et Lives ?
