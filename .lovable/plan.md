
# Rendre la Localisation GPS Obligatoire lors de la Création de Boutique

## Objectif

Ajouter une validation qui empêche la création d'une boutique si les coordonnées GPS (latitude/longitude) ne sont pas définies, afin d'améliorer le tri par proximité dans la boutique.

## Contexte Actuel

| Élément | État |
|---------|------|
| `AddBusinessModal.tsx` | Validation sur `business_name` et `business_type` uniquement |
| `LocationPicker.tsx` | Affiche déjà un indicateur "Position non définie" en jaune |
| Coordonnées initiales | `latitude: null`, `longitude: null` par défaut |

## Solution

Ajouter une validation dans `handleSubmit` du composant `AddBusinessModal.tsx` qui vérifie que les coordonnées GPS sont renseignées avant de permettre la soumission.

## Fichier à Modifier

| Fichier | Action |
|---------|--------|
| `src/components/AddBusinessModal.tsx` | Ajouter validation GPS + indicateur visuel obligatoire |

## Détails Techniques

### 1. Ajouter la validation dans `handleSubmit`

Dans la fonction `handleSubmit` (ligne 147), après les validations existantes pour `business_name` et `business_type`, ajouter une validation pour les coordonnées GPS :

```tsx
// Après la validation du business_type (lignes 158-161)
if (formData.latitude === null || formData.longitude === null) {
  toast.error("La localisation GPS est obligatoire. Cliquez sur la carte ou utilisez 'Ma position GPS'");
  return;
}
```

### 2. Mettre à jour le label du LocationPicker

Modifier l'appel au composant `LocationPicker` pour indiquer visuellement que c'est obligatoire :

```tsx
<LocationPicker
  address={formData.address || ""}
  latitude={formData.latitude ?? null}
  longitude={formData.longitude ?? null}
  onAddressChange={(value) => handleInputChange('address', value)}
  onCoordinatesChange={(lat, lng) => {
    handleInputChange('latitude', lat);
    handleInputChange('longitude', lng);
  }}
  countryCode={countryCode}
  label="Emplacement de l'entreprise *"  // Ajout de l'astérisque
/>
```

## Flux Utilisateur

```text
┌─────────────────────────────────────┐
│ Utilisateur ouvre AddBusinessModal  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Remplit le formulaire               │
│ - Nom du business *                 │
│ - Type de business *                │
│ - Emplacement de l'entreprise *     │  ← NOUVEAU: Obligatoire
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Clique sur "Créer"                  │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────────────────┐
│ GPS défini   │  │ GPS non défini           │
│ → Création   │  │ → Toast d'erreur         │
│    OK        │  │ "La localisation GPS..." │
└──────────────┘  └──────────────────────────┘
```

## Messages d'Erreur

| Cas | Message Toast |
|-----|---------------|
| GPS manquant | "La localisation GPS est obligatoire. Cliquez sur la carte ou utilisez 'Ma position GPS'" |

## Avantages

1. **Données de qualité** - Toutes les nouvelles boutiques auront des coordonnées GPS
2. **Tri par proximité** - Améliore l'expérience utilisateur dans la boutique
3. **UX cohérente** - Le `LocationPicker` montre déjà un indicateur visuel quand la position n'est pas définie
4. **Non-bloquant pour les boutiques existantes** - La validation ne s'applique qu'à la création

## Impact

- Les prestataires devront cliquer sur la carte OU utiliser "Ma position GPS" OU sélectionner une ville pour définir les coordonnées
- Le `LocationPicker` affiche déjà clairement si la position est définie ou non (icône verte avec coordonnées vs icône jaune "Position non définie")
