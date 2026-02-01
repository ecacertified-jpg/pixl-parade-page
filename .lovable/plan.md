
# Ajout des Champs Ville/Commune et Quartier sur Toutes les Pages de Localisation

## Objectif

Remplacer les champs de saisie manuelle de localisation par le composant hierarchique `AddressSelector` existant (Ville/Commune + Quartier) dans tous les formulaires qui necessitent une adresse de livraison ou une localisation. Le composant `AddressSelector` fournit automatiquement les coordonnees GPS basees sur la selection.

## Analyse de l'Existant

Le projet dispose deja d'un composant `AddressSelector` complet qui :
- Affiche un selecteur hierarchique Ville/Commune -> Quartier
- Recupere automatiquement les coordonnees GPS associees
- Permet l'ajout de quartiers personnalises
- Est deja utilise dans les pages d'authentification (`Auth.tsx`, `BusinessAuth.tsx`)

Cependant, plusieurs autres formulaires utilisent encore :
- Le simple `CitySelector` (sans quartier)
- Des champs `Input` ou `Textarea` manuels pour l'adresse

## Pages et Composants a Modifier

### 1. CompleteProfileModal.tsx
**Etat actuel** : Utilise `CitySelector` seul
**Modification** : Remplacer par `AddressSelector` avec Ville + Quartier

### 2. ProfileSettings.tsx  
**Etat actuel** : Utilise `CitySelector` pour la ville de residence
**Modification** : Remplacer par `AddressSelector` avec Ville + Quartier

### 3. Checkout.tsx
**Etat actuel** : Utilise un `Textarea` manuel pour l'adresse de livraison
**Modification** : Remplacer par `AddressSelector` pour capturer Ville + Quartier avec GPS

### 4. AddFriendModal.tsx
**Etat actuel** : Utilise un `Input` manuel pour le lieu de residence
**Modification** : Remplacer par `AddressSelector` avec Ville + Quartier

### 5. AddressInput.tsx (composant reutilisable)
**Etat actuel** : Utilise `CitySelector` + champ texte pour adresse precise
**Modification** : Integrer `AddressSelector` pour la partie Ville + Quartier

## Details Techniques

### Modifications pour CompleteProfileModal.tsx

```text
Avant :
┌────────────────────────────────────────┐
│ Ville ou quartier de livraison        │
│ ┌────────────────────────────────────┐ │
│ │ CitySelector (ville seule)         │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘

Apres :
┌────────────────────────────────────────┐
│ 📍 Lieu de livraison                  │
│ ┌─────────────────┐ ┌────────────────┐│
│ │ Ville/Commune   │ │ Quartier       ││
│ │ [Cocody      ▼] │ │ [Angre     ▼]  ││
│ └─────────────────┘ └────────────────┘│
│ Adresse complete: Angre, Cocody       │
└────────────────────────────────────────┘
```

### Modifications pour Checkout.tsx

```text
Avant :
┌────────────────────────────────────────┐
│ Adresse de livraison *                 │
│ ┌────────────────────────────────────┐ │
│ │ Quartier, rue, points de repere... │ │
│ │ (Textarea libre)                   │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘

Apres :
┌────────────────────────────────────────┐
│ 📍 Adresse de livraison               │
│ ┌─────────────────┐ ┌────────────────┐│
│ │ Ville/Commune   │ │ Quartier       ││
│ │ [Plateau     ▼] │ │ [Indenie   ▼]  ││
│ └─────────────────┘ └────────────────┘│
│ ┌────────────────────────────────────┐ │
│ │ Precisions (rue, reperes...)       │ │
│ └────────────────────────────────────┘ │
│ Adresse: Indenie, Plateau, Abidjan    │
└────────────────────────────────────────┘
```

### Schema de Donnees

L'`AddressSelector` retourne un objet `AddressResult` :

```text
AddressResult {
  city: string           // Nom de la ville/commune
  neighborhood: string   // Nom du quartier
  fullAddress: string    // Adresse complete formatee
  parentCity?: string    // Ville parente (si commune)
  latitude: number       // Coordonnees GPS
  longitude: number      // Coordonnees GPS
  isCustomNeighborhood: boolean
}
```

## Fichiers a Modifier

| Fichier | Type de modification |
|---------|---------------------|
| `src/components/CompleteProfileModal.tsx` | Remplacer CitySelector par AddressSelector |
| `src/pages/ProfileSettings.tsx` | Remplacer CitySelector par AddressSelector |
| `src/pages/Checkout.tsx` | Remplacer Textarea par AddressSelector + champ precisions |
| `src/components/AddFriendModal.tsx` | Remplacer Input par AddressSelector |
| `src/components/AddressInput.tsx` | Remplacer CitySelector par AddressSelector |

## Impact sur les Donnees

### Champs a stocker

Pour chaque entite (profil, contact, commande), les donnees suivantes seront capturees :
- `city` : Ville ou commune selectionnee
- `neighborhood` : Quartier selectionne (optionnel)
- `full_address` : Adresse complete formatee
- `latitude` / `longitude` : Coordonnees GPS (si disponibles)

### Tables impactees

| Table | Champs existants | Nouveaux champs suggeres |
|-------|-----------------|--------------------------|
| `profiles` | `city` | Ajouter `neighborhood`, `latitude`, `longitude` |
| `contacts` | (aucun) | Ajouter `city`, `neighborhood`, `latitude`, `longitude` |
| `business_orders` | `delivery_address` | Enrichir avec quartier et GPS |

**Note** : Les colonnes `latitude` et `longitude` peuvent deja exister sur certaines tables. Une verification sera faite avant toute modification de schema.

## Ordre d'Implementation

1. **CompleteProfileModal** - Point d'entree principal pour les nouveaux utilisateurs
2. **Checkout** - Impact direct sur les commandes et livraisons
3. **ProfileSettings** - Mise a jour du profil existant
4. **AddFriendModal** - Localisation des contacts
5. **AddressInput** - Composant reutilisable pour coherence globale

## Benefices

- **Coherence UX** : Meme interface de selection sur toutes les pages
- **Precision GPS** : Chaque adresse aura des coordonnees associees
- **Livraisons optimisees** : Tri par proximite facilite
- **Donnees normalisees** : Fin des adresses en format libre
