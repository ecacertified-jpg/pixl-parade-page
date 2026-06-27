## 1. Photos de profil uploadables sur la page d'événement

Sur `EventHeroOverlay` (mariage et événements solo), rendre les avatars cliquables **uniquement pour le propriétaire** (`isOwner`).

- **Avatar principal (créateur)** : clic → ouvre le `EditAvatarModal` existant qui upload dans le bucket `avatars` et met à jour `profiles.avatar_url`. Le `creatorProfile` local est mis à jour via le callback `onAvatarUpdate`.
- **Avatar du/de la conjoint·e (mariage)** : clic → ouvre un nouveau composant léger `SpouseAvatarUploader` (réutilise la logique de `EditAvatarModal` : caméra + upload fichier, max 5 Mo). Upload dans `avatars/<creator_id>/spouse-<timestamp>.<ext>` puis `UPDATE event_pages SET spouse_avatar_url = ... WHERE id = page.id`. Met à jour le state local `page`.
- **Indication visuelle** : si `isOwner`, un petit badge caméra (icône `Camera` Lucide, fond `bg-primary` rond, ring blanc) s'affiche en bas à droite de chaque `Avatar`. Curseur `cursor-pointer` + `aria-label` "Modifier la photo".
- **Visiteurs** : aucun changement — avatars purement décoratifs.

Props ajoutées à `EventHeroOverlay` : `isOwner: boolean`, `pageId: string`, `onCreatorAvatarChange(url)`, `onSpouseAvatarChange(url)`. `EventPage.tsx` câble ces callbacks pour mettre à jour `creatorProfile` et `page`.

## 2. Style « Terminé » distinctif dans `EventCountdown`

Aujourd'hui « ✅ Terminé » utilise la même pilule discrète que le compte à rebours actif. À remplacer par une variante dédiée :

- Fond : `bg-gradient-to-r from-primary to-accent` (gradient violet de la marque) avec `shadow-soft`.
- Texte : `text-white` (sur dégradé, donc OK), font Poppins **bold** `text-base md:text-lg`, tracking légèrement large.
- Forme : pilule plus haute (`px-5 py-2.5`), bord blanc semi-transparent `border border-white/30`.
- Icône : remplacer l'emoji par `<Check className="h-4 w-4" />` (Lucide) + libellé « Événement terminé » pour qu'il se distingue du « 🎉 C'est aujourd'hui ! » (qui reste, mais reçoit aussi son propre traitement : gradient `from-celebration to-accent`).
- Animation : `motion` avec léger `scale` initial 0.9 → 1 pour le faire ressortir à l'apparition.

Aucun changement de logique (seuil 48 h, "Dans X jours", HH:MM:SS) — uniquement les classes de présentation des deux états terminaux.

## Fichiers touchés

- `src/components/event/EventHeroOverlay.tsx` — avatars cliquables + badge caméra + props owner.
- `src/components/event/SpouseAvatarUploader.tsx` *(nouveau)* — modal d'upload pour le conjoint.
- `src/pages/EventPage.tsx` — passe `isOwner`, `pageId`, callbacks à `EventHeroOverlay`.
- `src/components/EventCountdown.tsx` — nouveau styling pour les états « Terminé » et « Aujourd'hui ».

Aucune migration DB nécessaire (la colonne `spouse_avatar_url` et le bucket `avatars` existent déjà ; RLS sur `event_pages` autorise déjà le créateur à update sa page).
