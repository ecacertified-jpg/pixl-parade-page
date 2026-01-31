
# Sélecteur d'Adresse Hiérarchique avec Quartiers

## Contexte et Objectif

L'utilisateur souhaite un système de sélection d'adresse plus précis pour les inscriptions client et prestataire. La hiérarchie souhaitée est :

| Niveau | Exemple | Champ actuel |
|--------|---------|--------------|
| Ville | Abidjan, Bouaké | `region` (parent) |
| Commune | Yopougon, Cocody | `name` (avec `region: "Abidjan"`) |
| Quartier | Siporex, Niangon Sud | **À AJOUTER** |

Le but est de permettre le tri par proximité GPS grâce à des adresses structurées.

## Architecture de Données Proposée

### Nouvelle Structure CityCoordinates

```typescript
interface CityCoordinates {
  name: string;           // "Siporex"
  lat: number;
  lng: number;
  aliases: string[];
  region?: string;        // "Yopougon" (commune parent)
  parentCity?: string;    // "Abidjan" (ville parent pour les quartiers)
  type?: 'city' | 'commune' | 'neighborhood';
}
```

### Hiérarchie des Données

```text
Abidjan (type: city)
├── Yopougon (type: commune, region: Abidjan)
│   ├── Siporex (type: neighborhood, parentCity: Yopougon)
│   ├── Niangon Sud (type: neighborhood, parentCity: Yopougon)
│   ├── Niangon Nord (type: neighborhood, parentCity: Yopougon)
│   ├── Zone Industrielle (type: neighborhood, parentCity: Yopougon)
│   └── Millionnaire (type: neighborhood, parentCity: Yopougon)
├── Cocody (type: commune, region: Abidjan)
│   ├── Riviera 2 (type: neighborhood, parentCity: Cocody)
│   ├── Riviera 3 (type: neighborhood, parentCity: Cocody)
│   ├── Angré (type: neighborhood, parentCity: Cocody)
│   └── Deux Plateaux (type: neighborhood, parentCity: Cocody)
└── Marcory (type: commune, region: Abidjan)
    ├── Zone 4 (type: neighborhood, parentCity: Marcory)
    └── Anoumabo (type: neighborhood, parentCity: Marcory)

Bouaké (type: city)
├── Commerce (type: neighborhood, parentCity: Bouaké)
├── Koko (type: neighborhood, parentCity: Bouaké)
└── Air France (type: neighborhood, parentCity: Bouaké)
```

## Nouveau Composant : AddressSelector

### Comportement

Le composant propose une sélection en cascade avec 2 niveaux dynamiques :

**Pour Abidjan (grande ville avec communes) :**
1. Sélectionner la **commune** (Yopougon, Cocody...)
2. Sélectionner le **quartier** ou en ajouter un nouveau

**Pour les autres villes (sans communes) :**
1. Sélectionner la **ville** (Bouaké, Daloa...)
2. Sélectionner le **quartier** ou en ajouter un nouveau

### Interface Utilisateur

```text
┌─────────────────────────────────────────────────────────────┐
│ Adresse                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Ville / Commune *                                          │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 📍 Sélectionner une ville...                   ▼  │     │
│  └───────────────────────────────────────────────────┘     │
│    🏙️ Abidjan (communes)                                   │
│       • Cocody                                              │
│       • Yopougon                                            │
│       • Marcory                                             │
│    🏘️ Autres villes                                         │
│       • Bouaké                                              │
│       • Yamoussoukro                                        │
│                                                             │
│  Quartier                                                   │
│  ┌───────────────────────────────────────────────────┐     │
│  │ 🔍 Rechercher ou ajouter un quartier...           │     │
│  └───────────────────────────────────────────────────┘     │
│    Quartiers populaires :                                   │
│       • Siporex                                             │
│       • Niangon Sud                                         │
│       • Zone Industrielle                                   │
│    ────────────────────────────                            │
│    + Ajouter "Mon quartier"                                 │
│                                                             │
│  📍 Adresse complète : Siporex, Yopougon                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Données Retournées

```typescript
interface AddressResult {
  city: string;              // "Yopougon" ou "Bouaké"
  neighborhood: string;      // "Siporex" ou valeur personnalisée
  fullAddress: string;       // "Siporex, Yopougon"
  parentCity?: string;       // "Abidjan" si commune
  latitude: number;
  longitude: number;
  isCustomNeighborhood: boolean;
}
```

## Modifications par Fichier

### 1. src/utils/ivoryCoastCities.ts

Ajouter les quartiers des communes principales d'Abidjan et de quelques grandes villes :

| Commune | Quartiers à ajouter |
|---------|---------------------|
| Yopougon | Siporex, Niangon Sud, Niangon Nord, Zone Industrielle, Millionnaire, Selmer, Sicogi, Gesco, Toits Rouges, Port-Bouët 2 |
| Cocody | Riviera 2, Riviera 3, Riviera 4, Angré, Deux Plateaux, Riviera Palmeraie, II Plateaux, Saint-Jean, Bonoumin |
| Marcory | Zone 4, Anoumabo, Biétry, Marcory Résidentiel |
| Abobo | Avocatier, Plaque, Dokui, Sagbé, PK18 |
| Treichville | Avenue 10, Marché, Abattoir |
| Adjamé | Liberté, Williamsville, Agban, Bromakoté |
| Bouaké | Commerce, Koko, Air France, Belleville, Dar-es-Salam |
| ... | (autres quartiers selon besoin) |

### 2. src/components/AddressSelector.tsx (Nouveau)

Composant réutilisable avec :
- Premier sélecteur : Villes principales + communes d'Abidjan (groupées)
- Second sélecteur : Quartiers de la ville/commune sélectionnée
- Option d'ajout de quartier personnalisé
- Affichage de l'adresse complète formatée
- Retour des coordonnées GPS

### 3. src/utils/countryCities.ts

Nouvelles fonctions utilitaires :

```typescript
// Obtenir les villes/communes de premier niveau
getMainLocations(countryCode: string): CityCoordinates[]

