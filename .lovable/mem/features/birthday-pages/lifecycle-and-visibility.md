---
name: birthday-pages-lifecycle-and-visibility
description: Cycle de vie des pages d'anniversaire, conditions de publication dans le fil et rattachement automatique de la cagnotte
type: feature
---
Une page `birthday_pages` peut exister sans être visible dans le fil d'actualités (`/`).

**Champ `is_active`** : la page est accessible via lien direct (`/birthday/:slug`) — auto-créée par `Dashboard.tsx`, le cron `birthday-wishes` (J-3) et l'onboarding étape 6.

**Champ `published_at`** : NULL = brouillon (invisible dans le fil), TIMESTAMPTZ = publiée (visible dans le fil). Le hook `usePagesFeed.ts` filtre `is_active=true AND published_at IS NOT NULL`.

**Champ `published_via_onboarding`** (boolean, default false) : true uniquement quand la publication provient explicitement de l'action « Créer ma page » (étape 6). Utilisé par `usePagesFeed.ts` pour trier ces pages **prioritairement** dans le fil (juste après les pages de l'utilisateur connecté). Le backfill historique (`is_active AND no content`) a été nettoyé pour éviter les doublons fantômes.

**Publication** : uniquement via l'action explicite « Créer ma page » (étape 6 onboarding, `handleCreateBirthdayPage`) qui pose simultanément `published_at = now()` et `published_via_onboarding = true`. Si la page existe déjà en brouillon, elle est publiée rétroactivement avec ces deux flags.

**Anti-doublons** : index unique partiel `idx_birthday_pages_user_year_active ON birthday_pages (user_id, celebration_year) WHERE is_active = true`. `Dashboard.tsx` et `birthday-wishes` (cron J-3) recherchent désormais TOUTE page existante (active ou non, brouillon ou publiée) pour `user_id + celebration_year` avant tout INSERT, et la réutilisent.

**Rattachement cagnotte → page** : la cagnotte créée à l'étape 2 (`FundPickerModal`) est automatiquement liée à la page via `birthday_pages.fund_id` :
- À la création de la page (étape 6) : `fund_id` est inséré directement si déjà connu.
- Au polling après fermeture de `FundPickerModal` (`checkFundExists`) : `UPDATE` du `fund_id` sur la page existante.
- À l'ouverture de l'onboarding (`useEffect` initial) : réparation rétroactive si page+fund existent mais non liés.
- Backfill SQL exécuté pour relier toutes les cagnottes birthday actives existantes.

Après tout rattachement, `window.dispatchEvent(new Event('feed-refresh'))` est déclenché pour rafraîchir la carte avec la cagnotte visible.

**Étape "Créer ma cagnotte" du builder (BirthdayPageBuilderModal)** : facultative. Détection stricte — la step n'est marquée "Fait" que si `birthday_pages.fund_id` pointe vers une `collective_funds` `status='active'` de l'année courante (plus de match implicite par `creator_id + occasion`). L'utilisateur peut **passer** l'étape (flag `localStorage.bp_fund_skipped_${userId}`), ce qui n'empêche pas Publier/Partager. Quand la cagnotte est créée mais sans contribution (`fund_contributions.count = 0`), trois actions sont disponibles : **Voir / Modifier le montant / Annuler**. Dès qu'une contribution existe, l'édition est verrouillée et seul "Voir" reste accessible.

**Bandeau "Publier ma page" (PublishMyBirthdayPageBanner)** : affiché en haut de la `WhatDoYouWantCard` (page d'accueil) lorsque l'utilisateur connecté a une page brouillon de l'année courante (`is_active=true AND published_at IS NULL`). Un clic sur "Publier" pose `published_at = now()` + `published_via_onboarding = true` (équivalent à l'étape 6 de l'onboarding) et déclenche `feed-refresh`. Cela résout le cas des pages auto-créées par `Dashboard.tsx` ou le cron `birthday-wishes` (J-3) que l'utilisateur n'a jamais explicitement publiées.

**Redirection après inscription depuis un lien partagé** : `Auth.tsx` respecte désormais le paramètre `?redirect=/birthday/:slug` après vérification OTP (WhatsApp et SMS) **et** signup email. Auparavant, le code forçait `/dashboard?onboarding=true` et perdait la destination — l'invité atterrit maintenant directement sur la page d'anniversaire d'origine (avec `?onboarding=true` ajouté pour les nouveaux comptes).

**Modération de l'album souvenir** : la table `birthday_page_photos` et le bucket `birthday-page-photos` ont des politiques RLS dédiées :
- L'**uploader** peut UPDATE (modifier légende ou texte de souvenir) et DELETE ses propres contributions, et supprimer/remplacer ses fichiers storage.
- Le **propriétaire de la page** (`birthday_pages.user_id`) peut DELETE n'importe quelle contribution + le fichier storage associé (modération).
- L'UI `BirthdayAlbum.tsx` affiche un menu `MoreVertical` sur chaque carte (et des boutons dans la lightbox) avec les actions "Modifier" (uploader uniquement) et "Supprimer" (uploader ou propriétaire de la page).

**Lightbox album avec navigation** : la lightbox de `BirthdayAlbum.tsx` supporte la navigation entre éléments via boutons `ChevronLeft`/`ChevronRight`, swipe horizontal mobile (`onTouchStart`/`onTouchEnd` avec seuil 50px) et touches clavier (`ArrowLeft`/`ArrowRight`/`Escape`). Un compteur "X / N" est affiché en haut.

**Performance médias album** : à l'upload, `BirthdayAlbum.tsx` applique systématiquement :
- **Photos** : compression côté client via `compressImage` (`maxWidth/maxHeight 1600`, `quality 0.82`, format JPEG) avant push vers le bucket `birthday-page-photos`. Une photo iPhone de 4–8 Mo est ramenée à 200–500 Ko.
- **Vidéos** : extraction d'une **miniature JPEG 480px** via `extractSingleThumbnail` (à `t=0.5s`), uploadée dans le même bucket et stockée dans `birthday_page_photos.video_thumbnail_url`. La grille rend cette miniature en `<img loading="lazy">` au lieu de streamer le `<video>` (énorme gain mobile data + temps d'affichage). La balise `<video>` n'est instanciée qu'au clic dans la lightbox.
- **Lazy loading** : les 3 premières tuiles utilisent `loading="eager"` + `fetchpriority="high"`, les suivantes `loading="lazy"` + `fetchpriority="low"` + `decoding="async"`.

**Indicateur d'auteur visible sur chaque carte** : chaque tuile de l'album affiche un chip blanc translucide (`bg-white/90 backdrop-blur-sm rounded-full`) en bas-gauche contenant l'initiale de l'uploader dans une pastille `primary/20`, son prénom (ou « Toi » si c'est l'utilisateur courant), et une icône `Pencil` (édition possible) ou `Lock` (édition réservée à l'auteur). Permet aux invités de comprendre immédiatement qui peut modifier/supprimer un élément. La lightbox reprend le même indicateur sous le média.
