
# Integrer AddressSelector dans CollectiveCheckout

## Contexte
La page "Finaliser la cotisation" (`CollectiveCheckout.tsx`) utilise actuellement un simple `Textarea` pour l'adresse de livraison. La page de checkout standard (`Checkout.tsx`) utilise deja le composant `AddressSelector` avec selection hierarchique (Ville/Commune puis Quartier). L'objectif est d'aligner les deux pages.

## Modifications

### Fichier : `src/pages/CollectiveCheckout.tsx`

1. **Ajouter les imports** : Importer `AddressSelector` et `AddressResult` depuis `@/components/AddressSelector`, et retirer l'import de `Textarea`.

2. **Ajouter les etats** :
   - `addressData` (type `AddressResult | null`) pour stocker la ville et le quartier selectionnes
   - `addressDetails` (type `string`) pour les precisions supplementaires (rue, reperes)
   - Conserver `deliveryAddress` comme champ calcule a partir de ces deux valeurs

3. **Calculer l'adresse complete** : Combiner `addressDetails` + `addressData.fullAddress` pour former la valeur finale de `deliveryAddress` envoyee a la base de donnees, exactement comme dans `Checkout.tsx`.

4. **Mettre a jour la validation** : Ajuster `isFormValid()` pour verifier que `addressData` contient au moins une ville selectionnee.

5. **Remplacer le Textarea** par :
   - Un `AddressSelector` avec les labels "Ville / Commune" et "Quartier"
   - Un champ `Textarea` reduit pour les precisions (rue, reperes, instructions)

6. **Mettre a jour les donnees envoyees** : Utiliser l'adresse complete calculee dans l'insertion vers `collective_fund_orders` et dans la navigation vers la page de confirmation.

## Resultat attendu
L'utilisateur verra deux selecteurs (Ville/Commune, Quartier) suivis d'un petit champ texte pour les precisions, exactement comme sur la page de checkout standard.
