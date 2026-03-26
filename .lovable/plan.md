

# Plan : Automatiser le flux post-cagnotte 100% et le split

## Problème

Quand une cagnotte atteint 100%, il n'y a aucune commande créée automatiquement et aucun split calculé. L'argent arrive sur le compte Wave JDV mais rien ne se passe ensuite.

## Flux cible

```text
Cagnotte 100%
  → notify-fund-ready (existant)
  → NOUVEAU: créer automatiquement une business_order à partir de la cagnotte
  → NOUVEAU: créer le payment_split (commission JDV + montant prestataire)
  → Admin voit le split dans le dashboard Commissions
  → Admin transfère manuellement au prestataire (Wave/Mobile Money)
  → Admin marque vendor_transfer_status = 'completed'
```

## Changements

### 1. Nouvelle Edge Function `process-fund-completion` 

Déclenchée quand la cagnotte atteint `target_reached`. Elle :

- Récupère le produit lié via `business_collective_funds`
- Crée une `business_order` automatique (statut `pending`, payment_method repris des contributions)
- Calcule le split : prix produit original = montant prestataire, différence = commission JDV
- Insère dans `payment_splits` avec `vendor_transfer_status: 'pending'`
- Déduplication : vérifie qu'aucune commande n'existe déjà pour ce fund_id

### 2. Appeler `process-fund-completion` depuis `notify-fund-ready`

Ajouter un appel à cette fonction dans le flux existant de `notify-fund-ready`, après la vérification que la cagnotte est pleine (ligne 51-54).

### 3. Bouton admin "Marquer comme transféré" dans `CommissionsDashboard.tsx`

Ajouter un bouton pour que l'admin puisse passer `vendor_transfer_status` de `pending` à `completed` après avoir fait le virement manuel au prestataire, avec le champ `vendor_transfer_ref` pour saisir la référence du transfert.

## Distribution des fonds (Phase actuelle — manuelle)

| Destinataire | Montant | Comment |
|---|---|---|
| JDV (commission) | Prix majoré - Prix original | Reste sur le compte Wave Business JDV |
| Prestataire | Prix original du produit | Admin transfère manuellement via Wave |

## Phase future (avec API Wave)

Quand les clés API Wave seront obtenues, `process-fund-completion` pourra appeler l'API Wave Transfer pour envoyer automatiquement le montant au prestataire.

## Fichiers

- `supabase/functions/process-fund-completion/index.ts` — nouvelle Edge Function
- `supabase/functions/notify-fund-ready/index.ts` — appeler process-fund-completion
- `src/pages/Admin/CommissionsDashboard.tsx` — bouton "Marquer comme transféré"

