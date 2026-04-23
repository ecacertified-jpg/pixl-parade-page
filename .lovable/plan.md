

## Diagnostic

### Problème 1 — Modal "+" tronqué sur mobile

Sur mobile (922×628 visible dans l'aperçu), le `BirthdayPageBuilderModal` utilise `h-[92vh]` mais :
- `StepCard` utilise `flex items-center gap-3` avec un bouton CTA (`Modifier`, `Compléter`...) à droite **non `shrink`** → le label du bouton est coupé (visible sur la capture : "Modifie...", "Compléte...", "Choisi...", "Cré...").
- L'icône thématique (Heart/Users/Tag/Gift) est sur la même ligne que le titre, ce qui pousse le titre et fait revenir à la ligne.
- Pas assez de padding bas → la dernière carte (étape 6) est masquée par la barre système.

### Problème 2 — Réorganisation des étapes + nouvelle étape "Associer mes amis"

Ordre demandé :
1. Modifier ma liste de souhaits
2. Choisir le type de page
3. **Associer mes amis à ma page** (nouvelle logique : sélection multiple depuis le cercle d'amis, avec note explicative "WhatsApp + rappels")
4. Créer la cagnotte
5. Publier la page (+ visible dans fil & profil)
6. Partager ma page

L'étape 3 actuelle ("Compléter mon cercle d'amis" basée sur `friend_circle_members ≥ 3`) est **remplacée** par une vraie association amis ↔ page. Aujourd'hui aucune table ne stocke ce lien.

### Problème 3 — Visibilité de la page publiée

La page publiée doit s'afficher :
- ✅ Déjà dans le fil d'actualités (`usePagesFeed`).
- ❌ **Pas encore** sur les avatars du profil (carte "Que voulez-vous célébrer aujourd'hui ?", carte d'anniversaire, etc.). À ajouter : un petit badge "Ma page" cliquable sur l'avatar du profil dans `WhatDoYouWantCard.tsx` et tout autre rendu d'avatar du profil utilisateur dans le dashboard.

### Problème 4 — Badge "Ma page" sur la carte d'anniversaire (fil)

Dans `PageFeedCard.tsx` (lignes 82-96), le badge "Ma page" est sur la même ligne que le nom du créateur, et la zone droite contient l'icône emoji + bouton "Suivre". Sur mobile étroit, le `flex` ne wrap pas correctement → le bouton "Suivre" est trop large par rapport à l'espace restant. Le badge "Ma page" peut chevaucher le bouton "Suivre" (visible sur la 2ᵉ capture : badge collé au bord, espace minimal avant "Suivre").

## Plan

### 1) Nouvelle table `birthday_page_friends` (migration)

```sql
CREATE TABLE public.birthday_page_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES birthday_pages(id) ON DELETE CASCADE,
  friend_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT page_friend_unique UNIQUE (page_id, friend_user_id, contact_id),
  CONSTRAINT friend_or_contact CHECK (friend_user_id IS NOT NULL OR contact_id IS NOT NULL)
);

ALTER TABLE public.birthday_page_friends ENABLE ROW LEVEL SECURITY;

-- Owner only
CREATE POLICY "Page owner can manage friends"
ON birthday_page_friends FOR ALL
USING (EXISTS (SELECT 1 FROM birthday_pages WHERE id = page_id AND user_id = auth.uid()))
WITH CHECK (added_by = auth.uid());

CREATE INDEX idx_bpf_page ON birthday_page_friends(page_id);
```

### 2) Refonte de `useBirthdayPageBuilderStatus`

Remplacer l'étape `friends` (basée sur `friend_circle_members.count ≥ 3`) par :
- **Validation** : `birthday_page_friends.count >= 1` pour la page de l'année courante.
- Si pas encore de page créée (avant étape 5), valider sur `localStorage.bp_friends_${userId}` (tableau d'IDs sélectionnés) `length >= 1`.
- À la création de la page (étape 5 publish), insérer en batch les amis stockés en localStorage dans `birthday_page_friends`.

L'ordre des steps dans le hook devient :
```
{ wishlist, type, friends, fund, publish, share }
```

### 3) Nouveau sous-composant `BirthdayPageFriendsPicker.tsx`

Sub-Sheet dans `BirthdayPageBuilderModal` ouverte par l'étape 3 :

**Header** : "Associer mes amis à ma page"

**Bandeau info** (Card jaune avec icône Info) :
> "Les amis associés recevront automatiquement une notification WhatsApp pour ton anniversaire et des rappels J-7, J-3 et le jour J."

**Recherche** : input pour filtrer.

**Liste** : tous les contacts du user (table `contacts`) + membres de son cercle d'amis. Chaque ligne avec checkbox, avatar, nom, badge si "WhatsApp activé". Sélection multiple → stockée en localStorage `bp_friends_${userId}` puis copiée dans `birthday_page_friends` à la publication.

**Footer** : bouton "Enregistrer (X sélectionnés)".

### 4) Réorganiser & corriger l'affichage du modal sur mobile

Dans `BirthdayPageBuilderModal.tsx` :
- Réordonner `steps` : wishlist → type → friends → fund → publish → share.
- Remplacer le `StepCard` horizontal par une **disposition à 2 lignes sur mobile** :
  - **Ligne 1** : pastille (numéro/check) + icône + titre + badge d'état/progression
  - **Ligne 2** : description (text-xs muted, line-clamp-2)
  - **Ligne 3** : bouton CTA pleine largeur avec label complet (ex. "Compléter") au lieu d'un bouton tronqué à droite
- Ajouter `pb-24` à la zone scroll pour libérer la dernière carte de la barre système.
- Réduire `h-[92vh]` à `h-[90vh] max-h-[700px]` et ajouter `safe-area-inset-bottom`.

### 5) Visibilité "Ma page" sur les avatars du profil utilisateur

Dans `WhatDoYouWantCard.tsx` (autour de l'`Avatar` ligne 113) :
- Si l'utilisateur a une page publiée (`birthdayPageSlug` via le hook `useBirthdayPageBuilderStatus`), wrapper l'avatar dans un bouton qui navigue vers `/birthday/${slug}` ET ajouter un mini-badge `Cake` rose en bas-droite (style `absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-pink-500 text-white`) avec un tooltip "Voir ma page".
- Faire la même chose sur les autres avatars du profil utilisateur : `Dashboard.tsx` (avatar du header utilisateur), `BirthdayCard` si présent. Créer un petit hook utilitaire `useMyBirthdayPageSlug()` réutilisable pour ne pas dupliquer la requête.

### 6) Fix badge "Ma page" sur `PageFeedCard.tsx` (fil)

Refondre les lignes 82-110 :
- Mettre les badges (`Ma page`, `Ami`) **sous** le nom du créateur dans une seconde ligne (au lieu d'à côté du nom) → libère de l'espace pour le bouton "Suivre".
- Réduire le bouton "Suivre" à `h-6 px-1.5` sur mobile, icône seule + texte caché en `<sm`.
- `flex-wrap gap-1.5` sur le conteneur des badges pour éviter tout chevauchement.
- Couleur `Ma page` : changer en `bg-primary text-primary-foreground` (badge plein) avec icône `Star` plus visible.

### 7) Mise à jour mémoires

- `mem://features/birthday-pages/lifecycle-and-visibility` : ajouter mention de la table `birthday_page_friends` et du flow d'association lors de la publication.
- `mem://auth/onboarding-experience-and-logic` : noter le nouvel ordre des 6 étapes du builder (wishlist → type → friends → fund → publish → share).

## Détails techniques

**Fichiers créés** :
- `supabase/migrations/<timestamp>_birthday_page_friends.sql`
- `src/components/BirthdayPageFriendsPicker.tsx`
- `src/hooks/useMyBirthdayPageSlug.ts`

**Fichiers modifiés** :
- `src/hooks/useBirthdayPageBuilderStatus.ts` (nouvel ordre + step `friends` basé sur `birthday_page_friends`)
- `src/components/BirthdayPageBuilderModal.tsx` (refonte mobile + ordre + sub-sheet friends + insertion batch à publish)
- `src/components/WhatDoYouWantCard.tsx` (avatar cliquable + badge Cake)
- `src/components/PageFeedCard.tsx` (refonte header carte, badge "Ma page" responsive)
- `src/integrations/supabase/types.ts` (régénéré auto)

**Pas de changement** sur l'API publish existante (juste ajout de l'insert batch des amis dans la même transaction logique).

## Résultat attendu

1. ✅ Le modal "+" affiche les 6 cartes en entier sur mobile, avec CTA pleine largeur lisibles.
2. ✅ L'ordre des étapes est : Souhaits → Type → Amis → Cagnotte → Publier → Partager.
3. ✅ L'étape "Amis" ouvre un sélecteur dédié avec note WhatsApp/rappels et stocke les choix dans `birthday_page_friends`.
4. ✅ La page publiée reste visible dans le fil **et** un badge cliquable apparaît sur l'avatar du profil utilisateur (carte "Que voulez-vous célébrer ?" et autres) pour y accéder à tout moment.
5. ✅ Le badge "Ma page" sur la carte du fil ne chevauche plus le bouton "Suivre" sur mobile.

