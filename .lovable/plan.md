

## Probleme

Dans le modal "Ajouter un produit" (`AddProductModal.tsx`) utilise par les prestataires dans "Mon Espace Business", les messages d'erreur sont trop generiques :

- **Ligne 165** : `"Veuillez remplir tous les champs obligatoires"` -- ne precise pas quel champ manque (nom ? prix ? business ?)
- **Ligne 278** : `"Erreur lors de l'ajout du produit"` -- ne montre pas la raison technique (ex: contrainte de base de donnees violee)
- **Ligne 337** : `"Une erreur est survenue"` -- completement generique

## Correction prevue

### Fichier : `src/components/AddProductModal.tsx`

**1. Validation detaillee des champs (lignes 158-177)**

Remplacer la validation groupee par des verifications individuelles avec messages specifiques :

```text
// Avant
if (!formData.name || !formData.price || !formData.business_id) {
  toast.error("Veuillez remplir tous les champs obligatoires");
  return;
}

// Apres
if (!formData.name.trim()) {
  toast.error("Le nom du produit est obligatoire");
  return;
}
if (!formData.price || parseFloat(formData.price) <= 0) {
  toast.error("Le prix du produit est obligatoire et doit etre superieur a 0");
  return;
}
if (!formData.business_id) {
  toast.error("Veuillez selectionner un business");
  return;
}
```

Les validations de categorie existantes (lignes 169-177) sont deja bonnes et restent inchangees.

**2. Message d'erreur Supabase detaille (ligne 276-279)**

Analyser le code d'erreur Supabase pour donner un message utile :

```text
// Avant
toast.error("Erreur lors de l'ajout du produit");

// Apres
if (error.code === '23505') {
  toast.error("Un produit avec ce nom existe deja");
} else if (error.code === '23503') {
  toast.error("La categorie ou le business selectionne n'existe plus. Rafraichissez la page.");
} else if (error.code === '23502') {
  toast.error("Un champ obligatoire est manquant : " + (error.details || error.message));
} else {
  toast.error("Erreur lors de l'ajout : " + (error.message || "erreur inconnue"));
}
```

**3. Erreur catch generique (ligne 335-337)**

Afficher le message d'erreur reel au lieu du generique :

```text
// Avant
toast.error("Une erreur est survenue");

// Apres
const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
toast.error("Erreur lors de l'ajout du produit : " + errorMessage);
```

### Impact

- Les prestataires verront immediatement quel champ pose probleme
- Les erreurs de base de donnees seront traduites en messages comprehensibles
- Aucun changement de fonctionnalite, uniquement des messages plus precis

