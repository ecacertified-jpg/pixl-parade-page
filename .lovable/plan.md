

# Plan : Pages d'événements génériques (mariage, baptême, etc.)

## Objectif

Créer un système de pages d'événements génériques réutilisant l'architecture des pages d'anniversaire existantes (album photos/vidéos, vœux, cagnotte), adaptées à différentes occasions : mariage, baptême, fiançailles, diplôme, promotion, etc.

## Architecture

```text
┌─────────────────────────────────┐
│         event_pages             │  ← Nouvelle table (miroir de birthday_pages)
│  occasion, title, slug, ...     │
├─────────────────────────────────┤
│      event_page_photos          │  ← Album photos/vidéos/souvenirs
│      event_wishes_messages      │  ← Vœux des proches
└─────────────────────────────────┘
         │
         ▼
   collective_funds (existant, occasion = 'wedding'/'baptism'/etc.)
```

## Étape 1 — Migration base de données

### Table `event_pages`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| creator_id | uuid FK auth.users | Créateur de la page |
| occasion | text | 'wedding', 'baptism', 'engagement', 'graduation', 'promotion', 'other' |
| title | text | Titre libre (ex: "Mariage de Aya & Koffi") |
| description | text | Description optionnelle |
| slug | text UNIQUE | URL publique |
| cover_image_url | text | Image de couverture |
| event_date | date | Date de l'événement |
| fund_id | uuid FK collective_funds | Cagnotte liée |
| is_active | boolean | Page visible |
| created_at / updated_at | timestamp | Horodatage |

### Table `event_page_photos`
Même structure que `birthday_page_photos` : uploader_id, uploader_name, image_url, caption, media_type ('image'/'video'/'memory'), video_url, video_thumbnail_url, memory_text.

### Table `event_wishes_messages`
Même structure que `birthday_wishes_messages` : sender_id, sender_name, message_text, event_page_id.

### RLS
- Lecture publique pour les pages actives
- CRUD réservé au créateur
- Photos/messages : lecture publique, insertion par les utilisateurs authentifiés

### Bucket storage
- `event-page-photos` (public, même config que `birthday-page-photos`)

## Étape 2 — Page publique `EventPage.tsx`

Nouveau composant `/event/:slug` reprenant la structure de `BirthdayPage.tsx` :

1. **En-tête festif** — emoji et couleur adaptés à l'occasion (💍 mariage, 👶 baptême, 💑 fiançailles, 🎓 diplôme, 💼 promotion)
2. **Section cagnotte** — identique (lien vers collective_funds)
3. **Section vœux** — zone de texte pour écrire un message, liste des vœux existants
4. **Album souvenir** — composant `EventAlbum` (fork léger de `BirthdayAlbum`) : photos, vidéos (max 50MB), souvenirs texte
5. **Bouton flottant de partage** — partage WhatsApp/copie lien
6. **SEO** — méta tags Open Graph, JSON-LD Event schema adaptés

### Mapping occasion → UI
| Occasion | Emoji | Couleur gradient | Titre type |
|----------|-------|------------------|------------|
| wedding | 💍 | rose/doré | "Mariage de X & Y" |
| baptism | 👶 | bleu ciel | "Baptême de X" |
| engagement | 💑 | rose/violet | "Fiançailles de X & Y" |
| graduation | 🎓 | bleu/violet | "Diplôme de X" |
| promotion | 💼 | violet/doré | "Promotion de X" |
| other | 🎊 | multicolore | Titre libre |

## Étape 3 — Page de création `CreateEventPage.tsx`

Formulaire simple accessible depuis l'onboarding (`?occasion=wedding`) ou le dashboard :
- Choix d'occasion (si pas pré-sélectionné)
- Titre, description, date
- Upload image de couverture
- Génération automatique du slug
- Option de créer une cagnotte liée

## Étape 4 — Routing & navigation

| Route | Composant |
|-------|-----------|
| `/event/:slug` | `EventPage` |
| `/event/create` | `CreateEventPage` |
| `/evenement/:slug` | Alias français vers `EventPage` |

Mise à jour de l'onboarding : le bouton "Créer la page de l'événement" navigue vers `/event/create?occasion=X`.

## Étape 5 — Composant `EventAlbum.tsx`

Fork de `BirthdayAlbum` avec :
- Même fonctionnalité (onglets all/image/video/memory)
- Upload vers le bucket `event-page-photos`
- Insertion dans `event_page_photos`
- Props adaptées : `eventPageId` au lieu de `pageId`, vocabulaire adapté

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/migrations/xxx.sql` | Tables event_pages, event_page_photos, event_wishes_messages + RLS + bucket |
| `src/pages/EventPage.tsx` | **Créer** — page publique d'événement |
| `src/pages/CreateEventPage.tsx` | **Créer** — formulaire de création |
| `src/components/EventAlbum.tsx` | **Créer** — album photos/vidéos/souvenirs |
| `src/components/EventPageShareButton.tsx` | **Créer** — modal de partage |
| `src/hooks/useEventPageSEO.ts` | **Créer** — SEO adapté aux événements |
| `src/App.tsx` | **Modifier** — ajouter routes /event/:slug, /event/create, /evenement/:slug |
| `src/components/OnboardingExperience.tsx` | **Modifier** — navigation vers /event/create?occasion=X |

