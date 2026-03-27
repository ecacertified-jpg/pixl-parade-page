

# Plan : Corriger la page blanche du CTA "Voir mon cadeau"

## Probleme

Le CTA "Voir mon cadeau" du template `joiedevivre_gift_order` pointe vers `/order-confirmation?orderId={uuid}`, qui est enveloppé dans `<ProtectedRoute>`. Le bénéficiaire du cadeau (souvent non connecté) est redirigé vers `/auth` et voit une page blanche. De plus, même connecté, `OrderConfirmation.tsx` ne charge pas les données depuis la base — il lit `localStorage`, qui est vide pour le bénéficiaire.

## Solution

Créer une page publique `/gift-received/:orderId` dédiée aux bénéficiaires de cadeaux, accessible sans authentification.

### 1. Créer la page `GiftReceived.tsx`

**Fichier** : `src/pages/GiftReceived.tsx`

- Route publique (pas de `ProtectedRoute`)
- Récupère l'orderId depuis les params URL
- Charge les détails de la commande depuis `business_orders` (nom du produit, montant, nom de l'expéditeur)
- Affiche un écran festif : icône cadeau, nom du cadeau, valeur, message "offert par X"
- Boutons : "Créer mon compte" (si non connecté) ou "Explorer la boutique" (si connecté)
- Gestion des erreurs : commande introuvable, chargement

### 2. Ajouter la route publique dans `App.tsx`

```text
<Route path="/gift-received/:orderId" element={<L><GiftReceived /></L>} />
```

Placée hors de `ProtectedRoute`, comme les routes `/c/:token` et `/f/:id`.

### 3. Modifier le CTA dans le code d'envoi

**Fichier** : `supabase/functions/notify-business-order/index.ts` (ligne 512)

Changer le `buttonParameters` pour pointer vers la nouvelle route :

```typescript
// Avant
[orderId]  // → /order-confirmation?orderId={orderId}

// Après  
[`gift-received/${orderId}`]  // → https://joiedevivre-africa.com/gift-received/{orderId}
```

### 4. Mettre à jour le template Meta

Le template `joiedevivre_gift_order` dans Meta doit être modifié :
- **URL de base** : `https://joiedevivre-africa.com/` (juste le domaine)
- **Suffixe dynamique `{{1}}`** : `gift-received/{orderId}`

Ou garder l'URL de base actuelle et ajuster le suffixe en conséquence.

### 5. Ajouter au template health check

**Fichier** : `supabase/functions/check-whatsapp-template-health/index.ts` — déjà présent, aucun changement nécessaire.

## Fichiers modifiés

- `src/pages/GiftReceived.tsx` — nouveau fichier (page publique cadeau reçu)
- `src/App.tsx` — ajout route publique `/gift-received/:orderId`
- `supabase/functions/notify-business-order/index.ts` — correction du suffixe URL du CTA

## Action requise dans Meta

Modifier l'URL du bouton CTA de `joiedevivre_gift_order` pour correspondre à la nouvelle route.

