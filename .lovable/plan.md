
# Mur de messages "cartes" sur la page d'anniversaire

Remplacer le formulaire texte actuel par un mur de cartes auquel inscrits et visiteurs peuvent contribuer via un bouton **« Nouveau post »** qui ouvre un éditeur multi-média (GIFs GIPHY, emoji, cartes JDV, image, vocal 15s, YouTube, texte animé), avec filtre IA automatique.

## Expérience utilisateur

**Mur de messages** (remplace l'actuel)
- Header : `❤️ Messages d'anniversaire (N)` + bouton **« Nouveau post »** bien visible
- Recherche + tri (récent / ancien / coup de cœur)
- Cartes empilées en colonne mobile-first : avatar + nom + horodatage FR, média principal, texte, ❤️ + bouton signaler
- Propriétaire de la page + admins : bouton supprimer

**Modal « Créer ma carte »** avec onglets swipables
1. GIFs (recherche GIPHY)
2. Emoji
3. Cartes & Mèmes JDV (bibliothèque admin)
4. Stickers animés
5. Texte animé (GIPHY)
6. YouTube (embed iframe)
7. Upload image (max 5 Mo, compressée)

Sous les onglets : zone texte (500 car, emoji), sélecteur de ton (Joyeux / Tendre / Humour / Solennel) + **« Suggérer un message ✨ »** (Lovable AI gemini-3-flash-preview), checkbox vocal 15s (MediaRecorder), champs visiteur Prénom + Téléphone WhatsApp si non connecté.

**Visiteurs non inscrits** : pas de mur d'auth, identification minimale Prénom + téléphone validé (réutilise `PhoneInput`). Téléphone hashé (SHA-256 + salt) côté DB, jamais affiché. Après publication : CTA discret « Crée ton compte JDV ».

**Modération** : avant insert, edge function classe `safe | borderline | unsafe` via Lovable AI. `safe` publié, `borderline` visible avec flag (masquable par le célébré), `unsafe` rejeté. Signalement → file admin existante.

## Détails techniques

**Migration DB**
- Étendre `birthday_wishes_messages` (pas dupliquer) : `media_type`, `media_url`, `media_metadata` jsonb, `audio_url`, `card_template_id`, `visitor_first_name`, `visitor_phone_hash`, `visitor_phone_country`, `tone`, `moderation_status` (défaut `safe`), `moderation_reason`, `reactions_count`, `is_hidden`
- Nouvelle table `birthday_card_templates` (id, category, title, image_url, is_active, display_order, country)
- Bucket Storage `birthday-message-media` (public read, write via edge function)
- RLS : SELECT public où `is_hidden=false AND moderation_status<>'unsafe'`, INSERT via edge function uniquement, UPDATE/DELETE propriétaire+admins ; templates lisibles si actifs, écritures admin

**Edge functions** (verify_jwt=false, validation Zod, modération IA inline, hash téléphone)
- `post-birthday-message` — créer un message (upload audio le cas échéant)
- `suggest-birthday-message` — générer texte selon ton+prénom+occasion
- `giphy-search` — proxy GIPHY (garde la clé côté serveur), cache 5 min

**Frontend**
- `src/components/birthday/messages/` : `MessageWall.tsx`, `MessageCard.tsx`, `NewPostModal.tsx`, sous-onglets (`GiphyTab`, `EmojiTab`, `CardsTab`, `AnimatedTextTab`, `YoutubeTab`, `ImageUploadTab`), `VoiceRecorder.tsx`, `VisitorIdentityFields.tsx`, `ToneSelector.tsx`
- Hooks : `useBirthdayMessages.ts` (fetch + realtime + insert), `useGiphy.ts`
- Admin : `src/pages/Admin/AdminBirthdayCardTemplates.tsx` (CRUD bibliothèque cartes)
- Branchement dans `BirthdayPage.tsx` (remplace le bloc actuel)

**Libs à ajouter** : `emoji-picker-react`

**Secrets** : `GIPHY_API_KEY` et `VISITOR_PHONE_SALT` ✅ déjà configurés

**Langue** : 100% FR (UI, prompts IA, catégories)

## Hors scope
- Réactions multiples (uniquement ❤️ pour v1)
- Threads / réponses
- Notification WhatsApp au célébré à chaque message
- Export PDF du mur

## Ordre d'exécution
1. Migration DB (table étendue + templates + bucket + RLS)
2. Edge functions (`post-birthday-message`, `suggest-birthday-message`, `giphy-search`)
3. Hooks (`useBirthdayMessages`, `useGiphy`) + composants visiteur/ton/vocal
4. Modal `NewPostModal` + 7 onglets
5. Refonte rendu mur (`MessageWall` + `MessageCard`) et branchement `BirthdayPage`
6. Page admin bibliothèque de cartes
7. QA navigateur (visiteur, inscrit, GIPHY, vocal, modération)
