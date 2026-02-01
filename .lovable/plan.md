
# Ajout d'un Selecteur de Pays dans les Formulaires d'Adresse

## Probleme

Actuellement, le composant `AddressSelector` utilise le pays detecte automatiquement via le contexte global `useCountry()`. Si cette detection est incorrecte (par exemple, un utilisateur en deplacement utilisant un VPN), il n'a aucun moyen de changer le pays directement dans le formulaire d'adresse pour acceder aux villes et quartiers du bon pays.

## Solution Proposee

Ajouter une option de selection de pays directement dans le composant `AddressSelector` avec deux modes :

1. **Mode par defaut** : Utilise le pays du contexte global (comportement actuel)
2. **Mode avec override** : Affiche un selecteur de pays en haut du composant permettant de choisir manuellement le pays

## Approche Technique

### Modification du Composant AddressSelector

Le composant sera enrichi avec :

- Une nouvelle prop `allowCountryOverride` (par defaut: `true`) pour activer/desactiver le selecteur de pays
- Une nouvelle prop `onCountryChange` optionnelle pour notifier le parent du changement de pays
- Un etat local `localCountryCode` pour gerer le pays selectionne dans le formulaire
- Un selecteur de pays compact affiche au-dessus des champs Ville/Commune

```text
AVANT (actuel) :
┌───────────────────────────────────────────────────────────┐
│  📍 Adresse                                               │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │ Ville/Commune   │    │ Quartier        │               │
│  │ [Cocody      ▼] │    │ [Angre       ▼] │               │
│  └─────────────────┘    └─────────────────┘               │
└───────────────────────────────────────────────────────────┘

APRES (avec override pays) :
┌───────────────────────────────────────────────────────────┐
│  📍 Adresse                                               │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Pays:  🇨🇮 Côte d'Ivoire  ▼  ← Nouveau selecteur   │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │ Ville/Commune   │    │ Quartier        │               │
│  │ [Cocody      ▼] │    │ [Angre       ▼] │               │
│  └─────────────────┘    └─────────────────┘               │
└───────────────────────────────────────────────────────────┘
```

### Nouvelle Interface AddressResult

L'objet retourne par `onAddressChange` sera enrichi avec le code pays :

```text
AddressResult {
  city: string
  neighborhood: string
  fullAddress: string
  parentCity?: string
  latitude: number
  longitude: number
  isCustomNeighborhood: boolean
  countryCode: string        // ← Nouveau champ
}
```

### Logique de Fonctionnement

1. A l'initialisation, le composant utilise le pays du contexte global
2. Si l'utilisateur change le pays via le selecteur :
   - Les villes et quartiers sont filtres pour le nouveau pays
   - La selection actuelle est reinitialisee (car les villes changent)
   - Le pays est inclus dans le resultat `AddressResult`
3. Le changement de pays dans le formulaire ne modifie PAS le contexte global

## Fichiers a Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/AddressSelector.tsx` | Ajouter le selecteur de pays et la logique d'override |

## Nouvelles Props du Composant

| Prop | Type | Defaut | Description |
|------|------|--------|-------------|
| `allowCountryOverride` | boolean | true | Affiche le selecteur de pays |
| `initialCountryCode` | string | undefined | Force un pays initial (sinon utilise le contexte) |
| `onCountryChange` | (code: string) => void | undefined | Callback quand le pays change |

## Impact sur les Formulaires Existants

Les formulaires existants (`Auth.tsx`, `CompleteProfileModal.tsx`, `Checkout.tsx`, etc.) beneficieront automatiquement de cette fonctionnalite car :

1. La nouvelle prop `allowCountryOverride` est `true` par defaut
2. Le code pays est desormais inclus dans `AddressResult`
3. Aucune modification requise pour les formulaires existants

## Comportement UX

- Le selecteur de pays est discret (format compact avec drapeau)
- Quand l'utilisateur change de pays, un message indique que les villes ont ete mises a jour
- La selection precedente (ville/quartier) est effacee pour eviter les incoherences
- Le selecteur affiche les 3 pays disponibles (Côte d'Ivoire, Benin, Senegal)
