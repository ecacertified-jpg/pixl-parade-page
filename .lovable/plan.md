

# Corriger la Localisation pour les Prestataires

## Constat Actuel

L'analyse du code révèle que la fonctionnalité est **partiellement implémentée** mais avec un problème d'UX :

| Fichier | État | Problème |
|---------|------|----------|
| `AddBusinessModal.tsx` | OK | LocationPicker utilisé correctement |
| `useBusinessAccount.ts` | OK | latitude/longitude récupérés |
| `BusinessProfileSettings.tsx` | **Problème** | Double saisie : Input adresse + LocationPicker |

### Le Problème

Dans `BusinessProfileSettings.tsx` (onglet Contact), le prestataire voit :
1. Un champ **Input "Adresse"** simple (lignes 431-441)
2. **Puis** un **LocationPicker** séparé (lignes 445-453)

Cela crée de la confusion car les deux modifient `business.address`.

## Solution

**Supprimer le champ Input "Adresse" redondant** et conserver uniquement le `LocationPicker` qui gère déjà :
- La saisie/sélection d'adresse via CitySelector
- La carte Mapbox interactive
- Les coordonnées GPS
- Le bouton de géolocalisation

## Modification

### Fichier : `src/pages/BusinessProfileSettings.tsx`

**Supprimer les lignes 430-442** (le bloc Input Adresse) :

```tsx
// À SUPPRIMER (lignes 430-442)
<div className="space-y-2">
  <Label htmlFor="address">Adresse</Label>
  <div className="relative">
    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      id="address"
      value={business.address}
      onChange={(e) => setBusiness({ ...business, address: e.target.value })}
      placeholder="Adresse de votre entreprise"
      className="pl-10"
    />
  </div>
</div>
```

**Conserver le LocationPicker existant** (lignes 444-453) qui gère tout.

## Résultat Attendu

| Avant | Après |
|-------|-------|
| 2 champs pour l'adresse | 1 seul composant LocationPicker |
| Confusion pour l'utilisateur | Interface claire et intuitive |
| Saisie manuelle uniquement | Carte + CitySelector + GPS |

## Fonctionnalités Disponibles pour les Prestataires

Après correction, dans l'onglet "Contact" de `/business-profile-settings` :

1. **Carte interactive Mapbox**
   - Clic sur la carte pour positionner le marqueur
   - Glisser le marqueur pour ajuster la position

2. **CitySelector**
   - Sélection de ville/adresse dans la liste
   - Recherche textuelle
   - Mise à jour automatique de la carte

3. **Géolocalisation GPS**
   - Bouton "Ma position GPS"
   - Détection automatique de la position

4. **Affichage des coordonnées**
   - Latitude/Longitude affichées
   - Badge "Position GPS" confirmant l'enregistrement

## Fichier à Modifier

| Fichier | Action |
|---------|--------|
| `src/pages/BusinessProfileSettings.tsx` | Supprimer le champ Input Adresse redondant (lignes 430-442) |

