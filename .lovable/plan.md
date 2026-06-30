## 1. Bouton "Créer" sur chaque article de la liste de souhaits

Dans `src/components/event/EventWishlistSection.tsx`, ajouter sur chaque carte d'article un bouton **"Créer"** (icône `Gift`) visible pour les **visiteurs non‑propriétaires** (les amis), à côté du bouton réserver. Le bouton ouvre le flux de création de cagnotte ciblant le propriétaire de la page d'événement.

Implémentation :
- Récupérer l'`owner_user_id` de l'événement (déjà disponible via `EventPage` — le passer en prop `ownerUserId` au composant).
- Réutiliser `WishlistFundPickerModal` qui sait déjà créer une cagnotte publique pour un `beneficiaryUserId` externe (logique `handleCreateFund` lignes 134–217). Ouvrir la modale avec `beneficiaryUserId={ownerUserId}` + nom/avatar du propriétaire et préselectionner l'article cliqué via un nouvel état `presetItemId`.
- Pour un article **interne** (issu de `event_wishlist_items` sans `product_id` lié au catalogue), router à la place vers `ExternalProductFundModal` préfillé avec le titre/prix/image/URL de l'article (création de cagnotte produit externe pour le bénéficiaire).
- Le bouton "Créer" remplace l'absence d'action pour les visiteurs et coexiste avec les actions propriétaire.

## 2. Liste scrollable (≈ 3 articles visibles) sur mobile

Toujours dans `EventWishlistSection.tsx` :
- Encapsuler la `div.space-y-3` des articles dans un conteneur scrollable avec hauteur max responsive :
  - mobile : `max-h-[360px]` (≈ 3 cartes), `sm:max-h-none`
  - `overflow-y-auto pr-1`
  - Ajouter un léger fade en bas et `scrollbar-thin` pour indiquer le scroll.
- Garder le rendu complet sur desktop.

## 3. Réponse à la question sur la personnalisation des vidéos de couverture

Oui, c'est déjà rattaché à un plan dans `src/features/subscription/featureCatalog.ts` :

```
cover_video_custom → requires: 'essentiel'
```

Donc :
- **Gratuit** : vidéos par défaut uniquement.
- **Essentiel & Premium** : upload des vidéos personnalisées (matin, après-midi, soir, nuit, fête calendaire, anniversaire).

Action complémentaire dans la modale "Vidéos de couverture" (`CoverVideoCarousel` / modale d'upload) : envelopper chaque bouton **Uploader** avec `FeatureGate feature="cover_video_custom"` afin d'ouvrir `UpgradePromptModal` (avec `?from=cover_video_custom`) quand un utilisateur Gratuit tente l'upload — la fonctionnalité est mappée mais non encore verrouillée à l'UI. (Vérifier rapidement le composant de la modale d'upload et ajouter le gate, sinon laisser tel quel si déjà gating ailleurs.)

## Fichiers touchés

- `src/components/event/EventWishlistSection.tsx` — nouveau bouton "Créer", scroll mobile, prop `ownerUserId`, intégration `WishlistFundPickerModal` + `ExternalProductFundModal` préfillé.
- `src/pages/EventPage.tsx` — passer `ownerUserId` au composant.
- (Optionnel) Composant de la modale "Vidéos de couverture" — wrapper `FeatureGate` autour des actions Uploader.

## Détails techniques

- Le bouton "Créer" est masqué pour le propriétaire (`!isOwner`) et nécessite un `ownerUserId` valide (sinon caché).
- Si visiteur non connecté → la modale gère déjà la redirection vers `/auth?...intent=create_fund`.
- Pour les articles favoris (`fav-*`) → utiliser le flux normal `WishlistFundPickerModal` (product déjà connu).
- Pour les articles `event_wishlist_items` sans product catalogue → `ExternalProductFundModal` préfillé (titre, prix, image, URL) avec `beneficiary_user_id = ownerUserId`.