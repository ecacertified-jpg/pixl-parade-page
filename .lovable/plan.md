

## Plan : Notification automatique au client lors de la livraison

### Problème actuel

Quand `updateDeliveryStatus` dans `useOrderDelivery.ts` passe une commande en statut `delivered`, seul le champ `delivery_delivered_at` est mis à jour en base. Aucune notification n'est envoyée au client. Le client ne sait donc pas qu'il doit aller noter le vendeur.

### Solution

Créer une nouvelle Edge Function `notify-delivery-completed` qui envoie 4 types de notifications au client (in-app, Push, SMS, WhatsApp) avec un lien direct vers `/orders` pour confirmer et noter.

### Modifications

**1. Nouvelle Edge Function : `supabase/functions/notify-delivery-completed/index.ts`**
- Reçoit `{ order_id }` en paramètre
- Récupère la commande avec `business_accounts` (business_name, phone) et le profil client (first_name)
- Envoie :
  - **In-app** : notification dans la table `notifications` avec `type: 'delivery_completed'`, `action_url: '/orders'`
  - **Push** : via `sendWebPushNotification` aux abonnements actifs du client
  - **SMS** : via `sendSms` au `donor_phone` ou `beneficiary_phone`
  - **WhatsApp** : via `sendWhatsAppTemplate` avec template `joiedevivre_delivery_completed` (paramètres : prénom, nom boutique, shortOrderId)
- Message type : "Votre commande #XXXXXXXX chez {business} a été livrée ! Confirmez la réception et notez le vendeur."

**2. Modifier `src/hooks/useOrderDelivery.ts`**
- Dans `updateDeliveryStatus`, quand `status === 'delivered'`, appeler `supabase.functions.invoke('notify-delivery-completed', { body: { order_id: orderId } })` après la mise à jour réussie

**3. Config : `supabase/config.toml`**
- Ajouter `[functions.notify-delivery-completed]` avec `verify_jwt = false`

### Flux

```text
Livreur/Vendeur marque "livré"
       ↓
useOrderDelivery.updateDeliveryStatus(status='delivered')
       ↓
business_orders.delivery_status = 'delivered'
       ↓
invoke('notify-delivery-completed', { order_id })
       ↓
Client reçoit: In-app + Push + SMS + WhatsApp
  "Commande livrée ! Confirmez et notez → /orders"
```

### Fichiers impactés
- `supabase/functions/notify-delivery-completed/index.ts` (nouveau)
- `src/hooks/useOrderDelivery.ts` (ajout appel edge function)
- `supabase/config.toml` (nouvelle entrée)

