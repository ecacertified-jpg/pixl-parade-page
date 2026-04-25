## Diagnostic

### Problème 1 — Redirection après inscription perdue
Dans `src/pages/Auth.tsx`, le `useEffect` lignes 293-329 gère bien le param `?redirect=/birthday/...` quand un utilisateur déjà connecté arrive. **Mais** pour un nouveau signup OTP (lignes 887-906), le code force `navigate('/dashboard?onboarding=true')` et **ignore** le `redirect` param. Résultat : l'invité qui clique sur le lien WhatsApp `joiedevivre-africa.com/birthday/samira-2026`, choisit "Créer un compte", complète l'OTP… puis est envoyé sur `/dashboard` au lieu de revenir sur la page de Samira.

Même problème à la ligne 1101 (autre branche signup). Il faut **prioriser** le `redirect` param avant le fallback `/dashboard`.

### Problème 2 — Impossible de supprimer/modifier ses contributions
Vérification SQL sur `birthday_page_photos` :
```
- "Anyone can view birthday page photos" (SELECT)
- "Authenticated users can add photos" (INSERT)
```
**Aucune policy UPDATE ni DELETE.** Pareil pour le bucket Storage `birthday-page-photos` : que SELECT et INSERT.

Donc même si on ajoutait des boutons UI, les requêtes seraient bloquées par RLS. Il faut migrer.

### Problème 3 — Navigation entre éléments dans la lightbox
La lightbox de `BirthdayAlbum.tsx` (lignes 460-528) affiche **un seul élément** sans flèches précédent/suivant ni swipe. Quand un visiteur clique sur la 1ʳᵉ photo, il doit fermer puis rouvrir manuellement chaque élément pour les parcourir — usage inconfortable surtout sur mobile.

---

## Plan d'action

### 1. Migration SQL — RLS update/delete sur les contributions

Nouvelle migration ajoutant aux tables/buckets la possibilité pour l'**uploader** de modifier/supprimer ses propres contributions :

```sql
-- birthday_page_photos
CREATE POLICY "Uploaders can update their own contributions"
  ON public.birthday_page_photos FOR UPDATE
  USING (auth.uid() = uploader_id)
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Uploaders can delete their own contributions"
  ON public.birthday_page_photos FOR DELETE
  USING (auth.uid() = uploader_id);

-- + policy pour le créateur de la page (modération)
CREATE POLICY "Page owner can delete any contribution"
  ON public.birthday_page_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM birthday_pages bp
      WHERE bp.id = birthday_page_id AND bp.user_id = auth.uid()
    )
  );

-- Storage bucket birthday-page-photos
CREATE POLICY "Users can delete their own birthday page media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'birthday-page-photos'
    AND (storage.foldername(name))[2] LIKE auth.uid()::text || '-%'
  );
```
*(Le path est `{pageId}/{userId}-{ts}.ext` ou `{pageId}/vid-{userId}-{ts}.ext` — la policy match l'uploader.)*

### 2. Fix Auth — préserver le `redirect` après signup

Dans `src/pages/Auth.tsx` :
- Lignes 887-910 (vérification OTP) : avant le fallback `/dashboard`, lire `searchParams.get('redirect')` et naviguer vers `${redirectParam}` (avec `?onboarding=true` en suffixe pour les nouveaux comptes).
- Ligne 1101 (autre branche signup) : même correction.
- Garder `processAdminAutoAssign` et `acceptInvitationIfNeeded` en arrière-plan.

Résultat : l'invité de Samira arrive directement sur `/birthday/samira-2026` après inscription.

### 3. Composant `BirthdayAlbum.tsx` — Modifier/Supprimer

Ajouter dans le **rendu de chaque carte** (grille) :
- Un menu `...` flottant (top-right, visible si `user?.id === item.uploader_id` OU `user?.id === pageOwnerUserId`).
- Options : **Modifier** (légende pour photo/vidéo, texte pour souvenir) + **Supprimer**.
- `handleDelete` : `supabase.storage.from('birthday-page-photos').remove([path])` + `supabase.from('birthday_page_photos').delete().eq('id', item.id)` + retirer du state local via un nouveau callback `onItemRemoved`.
- `handleEdit` : ouvrir un mini-dialog avec `Textarea` selon le type (caption ou memory_text), `UPDATE` puis `onItemUpdated`.

Props additionnelles : `pageOwnerUserId: string`, `onItemRemoved: (id) => void`, `onItemUpdated: (item) => void`. Câbler ces callbacks dans `BirthdayPage.tsx` pour mettre à jour `albumItems`.

### 4. Lightbox — navigation prev/next + swipe

Refonte de la state lightbox dans `BirthdayAlbum.tsx` :
- Remplacer `lightboxItem: AlbumItem | null` par `lightboxIndex: number | null` indexant `filtered`.
- Ajouter deux boutons `ChevronLeft` / `ChevronRight` (gauche/droite, ratio circulaire blanc translucide), désactivés aux extrémités.
- Support clavier : `ArrowLeft`/`ArrowRight`/`Escape` via `useEffect` sur `keydown`.
- Support swipe mobile : utiliser le hook existant `useSwipeGesture` (déjà dans `src/hooks/`) ou `onTouchStart/onTouchEnd` simple.
- Compteur "3 / 7" en haut.
- Inclure les actions Modifier/Supprimer dans la lightbox aussi (si autorisé).

### 5. Mise à jour mémoire

Mettre à jour `mem://features/birthday-pages/lifecycle-and-visibility` :
- Le `redirect` param `/auth?redirect=/birthday/{slug}&invited=true` est désormais **respecté à la fin du signup OTP**, garantissant que l'invité retombe sur la page d'origine.
- Les contributeurs (uploader) **et** le propriétaire de la page peuvent supprimer/modifier les contributions album. Politiques RLS dédiées sur `birthday_page_photos` + bucket `birthday-page-photos`.
- Lightbox album supporte navigation prev/next (clavier + swipe + boutons).

---

## Fichiers modifiés / créés

**Créés**
- `supabase/migrations/<timestamp>_birthday_page_photos_owner_policies.sql` — policies UPDATE/DELETE.

**Modifiés**
- `src/pages/Auth.tsx` — préserver `redirect` après OTP signup (2 endroits).
- `src/components/BirthdayAlbum.tsx` — menu Modifier/Supprimer par carte, refonte lightbox avec prev/next + swipe + clavier.
- `src/pages/BirthdayPage.tsx` — passer `pageOwnerUserId` + handlers `onItemRemoved` / `onItemUpdated` à `BirthdayAlbum`.
- `.lovable/mem/features/birthday-pages/lifecycle-and-visibility.md` — documenter les nouveaux comportements.

---

## Résultat attendu

1. ✅ Un visiteur WhatsApp clique sur `/birthday/samira-2026`, crée son compte par OTP, et atterrit **directement** sur la page de Samira (plus de détour par `/dashboard`).
2. ✅ Chaque contributeur peut **modifier la légende/texte** ou **supprimer** ses propres photos/vidéos/souvenirs ; le propriétaire de la page peut aussi modérer (supprimer) toute contribution.
3. ✅ Dans la lightbox, navigation fluide entre éléments via flèches gauche/droite, swipe mobile et touches clavier — fini l'ouverture/fermeture répétée.
