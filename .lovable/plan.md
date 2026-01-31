

# Améliorer les Messages d'Erreur de Géolocalisation

## Situation Actuelle

Les messages d'erreur actuels sont très basiques :
- `"Permission de géolocalisation refusée"` - Pas d'aide pour l'utilisateur
- `"Position non disponible"` - Aucune explication
- `"Délai de géolocalisation dépassé"` - Aucune solution proposée

L'erreur s'affiche simplement comme texte rouge sans instructions pour résoudre le problème.

## Solution Proposée

Transformer le simple message d'erreur en une boîte d'aide détaillée avec :
1. **Description claire du problème**
2. **Instructions pas-à-pas** pour activer le GPS
3. **Bouton pour réessayer**

## Nouveau Design de l'Affichage d'Erreur

```text
┌────────────────────────────────────────────────┐
│ ⚠️ Permission de géolocalisation refusée      │
├────────────────────────────────────────────────┤
│ Pour activer la localisation :                 │
│                                                │
│ 📱 Sur mobile :                                │
│    1. Ouvrez les paramètres du navigateur     │
│    2. Autorisations du site > Localisation    │
│    3. Sélectionnez "Autoriser"                │
│                                                │
│ 💻 Sur ordinateur :                            │
│    Cliquez sur l'icône 🔒 dans la barre       │
│    d'adresse et activez la localisation       │
│                                                │
│           [ 🔄 Réessayer ]                     │
└────────────────────────────────────────────────┘
```

## Messages par Type d'Erreur

| Code d'Erreur | Message Amélioré | Instructions |
|---------------|------------------|--------------|
| PERMISSION_DENIED | Permission refusée | Comment autoriser dans les paramètres |
| POSITION_UNAVAILABLE | Signal GPS non disponible | Vérifier GPS activé, aller en extérieur |
| TIMEOUT | Délai dépassé | Améliorer le signal, réessayer |

## Modifications Techniques

### 1. Nouveau Type pour les Erreurs de Géolocalisation

```typescript
interface GeoErrorInfo {
  title: string;
  description: string;
  instructions: string[];
  icon: 'permission' | 'signal' | 'timeout';
}
```

### 2. Modifier le State d'Erreur

Remplacer le state string par un objet structuré :

```typescript
// Avant
const [geoError, setGeoError] = useState<string | null>(null);

// Après  
const [geoError, setGeoError] = useState<GeoErrorInfo | null>(null);
```

### 3. Messages d'Erreur Détaillés

```typescript
case error.PERMISSION_DENIED:
  setGeoError({
    title: "Permission de géolocalisation refusée",
    description: "Votre navigateur a bloqué l'accès à votre position.",
    instructions: [
      "Cliquez sur l'icône 🔒 dans la barre d'adresse",
      "Trouvez 'Localisation' ou 'Position'",
      "Sélectionnez 'Autoriser'",
      "Rechargez la page si nécessaire"
    ],
    icon: 'permission'
  });
  break;

case error.POSITION_UNAVAILABLE:
  setGeoError({
    title: "Signal GPS non disponible",
    description: "Impossible de déterminer votre position actuelle.",
    instructions: [
      "Vérifiez que le GPS est activé sur votre appareil",
      "Si vous êtes en intérieur, essayez près d'une fenêtre",
      "Désactivez le mode avion si activé",
      "Attendez quelques secondes et réessayez"
    ],
    icon: 'signal'
  });
  break;

case error.TIMEOUT:
  setGeoError({
    title: "Délai de géolocalisation dépassé",
    description: "La recherche de votre position a pris trop de temps.",
    instructions: [
      "Vérifiez votre connexion internet",
      "Déplacez-vous vers un endroit avec meilleur signal",
      "Fermez les autres applications utilisant le GPS",
      "Réessayez dans quelques instants"
    ],
    icon: 'timeout'
  });
  break;
```

### 4. Nouveau Composant d'Affichage d'Erreur

Transformer le simple texte en une carte informative avec :
- Icône colorée selon le type d'erreur
- Liste d'instructions numérotées
- Bouton "Réessayer" intégré
- Bouton "Fermer" pour masquer le message

### 5. Import des Nouvelles Icônes

Ajouter `X` (fermer) et `RefreshCw` (réessayer) aux imports Lucide.

## Fichier à Modifier

| Fichier | Modifications |
|---------|--------------|
| `src/components/LocationPicker.tsx` | Type GeoErrorInfo, nouveau state, messages détaillés, nouveau rendu JSX |

## Style

- Fond ambre/jaune clair pour les erreurs récupérables
- Fond rouge clair pour les erreurs de permission
- Texte lisible avec contraste suffisant
- Responsive pour mobile et desktop

## Résultat Attendu

- L'utilisateur comprend immédiatement pourquoi la géolocalisation a échoué
- Des instructions claires et adaptées au contexte (mobile vs desktop)
- Un bouton "Réessayer" accessible sans avoir à chercher
- Possibilité de fermer le message pour utiliser la carte manuellement