// Obtenir les quartiers d'une commune/ville
getNeighborhoodsOf(countryCode: string, locationName: string): CityCoordinates[]

// Trouver les coordonnées d'un quartier (ou de son parent)
getCoordinatesFor(countryCode: string, city: string, neighborhood?: string): {lat: number, lng: number}
```

### 4. src/pages/Auth.tsx

Remplacer le champ texte `city` par `AddressSelector` :

```tsx
// Avant (ligne 944-952)
<Input id="city" placeholder="Votre ville" {...signUpForm.register('city')} />

// Après
<AddressSelector
  onAddressChange={(data) => {
    signUpForm.setValue('city', data.fullAddress);
  }}
/>
```

### 5. src/pages/BusinessAuth.tsx

Remplacer le champ texte `address` par `AddressSelector` dans 2 endroits :
- Formulaire d'inscription principale (ligne 1368-1375)
- Formulaire de complétion post-Google Auth (ligne 968-975)

## Quartiers à Ajouter (Données Initiales)

### Yopougon (~50 quartiers majeurs)
| Quartier | Lat | Lng |
|----------|-----|-----|
| Siporex | 5.3583 | -4.0722 |
| Niangon Sud | 5.3417 | -4.1028 |
| Niangon Nord | 5.3533 | -4.1083 |
| Zone Industrielle | 5.3111 | -4.0611 |
| Millionnaire | 5.3389 | -4.0694 |
| Selmer | 5.3306 | -4.0667 |
| Sicogi | 5.3333 | -4.0889 |
| Gesco | 5.3417 | -4.0917 |
| Toits Rouges | 5.3472 | -4.0778 |
| Port-Bouët 2 | 5.3528 | -4.0833 |

### Cocody (~40 quartiers majeurs)
| Quartier | Lat | Lng |
|----------|-----|-----|
| Riviera 2 | 5.3611 | -3.9694 |
| Riviera 3 | 5.3694 | -3.9556 |
| Riviera 4 | 5.3750 | -3.9472 |
| Angré | 5.3806 | -3.9583 |
| Deux Plateaux | 5.3556 | -3.9667 |
| Riviera Palmeraie | 5.3611 | -3.9389 |
| Saint-Jean | 5.3639 | -3.9833 |
| Bonoumin | 5.3667 | -3.9611 |
| Akouédo | 5.3556 | -3.9278 |

### Marcory (~15 quartiers)
| Quartier | Lat | Lng |
|----------|-----|-----|
| Zone 4 | 5.3139 | -3.9833 |
| Anoumabo | 5.3028 | -3.9750 |
| Biétry | 5.3000 | -3.9861 |
| Marcory Résidentiel | 5.3056 | -3.9889 |

(et ainsi de suite pour les autres communes et villes...)

## Résumé des Fichiers

| Fichier | Action |
|---------|--------|
| `src/utils/ivoryCoastCities.ts` | Modifier - Ajouter ~150 quartiers |
| `src/utils/countryCities.ts` | Modifier - Nouvelles fonctions utilitaires |
| `src/components/AddressSelector.tsx` | Créer - Nouveau composant |
| `src/pages/Auth.tsx` | Modifier - Intégrer AddressSelector |
| `src/pages/BusinessAuth.tsx` | Modifier - Intégrer AddressSelector (2 endroits) |

## Avantages de cette Approche

| Aspect | Bénéfice |
|--------|----------|
| **Données cohérentes** | Adresses structurées pour tous les utilisateurs |
| **GPS intégré** | Chaque sélection fournit des coordonnées |
| **Flexibilité** | Possibilité d'ajouter des quartiers personnalisés |
| **Tri par proximité** | Les coordonnées permettent le calcul de distance |
| **UX améliorée** | Sélection guidée au lieu de saisie libre |
| **Scalabilité** | Facile d'ajouter d'autres pays (Bénin, Sénégal) |
