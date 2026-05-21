# Vidéos de couverture animées sur la page d'anniversaire

## Objectif
Transformer l'en-tête de `/birthday/:slug` en un espace vidéo immersif qui crée de l'émotion :
- défilement automatique de vidéos contextuelles (salutation du jour, fêtes calendaires, anniversaire)
- son activé par défaut, plein écran au tap
- overlay style profil social : photo de profil + Prénom + âge + compte à rebours

## 1. Bibliothèque de vidéos de couverture

### 1a. Vidéos par défaut (admin)
Nouveau bucket / dossier `assets/cover-videos/` (bucket `assets` existant) contenant les MP4 fournis par les admins.

Nouvelle table `cover_video_library` :
- `id`, `title`, `video_url`, `poster_url` (thumbnail)
- `schedule_kind` enum : `greeting_morning` | `greeting_afternoon` | `greeting_evening` | `greeting_night` | `calendar_event` | `birthday_day`
- `calendar_month`, `calendar_day` (nullable, pour Noël 12/25, St-Valentin 02/14, Pâques calculé, Fête des mères, Nouvel An…)
- `priority` (int, pour l'ordre)
- `is_active`
- RLS : lecture publique (authenticated + anon), écriture admin via `has_role(admin)`

### 1b. Vidéos personnalisées (utilisateur)
Nouvelle table `birthday_page_cover_videos` :
- `id`, `birthday_page_id` (FK), `user_id`
- `video_url`, `poster_url`
- `schedule_kind` (même enum, l'utilisateur choisit le créneau)
- `display_order`, `created_at`
- RLS : propriétaire CRUD ; lecture publique si la page est `is_active`

Les vidéos perso d'un créneau **remplacent** les vidéos défaut du même créneau ; sinon fallback admin.

### 1c. Page Admin
Nouvelle entrée `/admin/cover-videos` (sous `AdminLayout`) :
- upload MP4 vers `assets/cover-videos/`, génération auto du poster (1ʳᵉ frame via `extractSingleThumbnail`)
- formulaire schedule_kind + date calendaire
- liste / activation / suppression

## 2. Composant `CoverVideoCarousel`

Nouveau `src/components/birthday/CoverVideoCarousel.tsx` :
- Hook `useCoverVideoPlaylist(birthdayPageId, birthdayDate)` :
  - Détecte le contexte temporel local du visiteur :
    - 05–11h → `greeting_morning`
    - 12–17h → `greeting_afternoon`
    - 18–21h → `greeting_evening`
    - 22–04h → `greeting_night`
  - Détecte les fêtes calendaires actives (j ±1 autour de la date)
  - Si aujourd'hui = date d'anniversaire → insère les vidéos `birthday_day` en tête
  - Construit la playlist : `[birthday_day?, calendar_event?, greeting]` (vidéos perso prioritaires)
- Lecture : `<video autoPlay playsInline>` avec **son activé**.
  - iOS bloque l'autoplay audio : fallback `muted` + bouton "🔊 Activer le son" (tap-to-unmute) visible 1ʳᵉ vue, mémorisé dans `localStorage`.
- Avance auto à la fin de chaque vidéo (`onEnded`) avec fondu enchaîné. Durée min 6 s / max 20 s.
- Tap → ouvre une modale plein écran (Dialog) avec contrôles natifs.
- Indicateurs de progression style stories en haut.

## 3. Overlay profil-style

Remplace l'overlay actuel (titre centré + countdown) par un bandeau bas-gauche inspiré de la capture :
- Avatar rond (photo de profil utilisateur, fallback initiales) avec liseré blanc.
- À droite de l'avatar :
  - **Prénom + âge** en gros (`{firstName} · {age} ans`)
  - Sous-ligne : `BirthdayCountdown` compact (00 jrs · 00 hrs · 00 min · 00 sec) sur fond pilule glassmorphism.
- Bouton caméra (admin de la page seulement) → ouvre `BirthdayPageBuilderModal` sur l'onglet "Vidéos de couverture".

## 4. Édition utilisateur

Dans `BirthdayPageBuilderModal`, nouvel onglet **Vidéos de couverture** :
- Liste des 6 créneaux (matin / aprèm / soir / nuit / fête / anniversaire)
- Pour chacun : preview vidéo défaut + bouton "Uploader la mienne"
- Upload vers `assets/birthday-pages/{user_id}/cover-videos/`
- Validation : MP4/MOV, ≤ 25 Mo, ≤ 30 s (réutilise `videoValidation.ts`)
- Génération auto du poster

## 5. Intégration `BirthdayPage.tsx`

Lignes 359-393 : remplacer le bloc `cover_image_url` par `<CoverVideoCarousel>` ; déplacer le `<motion.h1>` + countdown vers le nouvel overlay profil. Conserver `cover_image_url` comme **poster du 1ᵉʳ frame** (fallback si aucune vidéo configurée).

## 6. OG / partage
Aucun impact OG : `birthday-preview` continue d'utiliser `cover_image_url` comme image statique (les réseaux ne lisent pas les vidéos en aperçu de toute façon). Le worker Cloudflare reste inchangé.

---

## Détails techniques

**Migrations Supabase :**
1. `CREATE TYPE cover_schedule_kind AS ENUM (...)`
2. Table `cover_video_library` + RLS (lecture anon, écriture admin)
3. Table `birthday_page_cover_videos` + RLS (owner CRUD, public read si page active)
4. Policies storage `assets/cover-videos/*` (admin write) et `assets/birthday-pages/{uid}/cover-videos/*` (owner write, public read)

**Hooks à créer :**
- `useCoverVideoLibrary()` — admin
- `useBirthdayPageCoverVideos(pageId)` — owner + public
- `useCoverVideoPlaylist(pageId, birthday)` — résolution playlist contextuelle

**Considérations perf :**
- `preload="metadata"` pour la suivante, `preload="auto"` pour la courante
- Compression côté upload via `compressVideo` (à ajouter si absent, sinon limiter taille)
- Lazy-load des vidéos hors playlist immédiate

**Considérations UX :**
- Si aucune vidéo n'est disponible (lib admin vide) → fallback image actuelle
- Réduire la hauteur du header sur mobile (`h-56`) → `h-[70vh]` pour l'immersion vidéo
- Bouton mute/unmute toujours accessible, persistant via `localStorage`
