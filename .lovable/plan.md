

# Plan : Tester l'envoi du template `joiedevivre_delivery_reminder`

## Analyse du template Meta

D'apres les captures :
- **Body** : 3 variables — `{{1}}` = prenom client, `{{2}}` = ID commande court, `{{3}}` = nom du prestataire
- **Bouton CTA** : "Confirmer la reception" — URL dynamique `https://joiedevivre-africa.com/orders/{{1}}`

## Action

Utiliser `test-whatsapp-send` via `supabase--curl_edge_functions` avec des donnees reelles issues de la base :

1. Requeter `business_orders` pour trouver une commande recente avec un `customer_id` et un telephone
2. Recuperer le `first_name` du client et le `business_name` du prestataire
3. Envoyer le template avec :
   - `body_params`: `["Prenom", "ORDERID", "NomBusiness"]`
   - `button_params`: `["order-uuid-complet"]` (suffixe dynamique pour l'URL `/orders/`)

## Verification du code existant

Le code dans `check-delivery-confirmation-reminder` (ligne 145-150) et `notify-delivery-completed` (ligne 128-133) utilise deja les bons parametres dans le bon ordre. Aucune correction necessaire — il s'agit uniquement d'un test d'envoi.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Aucun | Test d'envoi uniquement via `curl_edge_functions` |

