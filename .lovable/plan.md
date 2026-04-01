

# Plan : Masquer le champ "Donateur" pour les cagnottes self-fund

## Problème

Sur la page "Finaliser la cotisation", le champ "Numéro de téléphone du donateur" est affiché même quand l'utilisateur crée une cagnotte pour lui-même. Dans ce cas, il est le bénéficiaire, pas un donateur — ce champ n'a pas de sens.

## Solution

Détecter si les articles sont en mode `isSelfFund` et :

1. **Masquer** le champ "Numéro de téléphone du donateur" 
2. **Pré-remplir** le téléphone du bénéficiaire avec le numéro de l'utilisateur connecté (depuis `user.phone` ou `user_metadata`)
3. **Adapter la validation** : ne plus exiger `donorPhone` quand c'est un self-fund
4. **Adapter l'insertion** : envoyer `donor_phone` vide ou égal au bénéficiaire pour le self-fund
5. **Page de confirmation** : masquer la ligne "donateur" si self-fund

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/pages/CollectiveCheckout.tsx` | Détecter `isSelfFund`, masquer champ donateur, adapter validation et insertion |
| `src/pages/CollectiveOrderConfirmation.tsx` | Masquer la ligne donateur si `isSelfFund` |

