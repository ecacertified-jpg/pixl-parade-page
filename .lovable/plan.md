

# Plan : Mobile Money indisponible, paiement Wave différé, masquer livraison pour cagnottes

## 3 changements

### 1. Message "indisponible" pour Mobile Money — 3 fichiers

**`src/pages/Checkout.tsx`** : Quand l'utilisateur sélectionne `mobile`, afficher un toast/alerte "Ce mode de paiement n'est pas encore disponible. Sélectionnez WAVE pour votre paiement" et remettre la sélection sur `wave`. Même logique dans **`src/pages/CollectiveCheckout.tsx`** (valeur `mobile_money`) et **`src/components/ContributionModal.tsx`**.

### 2. Paiement à la livraison → message d'avertissement + bouton Wave dans Mes Commandes

**`src/pages/Checkout.tsx`** : Sous l'option "Paiement à la livraison", ajouter une alerte visible :
> ⚠️ Attention ! Payez via WAVE dans MES COMMANDES des paramètres du profil pour le paiement à la livraison

**`src/pages/Orders.tsx`** (OrderCard) : Pour les commandes avec `paymentMethod === 'cash_on_delivery'` et statut `pending` ou `processing`, ajouter un bouton "Payer via Wave" qui ouvre le `WavePaymentRedirect` avec le montant de la commande pré-rempli. Nécessite :
- Ajouter `paymentMethod` au type `CustomerOrder` et au hook `useCustomerOrders`
- Ajouter un state `wavePayOrder` dans Orders pour le modal Wave
- Après paiement Wave confirmé, mettre à jour le statut de la commande

### 3. Masquer "Paiement à la livraison" pour les cagnottes

**`src/pages/CollectiveCheckout.tsx`** : Retirer l'option `cash_on_delivery` du RadioGroup. Ne garder que Wave et Mobile Money (avec le message indisponible pour Mobile Money).

## Fichiers modifiés

- `src/pages/Checkout.tsx` — alerte sous paiement à la livraison + interception Mobile Money
- `src/pages/CollectiveCheckout.tsx` — retrait cash_on_delivery + interception mobile_money
- `src/components/ContributionModal.tsx` — interception mobile_money
- `src/pages/Orders.tsx` — bouton "Payer via Wave" sur les commandes pending
- `src/hooks/useCustomerOrders.ts` — exposer `paymentMethod`

