
# Test du template WhatsApp `joiedevivre_order_rejected`

## Contexte

Il n'y a actuellement aucune commande en statut `pending` chez BABY SNUS. Toutes les commandes existantes sont deja `confirmed`. L'Edge Function `handle-order-action` refuse de traiter une commande qui n'est pas en statut `pending`.

## Plan d'execution

### Etape 1 : Creer une Edge Function temporaire de test

Creer `supabase/functions/test-reject-order/index.ts` qui :

1. **Insere une nouvelle commande pending** chez BABY SNUS via le service role :
   - `business_account_id`: `09aff073-d5f7-4e1e-babf-f176ebdbd458` (BABY SNUS)
   - `customer_id`: `b8d0d4e4-3eec-45df-a87d-b9ec7e4bf95a` (Aboutou WhatsApp, tel: +2250707467445)
   - Montant: 3 500 XOF
   - Statut: `pending`

2. **Appelle `handle-order-action`** avec l'action `reject` et la raison "Produit temporairement indisponible"
   - Cela declenchera le template WhatsApp `joiedevivre_order_rejected` vers le client (+2250707467445)
   - Plus les notifications SMS et in-app

### Etape 2 : Deployer et appeler la fonction

- Deployer `test-reject-order`
- L'appeler via curl pour executer le test complet

### Etape 3 : Verifier les resultats

- Lire les logs de `handle-order-action` pour confirmer :
  - Statut de la commande passe a `cancelled`
  - Template WhatsApp `joiedevivre_order_rejected` envoye avec succes
  - SMS de rejet envoye
  - Notification in-app creee
  - Push notification tentee

### Etape 4 : Nettoyer

- Supprimer la fonction `test-reject-order` (fonction temporaire de test uniquement)

## Donnees de test utilisees

| Element | Valeur |
|---------|--------|
| Business | BABY SNUS (ID: `09aff073...`) |
| Business User | `06d3be2d...` |
| Client | Aboutou WhatsApp (`b8d0d4e4...`) |
| Telephone client | +2250707467445 |
| Montant | 3 500 XOF |
| Raison du rejet | "Produit temporairement indisponible" |

## Resultat attendu

Le client Aboutou WhatsApp recevra sur +2250707467445 :
- Un message WhatsApp via le template `joiedevivre_order_rejected` avec son prenom, le montant et le nom "BABY SNUS"
- Un SMS de notification de rejet
- Une notification in-app dans l'application
