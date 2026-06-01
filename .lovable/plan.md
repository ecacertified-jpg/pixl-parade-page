
## Onboarding — Suppression étape Cagnotte + Ajout « Voir ma page »

**`src/hooks/useOnboarding.ts`**
- Supprimer le check Step 4 (Cagnotte). Re-numéroter : Photo passe de 5 → 4, Publier de 6 → 5.
- `Promise.all` : retirer la requête `collective_funds`.
- Clamp final : `Math.min(5, …)`.

**`src/components/OnboardingExperience.tsx`**
- `DYNAMIC_TOTAL_STEPS = 6`.
- `stepLabels = ['Accueil', 'Goûts', 'Souhaits', 'Type', 'Photo', 'Publier']`.
- Supprimer entièrement le bloc `currentStep === 4` (Cagnotte) ; renuméroter `5 → 4` (Photo) et `6 → 5` (Publier).
- Adapter `isStepCompleted` et `stepHintMessage` en conséquence (retirer case 4 cagnotte, décaler).
- Retirer toute la logique liée : `hasFund`, `fundId`, `creatingFund`, `fundSkipped`, `skipFund`, `showFundPickerModal`, fetch fund, localStorage `bp_fund_skipped_*`.
- Sous-étape 2 « Publier ma page » de l'étape Publier : quand `isPagePublished === true`, ajouter un bouton secondaire **« Voir ma page »** à droite (lien vers `/birthday/<slug>` via `onComplete()` puis navigation).

## Page d'anniversaire — 4 pop-ups propriétaire

**`src/pages/BirthdayPage.tsx`** — N'afficher les pop-ups que si `isOwner` (i.e. `user?.id === pageData.user_id`). Tous montés via `Dialog` shadcn, fermables, avec un flag `localStorage` pour ne pas spammer (re-shown selon la règle).

### Pop-up 1 — Publier ma page
- Condition : page existe mais `published_at` est null.
- Affiché à l'ouverture après chargement, une fois par session (clé `bp_publish_dismissed_<pageId>_session`).
- Titre : « Publie ta page d'anniversaire 🎂 ». CTA : **Publier ma page** → appelle la même mutation que le builder (`update birthday_pages set published_at = now()`), puis confetti + toast.

### Pop-up 2 — Créer ma cagnotte
- Condition : propriétaire ET pas de cagnotte birthday active liée (`pageData.fund_id` null ET aucun `collective_funds` actif occasion=birthday pour ce `user_id`).
- Affiché à l'ouverture (après pop-up 1 fermé) + max 1×/jour (clé `bp_fund_cta_<pageId>_<yyyy-mm-dd>`).
- Texte incitatif : « Active ta cagnotte pour que tes amis t'offrent le cadeau de tes rêves ✨ ». CTA : **Créer ma cagnotte** → ouvre `WishlistFundPickerModal` (déjà importé).

### Pop-up 3 — Partager (après création cagnotte)
- Déclenché par effet : quand le nombre de cagnottes passe de 0 → ≥1 dans la session courante (state local `prevFundCount`), ouvrir le pop-up.
- CTA : **Partager** → ouvre `BirthdayPageShareButton`/sheet de partage.

### Pop-up 4 — Partager (après action sur la page)
- Déclencheurs : nouvelle photo ou vidéo ajoutée à l'album, ou nouveau message envoyé par le propriétaire. On hooke les callbacks de `BirthdayAlbumFlickr` et `MessageWall` (props existantes type `onItemAdded`) pour incrémenter un compteur `actionsSinceLastShare`. Quand `actionsSinceLastShare >= 1`, ouvrir le pop-up.
- Texte fortement incitatif : « 🔥 Ton anniversaire devient incroyable ! Partage maintenant pour que tes amis le découvrent et participent. Plus tu partages, plus tu reçois 💝 ».
- CTA : **Partager** → sheet de partage. Reset compteur.

### Pop-up 5 — Partage initial (non partagée depuis création)
- Condition : page publiée + aucune entrée `onboarding_shares` (ou table partage existante) liée à ce `user_id` ET `created_at` page > 0 minutes.
- Affiché 1×/24h tant que `shareCount === 0` (clé `bp_share_reminder_<pageId>_<yyyy-mm-dd>`).
- Même UI que pop-up 4 mais texte adapté : « Ta page est en ligne… mais personne ne le sait encore. Partage-la pour recevoir messages et cadeaux 🎁 ».

## Composant partagé
Créer **`src/components/birthday/OwnerNudgeDialog.tsx`** : un `Dialog` paramétrable (titre, description, icône, label CTA, onCta). Réutilisé par les 4 pop-ups. Animations Framer Motion + emoji floating discret.

## Hors périmètre
- Pas de changement DB ni migration.
- Pas de modification des pages publiques pour les visiteurs (les pop-ups sont strictement propriétaire).
- L'étape « Cagnotte » reste accessible plus tard via la page d'anniversaire (pop-up 2) — on ne supprime aucune fonctionnalité de création de cagnotte, juste l'étape forcée pendant l'onboarding.
