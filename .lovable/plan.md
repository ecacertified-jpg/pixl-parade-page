

# Redirection automatique vers le dashboard business en cas d'échec

## Contexte

Actuellement, quand le RPC et le fallback échouent tous les deux, l'utilisateur voit une page statique "Cagnotte introuvable" avec un bouton manuel. L'objectif est d'ajouter une redirection automatique après quelques secondes.

## Modification

**Fichier** : `src/pages/BusinessFundOrderView.tsx`

Dans le bloc d'erreur (quand `error || !fund`), ajouter :

1. Un `useEffect` qui démarre un compte à rebours de 5 secondes quand l'état `error` est `true`
2. À la fin du compte à rebours, `navigate('/business-collective-funds')` automatiquement
3. Afficher un message indiquant la redirection imminente avec le décompte ("Redirection dans X secondes...")
4. Conserver le bouton manuel pour ceux qui veulent cliquer immédiatement

Le composant utilisera `useNavigate` de react-router-dom (déjà disponible via les imports existants).

