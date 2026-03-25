

# Plan : Ajouter l'option Wave dans le checkout des cagnottes

## Problème

La page `CollectiveCheckout.tsx` (Finaliser la cotisation) n'affiche que 2 modes de paiement : "Paiement à la livraison" et "Mobile Money (Orange/MTN)". L'option Wave est absente, contrairement à la page `Checkout.tsx` (commandes individuelles) qui l'a déjà.

## Changements — `src/pages/CollectiveCheckout.tsx`

### 1. Ajouter l'import de `WavePaymentRedirect` et `Smartphone`

### 2. Ajouter un state `showWaveModal`

### 3. Ajouter l'option radio Wave dans le `RadioGroup` (après Mobile Money, ligne 517)

Même style que dans `Checkout.tsx` : icône teal `#1DC3C3`, label "🌊 Wave".

### 4. Ajouter le composant `WavePaymentRedirect` avec `freeAmount={true}`

Puisque c'est une cagnotte, le montant est libre — l'utilisateur saisit sa contribution sur Wave.

### 5. Modifier le handler de confirmation

Si `paymentMethod === 'wave'`, ouvrir le modal Wave au lieu de créer directement la cagnotte. Le `onSuccess` du modal déclenchera la création de la cagnotte.

### 6. Stocker le `payment_method` correctement

Mapper `wave` → `"wave"` dans l'objet `collective_fund_orders` (actuellement seul `cash_on_delivery` et `mobile_money` sont gérés).

## Fichier modifié

- `src/pages/CollectiveCheckout.tsx`

