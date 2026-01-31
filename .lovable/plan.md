
# Enrichir le Sélecteur d'Adresse pour le Bénin et le Sénégal

## Contexte Actuel

Le système de sélection d'adresse hiérarchique (Ville/Commune -> Quartier) fonctionne actuellement uniquement pour la Côte d'Ivoire. Les fichiers des autres pays (Bénin, Sénégal) n'ont pas encore :
- Le champ `type` (city/commune/neighborhood)
- Les quartiers détaillés pour les grandes villes
- La structure parent-enfant cohérente

## Structure Hiérarchique par Pays

### Bénin
```text
Cotonou (type: city)
├── Akpakpa (type: commune)
│   ├── PK10, Agblangandan, Aïbatin... (type: neighborhood)
├── Cadjèhoun (type: commune)
│   ├── Haie Vive, Fidjrossè, Gbégamey... (type: neighborhood)
├── Dantokpa (type: commune)
│   └── Marché Dantokpa, Jonquet... (type: neighborhood)
└── ...

Porto-Novo (type: city)
├── Ouando (type: neighborhood)
├── Tokpota (type: neighborhood)
└── ...

Abomey-Calavi (type: city)
├── Godomey (type: neighborhood)
└── ...
```

### Sénégal
```text
Dakar (type: city)
├── Plateau (type: commune)
│   └── Independance, Kermel... (type: neighborhood)
├── Médina (type: commune)
│   └── Gueule Tapée, Fass... (type: neighborhood)
├── Grand Dakar (type: commune)
│   └── HLM, Sicap Liberté... (type: neighborhood)
├── Parcelles Assainies (type: commune)
│   └── U1-U26 (unités)... (type: neighborhood)
└── ...

Pikine (type: city - banlieue)
├── Pikine Est (type: neighborhood)
├── Pikine Ouest (type: neighborhood)
└── ...

Thiès (type: city)
├── Thiès Nord (type: neighborhood)
└── ...
```

## Modifications par Fichier

### 1. src/utils/beninCities.ts

Enrichir avec la structure hiérarchique et ajouter ~80 quartiers :

| Ville/Commune | Quartiers à ajouter |
|---------------|---------------------|
| **Cotonou - Akpakpa** | PK10, Agblangandan, Aïbatin, Womey, Sènadé |
| **Cotonou - Cadjèhoun** | Les Cocotiers, Fidjrossè Kpota, Patte d'Oie |
| **Cotonou - Dantokpa** | Marché Dantokpa, Jonquet, Missèbo |
| **Cotonou - Gbégamey** | Vodjè, Houéyiho, Akpakpa Centre |
| **Cotonou - Haie Vive** | Zogbo, Cica Toyota, Saint-Michel |
| **Porto-Novo** | Ouando, Tokpota, Djègan, Houinmè, Agbokou |
| **Abomey-Calavi** | Godomey, Togba, Zogbadjè, Tankpè, Akassato |
| **Parakou** | Banikanni, Tourou, Albarika, Zongo |

### 2. src/utils/senegalCities.ts

Enrichir avec la structure hiérarchique et ajouter ~100 quartiers :

| Ville/Commune | Quartiers à ajouter |
|---------------|---------------------|
| **Dakar - Plateau** | Indépendance, Kermel, Sandaga |
| **Dakar - Médina** | Gueule Tapée, Fass, Colobane, Rebeuss |
| **Dakar - Grand Dakar** | HLM, Sicap Liberté, Sicap Baobabs |
| **Dakar - Parcelles** | Unités 1-26, Grand Médine |
| **Dakar - Almadies** | Ngor, Virage, Mamelles |
| **Dakar - Mermoz** | Sacré-Cœur 1-3, Sicap Foire |
| **Pikine** | Pikine Est, Pikine Ouest, Tally Boumack, Guinaw Rails |
| **Guédiawaye** | Golf, Sam Notaire, Wakhinane, Ndiarème |
| **Rufisque** | Rufisque Est, Rufisque Ouest, Keury Kao |
| **Thiès** | Thiès Nord, Grand Standing, HLM, Diakhao |
| **Saint-Louis** | Sor, Guet Ndar, Ndar Toute, Île de Saint-Louis |

### 3. src/utils/countryCities.ts

Généraliser `getMainLocations()` pour supporter tous les pays :

