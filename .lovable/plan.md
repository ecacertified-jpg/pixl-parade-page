

# Plan : Transformer le bouton rose en option Mobile Money (Orange/MTN)

## Problème

Le modal de contribution affiche un bouton "Modifier"/"Contribuer" (rose) qui enregistre la contribution sans paiement réel. Il faut le transformer en option Mobile Money.

## Changement — `src/components/ContributionModal.tsx`

### Remplacer le bouton rose par un bouton Mobile Money

Dans le footer (lignes 588-599), transformer le bouton rose en bouton Mobile Money :

- Style : gradient orange classique avec icône `Phone`
- Label : `"Contribuer via Mobile Money"` / `"Modifier via Mobile Money"`
- Au clic : ouvrir le même flux CinetPay déjà utilisé dans `Checkout.tsx` pour Orange/MTN
- Le bouton appellera `handleSubmit` avec `payment_method: 'mobile_money'` au lieu d'un submit sans paiement

### Layout final des boutons

```text
[  Contribuer via Wave 🌊  ]     ← teal, pleine largeur
[ Contribuer via Mobile Money ]   ← orange/gradient, pleine largeur
[  Annuler  ]                     ← outline, pleine largeur
```

### Logique de paiement Mobile Money

Vérifier si un composant de paiement CinetPay existe déjà pour les contributions. Si oui, l'intégrer. Sinon, utiliser le même pattern que Wave : redirection vers le flux Mobile Money existant, puis confirmation.

## Fichier modifié

- `src/components/ContributionModal.tsx`

