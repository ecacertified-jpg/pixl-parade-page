# Mur de messages "cartes" type Bravoboard sur la page d'anniversaire

## Objectif
Remplacer le formulaire texte simple actuel par un mur de cartes (feed) auquel inscrits et visiteurs peuvent contribuer via un bouton **« Nouveau post »** qui ouvre un éditeur multi-média (GIFs GIPHY, emoji, cartes JDV, image, vocal 15s, YouTube, texte animé), avec filtre IA automatique.

## UX cible

### A. Mur de messages (remplace l'actuel)
- Header : `❤️ Messages d'anniversaire (N)` + bouton vert/accent **« Nouveau post »** (Plus icon)
- Champ recherche + tri (récent / ancien / coup de cœur)
- Cartes empilées en colonne (mobile-first), chacune affichant :
  - Header : avatar + nom expéditeur + horodatage FR
  - Média principal (GIF, image, vidéo YouTube embed, lecteur audio, ou carte animée)
  - Texte du message (markdown léger, emoji)
  - Footer : ❤️ réaction + bouton signaler (⋯)
- Propriétaire de la page + admins : bouton supprimer

### B. Modal « Créer ma carte » (déclenché par Nouveau post)
Onglets swipables horizontalement (header type Bravoboard « Swipe for more →ֆ ») :
1. **GIFs** — recherche GIPHY temps réel + grille
2. **Emoji** — picker emoji (lib `emoji-picker-react`)
3. **Cartes & Mèmes** — bibliothèque cartes JDV (catégories : Anniversaire / Merci / Adieu) gérée par admin
4. **Stickers animés** — stickers GIPHY
5. **Texte animé** — input texte → GIF stylisé via GIPHY animated text endpoint
6. **YouTube** — coller URL → embed iframe
7. **Upload image** — image personnelle (max 5 Mo, compressée)

Sous les onglets :
- Zone texte « Votre message ✨ » (multi-lignes, max 500 car, emoji picker intégré)
- Sélecteur de ton (« Choisir un ton » : Joyeux / Tendre / Humour / Solennel) + bouton **« Suggérer un message ✨ »** qui appelle Lovable AI pour générer un texte adapté au ton + occasion + prénom célébré
- Checkbox **« Ajouter un message vocal (max 15s) »** → contrôles micro/stop/replay/play
- Champs d'identification visiteur (si non connecté) : Prénom + Téléphone WhatsApp (validation regional)
- Boutons : **Publier** (gradient primary) | **Annuler**
- Disclaimer : « ✨ Le contenu généré par IA peut contenir des erreurs. »

### C. Visiteurs non inscrits
- Pas de mur d'auth pour poster
- Identification minimale : Prénom + Téléphone WhatsApp validé (réutilise `useRegionalPhoneFormat`)
- Téléphone stocké chiffré côté DB (jamais affiché publiquement, conforme mémoire « Profile visibility »)
- Après publication réussie : toast + CTA discret « Crée ton compte JDV pour gérer tes messages » (lien `/auth?invited=true&from_message=<id>`)

### D. Modération
- Avant insertion DB : edge function `moderate-birthday-message` appelle Lovable AI (gemini-3-flash-preview) avec un prompt FR pour classer le contenu (`safe` / `borderline` / `unsafe`)
- `safe` → publication immédiate
- `borderline` → publication + flag `pending_review` (visible au célébré qui peut masquer)
- `unsafe` → rejet avec message explicatif
- Bouton signaler sur chaque carte alimente une file admin existante (`reported_*` pattern)

## Architecture technique

### Base de données (migration)
Étendre la table existante `birthday_wishes_messages` (ne pas dupliquer) :
- `media_type` text : `text | gif | sticker | card | emoji | image | youtube | audio | animated_text`
- `media_url` text (URL GIPHY, YouTube ID, storage URL)
- `media_metadata` jsonb (giphy_id, dimensions, duration, thumbnail)
- `audio_url` text (storage)
- `card_template_id` uuid (FK optionnelle vers nouvelle table)
- `visitor_first_name` text (visiteur anonyme)
- `visitor_phone_hash` text (hash téléphone, jamais en clair)
- `visitor_phone_country` text (CI/SN/BJ…)
- `tone` text (joyeux / tendre / humour / solennel)
- `moderation_status` text default `safe` (`safe | pending_review | unsafe`)
- `moderation_reason` text
- `reactions_count` integer default 0
- `is_hidden` boolean default false

