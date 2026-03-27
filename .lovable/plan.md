

# Plan : Notification admin + déclenchement paiement prestataire à la confirmation de réception

## Contexte

Quand un client note sa commande (confirmation de réception), la fonction `notify-order-confirmation` notifie uniquement le **prestataire**. Il manque :
1. Une **notification admin** (in-app + Push) informant qu'un client a confirmé la réception et noté la boutique
2. Le **déclenchement automatique du payment split** (simulation en phase 1, API Wave réelle en phase 2)

## Changements

### 1. Edge Function `notify-order-confirmation/index.ts` — Enrichir

Après les notifications au prestataire (lignes 73-121), ajouter :

**a) Notification admin (in-app)**
- Récupérer tous les admins actifs depuis `admin_users`
- Insérer une `admin_notifications` par admin avec :
  - `type`: `receipt_confirmed` ou `refund_requested`
  - `title`: "Réception confirmée par [client]" ou "Remboursement demandé par [client]"
  - `message`: détails (commande, note, prestataire, montant)
  - `severity`: `info` (satisfait) ou `warning` (remboursement)
  - `action_url`: `/admin/orders`
  - `entity_id`: orderId

**b) Push notification aux admins**
- Envoyer un push à tous les admins ayant des `push_subscriptions` actives

**c) Déclenchement du payment split (phase 1 : simulé)**
- Si `isSatisfied === true` (note ≥ 3), appeler la logique de `process-mobile-money-payment` ou `process-wave-payment` selon le `payment_method` de la commande
- Vérifier qu'un split n'existe pas déjà pour cette commande (anti-doublon)
- Créer le `payment_split` avec `vendor_transfer_status: 'simulated'`
- Inclure dans la notification admin un message indiquant : "Paiement prestataire en attente de virement manuel" (phase 1) ou "Paiement automatique déclenché" (phase 2)

### 2. Hook `useOrderConfirmation.ts` — Aucun changement nécessaire

Le hook appelle déjà `notify-order-confirmation` avec toutes les infos nécessaires. La logique admin et paiement sera côté serveur.

### 3. Hook `useEditRating.ts` — Ajouter appel notification

Quand un client modifie sa note et que le statut change (satisfaction ↔ remboursement), appeler également `notify-order-confirmation` pour que l'admin soit informé de la transition.

## Détails techniques

### Logique payment split dans `notify-order-confirmation`

```text
Si isSatisfied ET pas de split existant pour cet orderId :
  1. Lire order.payment_method
  2. Calculer vendorAmount (prix de base des produits)
  3. Calculer platformAmount (total - vendorAmount)
  4. Lire vendor phone (business_accounts.mobile_money_merchant_phone)
  5. Lire platform phone (platform_settings)
  6. INSERT payment_splits avec status 'simulated'
  7. Log dans la notification admin : "Split créé : X XOF vendeur / Y XOF plateforme"
```

### Anti-doublon payment split

Avant de créer un split, vérifier :
```sql
SELECT id FROM payment_splits WHERE business_order_id = ?
```
Si un split existe déjà, ne pas en créer un nouveau.

## Fichiers modifiés

- `supabase/functions/notify-order-confirmation/index.ts` (enrichi : admin notif + payment split)
- `src/hooks/useEditRating.ts` (ajout appel notify-order-confirmation sur changement de statut)

