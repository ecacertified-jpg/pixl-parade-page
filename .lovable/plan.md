

# Ajouter un Indicateur Visuel de Localisation GPS Manquante

## Objectif

Afficher un bandeau d'alerte sur le dashboard prestataire lorsque la localisation GPS (latitude/longitude) de la boutique n'est pas encore définie, encourageant le prestataire à compléter cette information importante.

## Contexte

- Les prestataires peuvent définir leur localisation via `/business-profile-settings` (onglet Contact)
- Le composant `LocationPicker` permet la saisie sur carte ou par nom de lieu
- La table `business_accounts` contient les champs `latitude` et `longitude`
- Le hook `useBusinessAccount` récupère déjà ces coordonnées
- Le dashboard (`BusinessAccount.tsx`) affiche déjà des alertes comme l'onboarding checklist

## Solution

Créer un nouveau composant `BusinessLocationAlert` qui :
1. Vérifie si la boutique sélectionnée a des coordonnées GPS
2. Affiche une alerte stylisée si les coordonnées sont manquantes
3. Propose un bouton pour accéder directement aux paramètres

## Architecture

```text
BusinessAccount.tsx
├── Header
├── BusinessOnboardingChecklist (existant)
├── BusinessLocationAlert (NOUVEAU)  <-- Affiche l'alerte si pas de GPS
├── Stats Cards
└── Tabs (Vue d'ensemble, Produits, etc.)
```

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/BusinessLocationAlert.tsx` | Créer | Nouveau composant d'alerte GPS |
| `src/pages/BusinessAccount.tsx` | Modifier | Intégrer le composant d'alerte |

## Détails Techniques

### 1. Nouveau Composant : `BusinessLocationAlert.tsx`

Le composant vérifiera si la boutique a des coordonnées valides et affichera une alerte si ce n'est pas le cas :

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MapPin, AlertCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface BusinessLocationAlertProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

export const BusinessLocationAlert = ({ 
  latitude, 
  longitude, 
  address 
}: BusinessLocationAlertProps) => {
  const navigate = useNavigate();
  
  // Vérifier si la localisation GPS est définie
  const hasGpsLocation = latitude !== null && 
                         latitude !== undefined && 
                         longitude !== null && 
                         longitude !== undefined;
  
  // Ne pas afficher si la localisation est définie
  if (hasGpsLocation) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/30">
        <MapPin className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800 dark:text-orange-300">
          Localisation GPS manquante
        </AlertTitle>
        <AlertDescription className="text-orange-700 dark:text-orange-400">
          <p className="mb-3">
            Ajoutez la position GPS de votre boutique pour apparaître dans les 
            recherches par proximité et faciliter les livraisons.
          </p>
          <Button 
            size="sm" 
            variant="outline"
            className="border-orange-500 text-orange-700 hover:bg-orange-100"
            onClick={() => navigate('/business-profile-settings')}
          >
            Définir ma localisation
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};
```

### 2. Modification : `BusinessAccount.tsx`

Récupérer les données de localisation du business sélectionné et afficher l'alerte :

**Ajouts :**

1. **Import du composant** (en haut du fichier) :
```tsx
import { BusinessLocationAlert } from "@/components/BusinessLocationAlert";
```

2. **Récupérer le business sélectionné avec ses coordonnées** :
Le state `businesses` contient déjà toutes les données (via `select('*')`), donc on peut dériver :
```tsx
// Trouver le business sélectionné avec ses coordonnées
const currentBusiness = businesses.find(b => b.id === selectedBusinessId);
```

3. **Afficher l'alerte** (après l'onboarding checklist, avant les stats) :
```tsx
{/* Alerte localisation GPS manquante */}
{selectedBusinessId && currentBusiness && (
  <BusinessLocationAlert
    latitude={currentBusiness.latitude}
    longitude={currentBusiness.longitude}
    address={currentBusiness.address}
  />
)}
```

## Positionnement de l'Alerte

```text
┌─────────────────────────────────────┐
│ Header (Mon Espace Business)        │
├─────────────────────────────────────┤
│ BusinessOnboardingChecklist         │  ← Si pas complété
├─────────────────────────────────────┤
│ ⚠️ BusinessLocationAlert            │  ← NOUVEAU - Si pas de GPS
├─────────────────────────────────────┤
│ Stats Cards (Produits, Commandes..) │
├─────────────────────────────────────┤
│ Tabs (Vue d'ensemble, ...)          │
└─────────────────────────────────────┘
```

## UX et Design

| Aspect | Description |
|--------|-------------|
| Couleur | Orange (warning) - pas bloquant mais important |
| Icône | MapPin pour la localisation |
| Animation | Fade-in avec Framer Motion |
| Action | Bouton "Définir ma localisation" menant aux paramètres |
| Condition | Masqué dès que latitude ET longitude sont renseignées |
| Responsive | Pleine largeur sur mobile et desktop |

## Avantages

1. **Visibilité** - L'alerte est placée en haut du dashboard, très visible
2. **Non-bloquante** - Orange plutôt que rouge, le prestataire peut continuer à utiliser l'app
3. **Actionable** - Bouton direct vers les paramètres pour corriger
4. **Smart** - Disparaît automatiquement une fois la localisation définie
5. **Cohérente** - Suit le pattern existant des alertes dans l'application

