

# Diagnostic : Pourquoi "Cagnotte introuvable" persiste

## Verification effectuee

J'ai teste la fonction RPC directement en base avec le user_id du prestataire NewTech (`aae8fedd-...`) et le fund_id `efacddcb-...` : **la fonction retourne correctement toutes les donnees** (cagnotte, produit Samsung Galaxy A16, 2 contributeurs, 88000 XOF).

Le code est aussi correct. Le probleme n'est ni dans la RPC ni dans le nettoyage de l'URL.

## Cause probable

L'application sur `joiedevivre-africa.com` (domaine de production) utilise probablement une version **anterieure** du code -- celle d'avant l'ajout de la fonction RPC. Les modifications recentes (RPC + cleanMetaParam) ne sont actives que sur le preview Lovable. Il faut **publier** l'application pour que les changements soient visibles en production.

## Plan d'action

### 1. Ajouter du logging de debug dans `BusinessFundOrderView.tsx`

Pour diagnostiquer les futurs problemes, ajouter des `console.log` qui tracent :
- Le `fundId` brut et nettoyé
- Le `user.id` au moment de l'appel
- La reponse et l'erreur de la RPC

### 2. Publier l'application

Apres le deploiement du logging, il faudra **publier** l'app vers la production (`joiedevivre-africa.com`) pour que les changements (RPC, cleanMetaParam, logging) soient actifs.

### Fichier concerne

- **Modifie** : `src/pages/BusinessFundOrderView.tsx` (ajout de 3 console.log)

