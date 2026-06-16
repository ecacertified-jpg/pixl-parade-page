## Objectif
Permettre à l'organisateur (propriétaire + co-organisateurs admin) de publier un **message urgent** (avec ou sans date/heure) depuis Mes coulisses. Ce message s'affiche en bannière **rouge clignotante** sur la page publique (anniversaire et événement), juste avant la section "Les artisans de cette célébration", et disparaît automatiquement quand la date saisie est dépassée.

## 1. Base de données (migration)

Nouvelle table polymorphe `event_urgent_messages` (cohérente avec le pattern `(page_type, page_id)` déjà utilisé par le module Organisation) :

- `id`, `page_type` ('birthday' | 'event'), `page_id`
- `message` (text, 1-280 chars)
- `event_at` (timestamptz, nullable) — date/heure de l'événement; si null, le message reste affiché jusqu'à suppression manuelle
- `is_active` (bool, default true)
- `created_by`, `created_at`, `updated_at`

RLS :
- SELECT public : `is_active = true AND (event_at IS NULL OR event_at > now())` — pour que les visiteurs voient la bannière
- INSERT/UPDATE/DELETE : `can_manage_page(auth.uid(), page_type, page_id, 'admin')` (helper existant)

GRANTs : `anon, authenticated` SELECT ; `authenticated` INSERT/UPDATE/DELETE ; `service_role` ALL.

Un seul message actif par page : index unique partiel `(page_type, page_id) WHERE is_active = true` — l'UI remplace l'ancien à l'enregistrement.

## 2. Onglet "Date/Message" dans Mes coulisses

Dans `OrganizationSection` (Sheet à 5 sous-tabs aujourd'hui : Préparatifs, Prestataires, Budget, Invités, Équipe), ajout d'un **6e onglet "Date/Message"** (icône `Megaphone` ou `AlarmClock`).

Composant `UrgentMessageTab.tsx` :
- Textarea (compteur 280)
- Switch "Définir une date/heure" → si activé, datetime-local picker (par défaut: date de l'événement/anniversaire)
- Aperçu live de la bannière (mêmes styles que le rendu public)
- Boutons : Enregistrer / Désactiver
- Hook `useUrgentMessage(pageType, pageId)` (fetch + mutation + realtime optionnel)

## 3. Bannière publique rouge clignotante

Nouveau composant `UrgentMessageBanner.tsx` :
- Fond `bg-destructive` / `text-destructive-foreground`, icône `AlertTriangle`, bord arrondi 2xl, ombre douce
- Animation clignotement subtile (Tailwind `animate-pulse` sur un halo + bordure animée via keyframes ajoutées à `tailwind.config.ts` : `urgent-blink` = opacity 1 ↔ 0.85 / shadow pulse, 1.6s)
- Respect de `prefers-reduced-motion` (désactive le blink)
- Affiche la date/heure formatée FR si `event_at` présent (`format(..., "EEEE d MMMM 'à' HH'h'mm", locale fr)`)
- Auto-hide côté client via un `setInterval` qui compare `event_at` à `now()` (toutes les 30s) en plus du filtre RLS

Intégration :
- `src/pages/BirthdayPage.tsx` — inséré juste avant `<CelebrationArtisansSection ... />`, sous les vidéos de couverture
- `src/pages/EventPage.tsx` — même emplacement

Hook public `usePublicUrgentMessage(pageType, pageId)` (lecture seule, anon-friendly).

## 4. Fichiers touchés

Création :
- `supabase/migrations/<ts>_urgent_messages.sql`
- `src/components/organization/UrgentMessageTab.tsx`
- `src/components/organization/UrgentMessageBanner.tsx`
- `src/hooks/useUrgentMessage.ts`

Édition :
- `src/components/organization/OrganizationSection.tsx` (ajout onglet)
- `src/pages/BirthdayPage.tsx` (insertion bannière)
- `src/pages/EventPage.tsx` (insertion bannière)
- `tailwind.config.ts` (keyframe `urgent-blink`)
- `.lovable/mem/features/organization-module.md` (ajout sous-tab)

## 5. Sécurité & UX
- Aucune donnée sensible : message public assumé
- Modération : seul un admin de la page peut écrire (helper `can_manage_page`)
- Disparition automatique garantie côté RLS **et** côté client
- Mobile-first : bannière pleine largeur, 2 lignes max avec ellipsis + tap pour développer

Pas de changement aux notifications OneSignal ni au Premium trial.
