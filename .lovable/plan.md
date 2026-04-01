

# Plan : Champ de saisie du montant dans le modal Wave

## Problème

Actuellement, deux flux différents :
1. **Self-fund (créateur)** : `freeAmount=true` → Wave s'ouvre sans montant, l'utilisateur doit ressaisir sur Wave
2. **Amis (ContributionModal)** : l'utilisateur saisit un montant dans le modal, puis `freeAmount=false` envoie ce montant pré-rempli à Wave → correct

Le problème du self-fund : pas de champ de saisie du montant dans `CollectiveCheckout`, donc Wave s'ouvre vide. L'utilisateur doit taper le montant deux fois.

## Solution

Ajouter un champ de saisie du montant dans `CollectiveCheckout` quand `isSelfFund=true`, puis passer ce montant à `WavePaymentRedirect` avec `freeAmount=false` (montant pré-rempli dans l'URL Wave).

Pour les amis : le flux actuel dans `ContributionModal` fonctionne déjà correctement — l'utilisateur saisit le montant, il est passé à Wave pré-rempli. Pas de changement nécessaire.

## Modifications

### Fichier : `src/pages/CollectiveCheckout.tsx`

1. Ajouter un state `selfFundAmount` (string, vide par défaut)
2. Quand `isSelfFund`, afficher un champ de saisie "Montant de votre contribution initiale" avec un input number et le suffixe "F"
3. Passer `amount={selfFundAmount}` au lieu de `amount={total}` dans `WavePaymentRedirect` quand `isSelfFund`
4. Mettre `freeAmount={false}` (toujours pré-remplir le montant saisi)
5. Désactiver le bouton "Lancer ma cagnotte" si `selfFundAmount` est vide ou ≤ 0
6. Afficher le montant saisi dans le résumé au-dessus du bouton

### Résultat

```text
Self-fund :
  [Saisissez votre contribution initiale]
  [____5000____] F
  → Bouton "Lancer ma cagnotte"
  → Wave s'ouvre avec ?amount=5000 pré-rempli

Amis (ContributionModal) :
  [Montant de la contribution]
  [____3000____] XOF
  → Bouton Wave
  → Wave s'ouvre avec ?amount=3000 pré-rempli (déjà fonctionnel)
```

