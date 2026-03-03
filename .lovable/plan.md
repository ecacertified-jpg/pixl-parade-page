

# Diagnostic : session WhatsApp differente du navigateur principal

## Cause racine identifiee

Le navigateur integre de WhatsApp a ses propres cookies/session, independants du navigateur principal. Quand le prestataire clique le lien WhatsApp :

1. WhatsApp ouvre son navigateur interne
2. L'utilisateur n'est pas connecte → redirection vers `/auth`
3. Apres connexion, la page charge mais le RPC `get_business_fund_for_owner` verifie `auth.uid()` = proprietaire du business
4. Si l'utilisateur se connecte avec un compte different (ou si la session est instable), le RPC retourne `NULL` → "Cagnotte introuvable"

Le dashboard fonctionne car il utilise un pattern different (`useBusinessCollectiveFunds`) qui passe par les requetes directes avec RLS, pas par le RPC.

## Solution : fallback sur la requete directe

Modifier `BusinessFundOrderView.tsx` pour ajouter un fallback : si le RPC echoue (retourne NULL), essayer la meme approche que le dashboard -- requete directe sur `business_collective_funds` jointe a `business_accounts` filtree par `user_id`.

### Logique modifiee dans `BusinessFundOrderView.tsx`

```
1. Appel RPC get_business_fund_for_owner(fundId)
2. Si resultat → afficher la cagnotte (comme aujourd'hui)
3. Si NULL → fallback :
   a. Charger les business_accounts du user
   b. Charger business_collective_funds WHERE fund_id = fundId
   c. Verifier que business_id est dans les comptes du user
   d. Charger les donnees associees (fund, product, beneficiary, order, contributors)
   e. Afficher la cagnotte
4. Si fallback echoue aussi → afficher "Cagnotte introuvable"
```

Ce fallback reproduit exactement ce que fait le hook `useBusinessCollectiveFunds` qui fonctionne dans le dashboard.

### Fichier concerne

- **Modifie** : `src/pages/BusinessFundOrderView.tsx` -- ajout du fallback apres echec RPC