Nouvelle table `birthday_card_templates` (admin gère) :
- `id`, `category` (anniversaire / merci / adieu), `title`, `image_url`, `is_active`, `display_order`, `country` (optionnel pour adaptation locale)

Nouveau bucket Storage : `birthday-message-media` (public read, write contrôlé via edge function)

RLS :
- SELECT public sur `birthday_wishes_messages` où `is_hidden=false AND moderation_status != 'unsafe'`
- INSERT via edge function uniquement (validation visiteur + modération)
- UPDATE/DELETE : propriétaire de la page + admins
- `birthday_card_templates` : SELECT public sur `is_active=true`, écritures admin only

### Edge functions
1. **`post-birthday-message`** (verify_jwt=false)
   - Body : `{ slug, message_text, media_type, media_url, media_metadata, audio_base64?, tone?, visitor?: { first_name, phone } }`
   - Validation Zod stricte
   - Si audio_base64 : upload bucket
   - Hash téléphone visiteur (SHA-256 + salt env)
   - Appelle modération IA inline
   - INSERT via service role
   - Retourne le message créé + statut modération
2. **`suggest-birthday-message`** (verify_jwt=false avec rate limit)
   - Body : `{ first_name, tone, occasion: 'anniversaire' }`
   - Appelle Lovable AI gemini-3-flash-preview avec prompt FR
   - Retourne texte généré
3. **`giphy-search`** (proxy, garde la clé API côté serveur)
   - Body : `{ query, type: 'gif'|'sticker'|'text', limit }`
   - Cache léger (5 min) par requête

### Composants frontend
- `src/components/birthday/messages/MessageWall.tsx` — orchestrateur, remplace l'ancien JSX dans `BirthdayPage.tsx`
- `src/components/birthday/messages/MessageCard.tsx` — affichage d'une carte
- `src/components/birthday/messages/NewPostModal.tsx` — modal racine avec onglets swipables
- `src/components/birthday/messages/tabs/GiphyTab.tsx`
- `src/components/birthday/messages/tabs/EmojiTab.tsx`
- `src/components/birthday/messages/tabs/CardsTab.tsx`
- `src/components/birthday/messages/tabs/AnimatedTextTab.tsx`
- `src/components/birthday/messages/tabs/YoutubeTab.tsx`
- `src/components/birthday/messages/tabs/ImageUploadTab.tsx`
- `src/components/birthday/messages/VoiceRecorder.tsx` — vocal 15s (MediaRecorder API)
- `src/components/birthday/messages/VisitorIdentityFields.tsx`
- `src/components/birthday/messages/ToneSelector.tsx`
- `src/hooks/useBirthdayMessages.ts` — fetch + realtime + insert
- `src/hooks/useGiphy.ts` — recherche via proxy edge function
- `src/pages/Admin/AdminBirthdayCardTemplates.tsx` — CRUD bibliothèque cartes

### Secrets requis (à demander à l'utilisateur après approbation)
- `GIPHY_API_KEY` (clé gratuite sur developers.giphy.com)
- `VISITOR_PHONE_SALT` (string aléatoire pour hash)

### Langue
- 100% FR dans tous les libellés UI (« Nouveau post », « Suggérer un message », « Ajouter un message vocal », « Publier », etc.)
- Prompts IA en FR
- Catégories cartes en FR

## Hors scope
- Réactions multiples (uniquement ❤️ pour cette v1)
- Threads / réponses sur une carte
- Notification WhatsApp au célébré à chaque message (sera ajouté plus tard si demandé)
- Export du mur en PDF

## Plan d'exécution
1. Migration DB (table étendue + templates + bucket + RLS)
2. Demande secrets GIPHY + salt
3. Edge functions (post, suggest, giphy-search, moderate)
4. Hooks et composants visiteurs/identité
5. Modal Nouveau post avec onglets (GIFs, Emoji, Cartes, Texte animé, YouTube, Upload, Vocal)
6. Refonte du rendu mur (`MessageCard` + `MessageWall`) et branchement dans `BirthdayPage.tsx`
7. Page admin pour gérer la bibliothèque de cartes
8. QA navigateur : poster en visiteur, en inscrit, tester GIPHY, vocal, modération
