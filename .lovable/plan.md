
# Correction du Sélecteur de Localisation pour les Prestataires

## Problème Identifié

Le composant `LocationPicker` (utilisé pour définir la position GPS des boutiques) utilise actuellement le composant `CitySelector` qui affiche **toutes les villes et quartiers dans une liste plate unique**. Cela ne permet pas une sélection hiérarchique Ville → Quartier comme le fait `AddressSelector`.

De plus, plusieurs communes d'Abidjan n'ont **aucun quartier défini** dans les données :
- Anyama, Bingerville, Songon, Attécoubé, Plateau (5 communes sans quartiers)

## Solution en Deux Parties

### Partie 1 : Remplacer CitySelector par AddressSelector dans LocationPicker

Le composant `LocationPicker` sera modifié pour utiliser `AddressSelector` à la place de `CitySelector`. Cela permettra :
- Sélection hiérarchique : Ville/Commune → Quartier
- Accès aux quartiers après sélection de la commune
- Cohérence avec les autres formulaires d'adresse

```text
AVANT (CitySelector - liste plate) :
┌─────────────────────────────────────────────────┐
│ Adresse / Ville                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📍 Anyama Grand Séminaire              ▼   │ │
│ └─────────────────────────────────────────────┘ │
│ (Un seul champ - pas de séparation Ville/Quartier)
└─────────────────────────────────────────────────┘

APRÈS (AddressSelector - hiérarchique) :
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ 🌍 Pays: 🇨🇮 Côte d'Ivoire                ▼ │ │
│ └─────────────────────────────────────────────┘ │
│ ┌──────────────────┐  ┌──────────────────────┐  │
│ │ Ville / Commune  │  │ Quartier             │  │
│ │ [Anyama       ▼] │  │ [Grand Séminaire  ▼] │  │
│ └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Partie 2 : Ajouter les Quartiers des Communes Manquantes

Enrichir les données pour les 5 communes d'Abidjan sans quartiers :

| Commune | Quartiers à ajouter |
|---------|---------------------|
| Anyama | Grand Séminaire, Aka, Azaguié-Gare, Groupement, Centre, RAN, Soweto, Zossonkoi |
| Bingerville | Centre-ville, Cité des Cadres, Gbagba, Akouai Santé, Jean Folly, M'Pouto, Eloka |
| Songon | Songon-Agban, Songon-Kassemblé, Songon-Té, Songon-Dagbé, Centre |
| Attécoubé | Locodjro, Santé, Agban-Village, Boribana, Centre, Abidjan-Faîto, Abobo-Doumé |
| Plateau | Centre Administratif, Indénié, Blockhauss, Commerce, Gare du Sud |

Cela ajoutera environ **35-40 nouveaux quartiers** pour couvrir ces zones.

## Fichiers à Modifier

| Fichier | Modification |
|---------|-------------|
| `src/components/LocationPicker.tsx` | Remplacer `CitySelector` par `AddressSelector` avec adaptation des props et callbacks |
| `src/utils/ivoryCoastCities.ts` | Ajouter les quartiers des 5 communes manquantes |

## Détails Techniques

### Modification de LocationPicker

Le composant devra :

1. **Changer l'import** : Remplacer `CitySelector` par `AddressSelector`
2. **Adapter les callbacks** : Utiliser `onAddressChange` qui retourne un objet `AddressResult` avec ville, quartier et coordonnées
3. **Gérer l'adresse composite** : Stocker l'adresse complète (quartier + ville) au lieu d'une seule valeur
4. **Mettre à jour les coordonnées** : Utiliser les coordonnées retournées par `AddressSelector`

### Structure des Nouveaux Quartiers

Chaque quartier suivra le format existant :

```text
{
  name: "Grand Séminaire",
  lat: 5.4850,
  lng: -4.0450,
  aliases: ["seminaire", "grand seminaire"],
  region: "Anyama",        // Parent = la commune
  type: "neighborhood"
}
```

## Impact

- Les prestataires pourront sélectionner leur quartier précis
- Cohérence de l'interface entre les formulaires clients et prestataires
- Meilleures données GPS pour la recherche par proximité
- Support du changement de pays manuel intégré
