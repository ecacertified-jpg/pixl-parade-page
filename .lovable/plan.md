

# Plan : Permettre la saisie libre du montant pour les cagnottes self-fund

## Probleme

Quand l'utilisateur cree une cagnotte pour lui-meme et clique "Confirmer la cotisation", le modal Wave affiche le montant total du produit pre-rempli (`freeAmount={false}`, `amount={total}`). Or, pour une cagnotte collective, l'utilisateur devrait pouvoir deposer un montant minimum de son choix (sa premiere contribution), puisque ses amis completeront via leurs propres contributions.

## Solution

Pour les commandes `isSelfFund`, passer `freeAmount={true}` au composant `WavePaymentRedirect` afin que l'utilisateur saisisse librement le montant de sa contribution initiale sur la page Wave.

### Fichier : `src/pages/CollectiveCheckout.tsx`

1. Changer la prop `freeAmount` du `WavePaymentRedirect` : `freeAmount={isSelfFund}` au lieu de `freeAmount={false}`
2. Adapter le texte du bouton de confirmation pour les self-funds : "Lancer ma cagnotte" au lieu de "Confirmer la cotisation - {total} F"
3. Ajouter un message explicatif au-dessus du bouton pour les self-funds : "Deposez un montant de votre choix pour lancer votre cagnotte. Vos amis contribueront ensuite."

| Fichier | Modification |
|---------|-------------|
| `src/pages/CollectiveCheckout.tsx` | `freeAmount={isSelfFund}`, texte bouton adapte, message explicatif |

