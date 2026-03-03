

# Fix: Notifications non envoyees a 100% -- insertion manquante dans `business_collective_funds`

## Cause racine

Le flux de creation de cagnotte via **`CollectiveCheckout.tsx`** insere directement dans la table `collective_funds` (ligne 156) mais **n'insere jamais dans `business_collective_funds`**. 

Quand la cagnotte atteint 100%, le trigger `notify_on_target_reached` appelle l'Edge Function `notify-fund-ready`. Cette fonction cherche une ligne dans `business_collective_funds` pour identifier le prestataire, le produit et le beneficiaire. Elle n'en trouve pas, log "Not a business fund, skipping" et s'arrete sans envoyer aucune notification.

```text
CollectiveCheckout.tsx
  |-- INSERT INTO collective_funds       --> OK
  |-- INSERT INTO collective_fund_orders --> OK
  |-- INSERT INTO business_collective_funds --> MANQUANT !
  
Quand 100% atteint:
  notify-fund-ready --> SELECT FROM business_collective_funds WHERE fund_id = ... --> vide --> SKIP
```

A noter : la fonction RPC `create_business_collective_fund` fait correctement les deux insertions, mais elle n'est utilisee que par `BusinessCollaborativeGiftModal.tsx`, pas par le checkout standard.

## Correction

### Fichier modifie : `src/pages/CollectiveCheckout.tsx`

Ajouter une insertion dans `business_collective_funds` juste apres la creation du fund (ligne ~209), quand `createdByBusinessId` est present :

```text
Apres "Fund created successfully" (ligne 209) :
  SI createdByBusinessId ET fundData.id :
    INSERT INTO business_collective_funds (
      fund_id       = fundData.id,
      business_id   = createdByBusinessId,
      product_id    = businessProductId,
      beneficiary_user_id = beneficiaryUserId (recupere du contact ou item)
    )
```

Le `beneficiary_user_id` sera recupere de la meme maniere que plus bas dans le code (lignes 230-238) -- en utilisant `items[0]?.beneficiaryId` ou en faisant un lookup via `contacts.linked_user_id`.

### Impact

- Le prestataire recevra le WhatsApp `joiedevivre_fund_ready` a l'achevement
- Les contributeurs et amis recevront le WhatsApp `joiedevivre_fund_completed`
- Les notifications in-app seront creees pour tous les participants
- Aucun changement cote base de donnees ni Edge Functions

### Fichier modifie

1. `src/pages/CollectiveCheckout.tsx` -- ajout de l'insertion `business_collective_funds` apres la creation du fund

