

# Héberger les vidéos de célébration dans Supabase Storage

## Solution

Créer un bucket dédié `birthday-videos` dans Supabase Storage pour stocker les vidéos MP4 de célébration. Ces vidéos seront publiques (accessibles via URL directe par l'API WhatsApp de Meta).

## Étapes

### 1. Créer le bucket `birthday-videos`

Migration SQL pour créer le bucket public avec les politiques RLS appropriées :
- Bucket **public** (Meta doit pouvoir accéder à l'URL directement)
- Lecture publique pour tous
- Upload/delete réservé aux admins uniquement

### 2. Mettre à jour `birthday-wishes/index.ts`

Remplacer la référence à `BIRTHDAY_CELEBRATION_VIDEO_URL` par une construction d'URL vers le bucket :
```
https://vaimfeurvzokepqqqrsl.supabase.co/storage/v1/object/public/birthday-videos/default-celebration.mp4
```

L'edge function cherchera d'abord une vidéo personnalisée (`{user_id}.mp4`), sinon utilisera `default-celebration.mp4`.

### 3. Workflow d'utilisation

1. Uploader une vidéo MP4 générique dans `birthday-videos/default-celebration.mp4` via le dashboard Supabase Storage
2. Optionnellement, uploader des vidéos personnalisées par utilisateur (`birthday-videos/{user_id}.mp4`)
3. L'edge function construit l'URL publique et la passe à `sendWhatsAppTemplate` via `headerVideoUrl`

### Contraintes Meta rappelées
- MP4 uniquement, max **16 Mo**, durée < 30s recommandée, 720p minimum
- L'URL doit être **publiquement accessible** sans authentification

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Créer bucket `birthday-videos` + politiques RLS |
| `supabase/functions/birthday-wishes/index.ts` | Construire l'URL vidéo depuis le bucket au lieu d'une variable d'environnement |