```typescript
// Mapping des grandes villes avec arrondissements par pays
const MAJOR_CITY_MAPPING: Record<string, string[]> = {
  CI: ["Abidjan"],        // Abidjan a des communes
  BJ: ["Cotonou"],        // Cotonou a des arrondissements
  SN: ["Dakar"],          // Dakar a des communes d'arrondissement
};

export function getMainLocations(countryCode: string): { 
  majorCityCommunes: CityCoordinates[];
  majorCityName: string | null;
  otherCities: CityCoordinates[];
} {
  const majorCities = MAJOR_CITY_MAPPING[countryCode] || [];
  // Logique généralisée...
}
```

### 4. src/components/AddressSelector.tsx

Adapter pour afficher dynamiquement le nom de la grande ville selon le pays :

- Côte d'Ivoire : "🏙️ Abidjan (communes)"
- Bénin : "🏙️ Cotonou (arrondissements)"
- Sénégal : "🏙️ Dakar (communes)"

```typescript
const majorCityLabel = useMemo(() => {
  switch (countryCode) {
    case "BJ": return "🏙️ Cotonou (arrondissements)";
    case "SN": return "🏙️ Dakar (communes)";
    case "CI": 
    default: return "🏙️ Abidjan (communes)";
  }
}, [countryCode]);
```

## Données Détaillées à Ajouter

### Quartiers de Cotonou (Bénin)

| Arrondissement | Quartiers | Lat | Lng |
|----------------|-----------|-----|-----|
| Akpakpa | PK10 | 6.3750 | 2.4583 |
| Akpakpa | Agblangandan | 6.3861 | 2.4694 |
| Akpakpa | Aïbatin | 6.3694 | 2.4556 |
| Cadjèhoun | Patte d'Oie | 6.3583 | 2.3806 |
| Cadjèhoun | Fidjrossè Kpota | 6.3500 | 2.3556 |
| Haie Vive | Zogbo | 6.3722 | 2.4028 |
| Haie Vive | Cica Toyota | 6.3639 | 2.3972 |
| Dantokpa | Jonquet | 6.3556 | 2.4250 |
| Gbégamey | Vodjè | 6.3750 | 2.3917 |
| Gbégamey | Houéyiho | 6.3639 | 2.3833 |

### Quartiers de Dakar (Sénégal)

| Commune | Quartiers | Lat | Lng |
|---------|-----------|-----|-----|
| Plateau | Indépendance | 14.6700 | -17.4350 |
| Plateau | Kermel | 14.6656 | -17.4400 |
| Médina | Gueule Tapée | 14.6750 | -17.4500 |
| Médina | Fass | 14.6778 | -17.4583 |
| Médina | Colobane | 14.6806 | -17.4528 |
| Grand Dakar | HLM | 14.7000 | -17.4500 |
| Grand Dakar | Sicap Liberté | 14.7083 | -17.4528 |
| Almadies | Virage | 14.7417 | -17.5083 |
| Almadies | Mamelles | 14.7333 | -17.5000 |
| Mermoz | Sacré-Cœur 1 | 14.7056 | -17.4750 |
| Mermoz | Sacré-Cœur 2 | 14.7083 | -17.4806 |
| Mermoz | Sacré-Cœur 3 | 14.7111 | -17.4861 |
| Parcelles | Unité 17 | 14.7667 | -17.4167 |
| Parcelles | Grand Médine | 14.7583 | -17.4250 |

## Résumé des Fichiers à Modifier

| Fichier | Action | Lignes estimées |
|---------|--------|-----------------|
| `src/utils/beninCities.ts` | Ajouter types + ~80 quartiers | +150 lignes |
| `src/utils/senegalCities.ts` | Ajouter types + ~100 quartiers | +180 lignes |
| `src/utils/countryCities.ts` | Généraliser getMainLocations | +30 lignes |
| `src/components/AddressSelector.tsx` | Adapter labels dynamiques | +15 lignes |

## Avantages

| Aspect | Bénéfice |
|--------|----------|
| **Parité fonctionnelle** | Même expérience pour tous les pays |
| **Données GPS précises** | Tri par proximité possible partout |
| **Extensibilité** | Facile d'ajouter d'autres pays |
| **UX cohérente** | Interface identique quel que soit le pays |
