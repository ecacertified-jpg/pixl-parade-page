## 1. Nettoyage — Mur de messages (pages anniv/event uniquement)

Retirer le `<CelebrateWall>` des pages publiques `/birthday/:slug` et `/event/:slug` (les messages d'anniversaire dédiés `MessageWall` restent en place). Le `CelebrateWall` global de `/celebrer` est conservé.

Fichiers ciblés (à ajuster après lecture) : `src/pages/BirthdayPage.tsx`, `src/pages/EventPage.tsx` — retirer l'import + l'usage du composant.

## 2. Mécanismes viraux

### A. Partage TikTok + WhatsApp boostés

Composant `ViralShareBar` (réutilisable sur birthday page, event page, profil public, fund) avec 4 actions :
- **WhatsApp** : `wa.me/?text=` avec message persuasif (utilise déjà la stratégie de copie clipboard existante).
- **TikTok** : deep link simple — copie texte + URL dans le presse-papier puis `window.open('https://www.tiktok.com/upload?lang=fr')` (ou app scheme `snssdk1233://`). Toast "Texte copié, colle-le dans ta vidéo TikTok".
- **Story-ready** : bouton "Télécharger la carte" → génère carte virale (voir B).
- **Lien copié** : fallback universel.

Tracking : chaque share insère dans `business_share_events`-équivalent → nouvelle table `viral_share_events` (channel, page_type, page_id, sharer_user_id, created_at) pour alimenter les classements.

### B. Cartes & vidéos virales auto

- **Carte virale (image)** : edge function `generate-viral-card` réutilise la techno OG (`generate-birthday-og-image` / `generate-og-image`) avec un layout vertical 1080×1920 (story-friendly), photo de profil + prénom + âge/occasion + emoji + watermark "joiedevivre-africa.com". Bucket public `viral-cards`. URL téléchargeable depuis `ViralShareBar`.
- **Vidéo virale (5s)** : edge function `generate-viral-video` qui assemble côté client via Canvas + MediaRecorder (pas de coût AI) — animation simple : carte virale + confettis + musique optionnelle. MVP : version "carte animée" (Lottie/CSS exportée en WebM). Bouton "Vidéo souvenir" dans `ViralShareBar`.

### C. Parrainage + invitations sociales

Le système `referral_codes` + `invitations` existe déjà. Ajouts :
- **Page `/parrainage`** : affiche le code de l'utilisateur, compteur d'invités acceptés, récompenses débloquées (jours premium offerts via `premium_trial_grants`).
- **Composant `InviteFriendsModal`** : sélection multi-contacts → envoi WhatsApp en lot via `wa.me` avec message personnalisé contenant le code referral. Track dans `invitations`.
- **Récompenses** : 3 invités acceptés = 7 jours Premium, 10 = 30 jours. Edge function `award-invitation-rewards` existe — étendre les paliers.

### D. Tendances & classements

- **Page `/tendances`** publique : 
  - "🔥 Anniversaires du jour" (birthday_pages du jour, triées par vues/partages 24h)
  - "🏆 Top célébrations de la semaine" (event_pages + birthday_pages, score = vues+partages+messages)
  - "⭐ Top célébrateurs" (leaderboard `community_scores` existant)
- **Composant `TrendingBadge`** : badge "🔥 Tendance" affiché sur les pages dans le top 10.
- View SQL `viral_trending_pages` qui agrège vues + `viral_share_events` + messages sur 7j.

## 3. Schéma BDD (1 migration)

```sql
CREATE TABLE public.viral_share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','tiktok','clipboard','native','card','video')),
  page_type text NOT NULL CHECK (page_type IN ('birthday','event','profile','fund')),
  page_id uuid,
  page_slug text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.viral_share_events TO authenticated;
GRANT SELECT, INSERT ON public.viral_share_events TO anon;  -- partage visiteur
GRANT ALL ON public.viral_share_events TO service_role;
ALTER TABLE public.viral_share_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can log share" ON public.viral_share_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner can read own" ON public.viral_share_events FOR SELECT USING (sharer_user_id = auth.uid());
CREATE INDEX ON public.viral_share_events (page_type, page_id, created_at DESC);

CREATE OR REPLACE VIEW public.viral_trending_pages AS
SELECT page_type, page_id, COUNT(*) AS share_count_7d
FROM public.viral_share_events
WHERE created_at > now() - interval '7 days'
GROUP BY page_type, page_id;
GRANT SELECT ON public.viral_trending_pages TO anon, authenticated;
```

Bucket Storage public : `viral-cards` (PNG, 5 Mo max).

## 4. Edge functions

- `generate-viral-card` — génère PNG 1080×1920 via React-PDF/satori (déjà utilisé pour OG). Stocke dans `viral-cards/<page_type>/<id>.png`.
- (optionnel V2) `generate-viral-video` — assemblage server-side via ffmpeg-wasm. **Reporté** : MVP côté client.

## 5. Fichiers à créer / éditer

**Créer**
- `src/components/viral/ViralShareBar.tsx`
- `src/components/viral/InviteFriendsModal.tsx`
- `src/components/viral/TrendingBadge.tsx`
- `src/hooks/useViralShare.ts` (log + dispatch)
- `src/hooks/useTrendingPages.ts`
- `src/pages/Tendances.tsx`
- `src/pages/Parrainage.tsx` (ou enrichir `ReferralCodes.tsx` existant)
- `supabase/functions/generate-viral-card/index.ts`
- migration SQL ci-dessus

**Éditer**
- `src/pages/BirthdayPage.tsx` — retirer CelebrateWall, ajouter ViralShareBar + TrendingBadge
- `src/pages/EventPage.tsx` — idem
- `src/App.tsx` — routes `/tendances`, `/parrainage`
- `supabase/functions/award-invitation-rewards/index.ts` — paliers premium

## 6. Hors scope (à confirmer plus tard)
- Profils publics émotionnels enrichis (existent déjà via `public_profiles`)
- Pages événements partageables (déjà existantes, juste boostées par ViralShareBar)
- Vidéo virale server-side (reporté V2)
