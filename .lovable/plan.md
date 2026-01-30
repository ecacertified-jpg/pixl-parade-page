

# Ajouter la Modification de Localisation dans l'Admin

## Objectif

Permettre aux administrateurs de modifier la localisation d'une boutique :
1. **Sur carte** - Cliquer ou glisser le marqueur pour définir les coordonnées GPS
2. **Par nom de lieu** - Sélectionner une ville/adresse via le CitySelector

## Architecture

```text
AdminEditBusinessModal
├── Champs existants (nom, type, téléphone, etc.)
├── Section Adresse existante (Input simple)
│   └── REMPLACER PAR ↓
└── Section Localisation GPS (Nouveau)
    └── LocationPicker
        ├── Carte Mapbox interactive
        ├── CitySelector (adresse/ville)
        ├── Affichage coordonnées GPS
        ├── Bouton "Ma position GPS"
        └── Bouton "Recentrer"
```

## Modifications

### 1. `src/pages/Admin/BusinessManagement.tsx`

| Changement | Détails |
|------------|---------|
| Interface Business | Ajouter `latitude: number \| null` et `longitude: number \| null` |
| Query Supabase | Ajouter `latitude, longitude` à la liste des colonnes sélectionnées |

### 2. `src/components/admin/AdminEditBusinessModal.tsx`

| Changement | Détails |
|------------|---------|
| Interface Business | Ajouter `latitude: number \| null` et `longitude: number \| null` |
| Imports | Ajouter `import { LocationPicker } from "@/components/LocationPicker"` |
| État formData | Ajouter `latitude: number \| null` et `longitude: number \| null` |
| useEffect | Initialiser latitude/longitude depuis le business existant |
| handleSubmit | Inclure latitude/longitude dans updateData |
| JSX | Remplacer le champ Adresse par le composant LocationPicker |
| Audit log | Logger si la localisation a changé |

## Détails Techniques

### Interface Business Enrichie

```typescript
interface Business {
  id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  status: string;
  user_id: string;
  latitude: number | null;     // Nouveau
  longitude: number | null;    // Nouveau
}
```

### État formData Enrichi

```typescript
const [formData, setFormData] = useState({
  // ... champs existants ...
  latitude: null as number | null,
  longitude: null as number | null,
});
```

### Initialisation dans useEffect

```typescript
useEffect(() => {
  if (open && business) {
    setFormData({
      // ... autres champs ...
      address: business.address || '',
      latitude: business.latitude,
      longitude: business.longitude,
    });
  }
}, [open, business]);
```

### Remplacement de la Section Adresse

Avant (simple Input) :
```tsx
<div className="space-y-2">
  <Label>Adresse</Label>
  <Input
    value={formData.address}
    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
    placeholder="Adresse du business"
  />
</div>
```

Après (LocationPicker complet) :
```tsx
{/* Section Localisation - Admin */}
<div className="space-y-2">
  <LocationPicker
    address={formData.address}
    latitude={formData.latitude}
    longitude={formData.longitude}
    onAddressChange={(addr) => setFormData({ ...formData, address: addr })}
    onCoordinatesChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
    countryCode="CI"
    label="Localisation de la boutique (Admin)"
  />
</div>
```

### Update dans handleSubmit

```typescript
const updateData: any = {
  // ... champs existants ...
  address: formData.address.trim() || null,
  latitude: formData.latitude,
  longitude: formData.longitude,
};
```

### Audit Log Enrichi

```typescript
// Ajouter au tracking des changements
if (formData.address !== business.address) changes.push('adresse');
if (formData.latitude !== business.latitude || formData.longitude !== business.longitude) {
  changes.push('coordonnées GPS');
}
```

## Query Supabase Modifiée

Dans `BusinessManagement.tsx`, ajouter les colonnes :

```typescript
let query = supabase
  .from('business_accounts')
  .select('id, user_id, business_name, business_type, email, phone, address, description, website_url, is_verified, is_active, status, rejection_reason, corrections_message, created_at, updated_at, country_code, latitude, longitude')
  // ...
```

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Admin/BusinessManagement.tsx` | Ajouter latitude/longitude à l'interface et la query |
| `src/components/admin/AdminEditBusinessModal.tsx` | Intégrer LocationPicker + gestion des coordonnées |

## Résultat Attendu

| Aspect | Description |
|--------|-------------|
| Carte interactive | Affiche la position actuelle ou Abidjan par défaut |
| CitySelector | Liste déroulante des villes avec recherche |
| Clic sur carte | Repositionne le marqueur aux coordonnées cliquées |
| Drag du marqueur | Déplace la position GPS en temps réel |
| Géolocalisation | Bouton "Ma position GPS" pour l'admin |
| Coordonnées | Affichage des lat/lng avec badge "Position GPS" |
| Sauvegarde | Latitude, longitude et adresse enregistrées en base |
| Audit | Actions "adresse" et "coordonnées GPS" loggées |

## UX Administrateur

- La carte s'affiche directement dans le modal d'édition
- Si la boutique a déjà des coordonnées, la carte est centrée dessus
- L'admin peut modifier l'adresse textuelle ET/OU les coordonnées GPS
- Les deux informations sont indépendantes mais synchronisées via CitySelector
- Message d'aide visible : "Cliquez sur la carte ou déplacez le marqueur..."

