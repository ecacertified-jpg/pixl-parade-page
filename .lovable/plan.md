## Objectif

Sur la page boutique du prestataire (`/b/:businessId`), afficher le **vrai téléphone** et le **vrai email du prestataire** dans la carte "Support & Infos", au lieu du contact générique de JOIE DE VIVRE actuellement affiché. Ajouter aussi le **site web** du prestataire s'il en a un.

## Diagnostic

Dans `src/pages/VendorShop.tsx` (lignes 286-297), la carte de contact reçoit :
```ts
phone={countryConfig.legalEntity.phone}   // numéro support JOIE DE VIVRE
email={countryConfig.legalEntity.email}   // email support JOIE DE VIVRE
```

C'est un choix historique de confidentialité (commentaire « Support info (not vendor personal info) »). L'utilisateur souhaite désormais l'inverse : exposer les coordonnées réelles du prestataire pour faciliter le contact direct.

Les données existent déjà dans l'objet `vendor` : `vendor.phone`, `vendor.email`, `vendor.websiteUrl` (déjà utilisées pour le SEO Schema.org lignes 182-188).

Le composant `VendorContactCard` accepte déjà `phone`, `email`, `websiteUrl` — aucune modification de composant n'est requise.

## Plan d'implémentation

### 1. `src/pages/VendorShop.tsx`

Remplacer le bloc 286-297 par :

```tsx
<VendorContactCard
  address={vendor.address}
  phone={vendor.phone || undefined}
  email={vendor.email || undefined}
  websiteUrl={vendor.websiteUrl || undefined}
  countryCode={vendor.countryCode}
/>
```

Si la boutique n'a renseigné aucun téléphone ni email, on affiche une **carte de repli** avec le contact de support JOIE DE VIVRE (`countryConfig.legalEntity.phone/email`) pour ne pas laisser l'utilisateur sans recours :

```tsx
const hasVendorContact = vendor.phone || vendor.email;
const countryConfig = getCountryConfig(vendor.countryCode || 'CI');

<VendorContactCard
  address={vendor.address}
  phone={hasVendorContact ? vendor.phone || undefined : countryConfig.legalEntity.phone}
  email={hasVendorContact ? vendor.email || undefined : countryConfig.legalEntity.email}
  websiteUrl={vendor.websiteUrl || undefined}
  countryCode={vendor.countryCode}
/>
```

### 2. `src/components/VendorContactCard.tsx`

Pour améliorer la lisibilité (problème visible sur la capture : `+225 0...` et `contact...` tronqués) :
- Faire passer le téléphone et l'email **en pleine largeur** (`col-span-2`) au lieu de la grille 2 colonnes qui force la troncature sur mobile.
- Conserver `truncate` comme garde-fou mais avec assez de place pour le contenu réel.

### 3. Mémoire

- Supprimer / mettre à jour la règle `mem://features/vendor/support-contact-policy` (qui interdisait l'affichage des coordonnées personnelles) pour refléter la nouvelle décision : **les coordonnées du prestataire sont publiques sur sa boutique**, avec repli sur le support JOIE DE VIVRE si elles sont absentes.

## Fichiers modifiés

- `src/pages/VendorShop.tsx` (passer les vraies coordonnées vendor au `VendorContactCard`)
- `src/components/VendorContactCard.tsx` (téléphone/email en pleine largeur pour éviter la troncature)
- `.lovable/mem/...` (mise à jour de la règle de visibilité des coordonnées prestataire)

## Hors-scope

- Pas de migration SQL : `business_accounts.phone`, `email`, `website_url` existent déjà.
- Pas de changement sur les autres pages (preview business, cards de listing) — uniquement la page boutique publique.
