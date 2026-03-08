

## Plan: Apercu en temps reel de la page boutique dans le formulaire business

### Concept
Ajouter une section "Apercu de votre boutique" en bas du formulaire `AddBusinessModal`, avant les boutons d'action. Cette section affiche en temps reel une mini-version de la carte de contact (`VendorContactCard`) telle qu'elle apparaitra aux visiteurs, en se basant sur les valeurs actuelles du formulaire.

### Modifications

#### 1. `src/components/AddBusinessModal.tsx`

Ajouter une nouvelle `Card` "Apercu de votre boutique" apres la section paiement (ligne ~482), contenant :

- **En-tete** : icone Eye + "Apercu de votre boutique" + badge "Temps reel"
- **Mini VendorContactCard** : reutiliser directement le composant `VendorContactCard` existant avec les props du formulaire (`formData.phone`, `formData.email`, `formData.address`, `formData.website_url`, `countryCode`)
- **Message vide** : si aucun champ contact n'est rempli, afficher un texte explicatif "Remplissez les champs ci-dessus pour voir l'apercu"
- Le bouton "Voir sur la carte" du `VendorContactCard` sera desactive dans l'apercu (pas de `onShowMap`)

Le composant `VendorContactCard` est deja concu pour masquer automatiquement les champs vides — il suffit de lui passer les valeurs du formulaire.

#### Aucun autre fichier modifie
Le `VendorContactCard` existant est reutilise tel quel.

