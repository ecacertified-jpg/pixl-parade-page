

# Corriger le Bouton de Fermeture Masqué du Chat AI

## Problème

Le bouton X de fermeture du chat AI est partiellement masqué car :
- Le bouton est positionné à `-top-2 -right-2` (en dehors du conteneur)
- Le conteneur parent (Glassmorphism Card) a `overflow-hidden` qui coupe tout ce qui dépasse

## Solution

Déplacer le bouton de fermeture **en dehors** de la carte avec `overflow-hidden`, et le placer dans le conteneur `motion.div` parent qui n'a pas de contrainte d'overflow.

## Modification Technique

### Fichier : `src/components/AIChatWidget.tsx`

**Restructuration du code** (lignes 196-212) :

```text
AVANT (structure actuelle) :
├── motion.div (conteneur draggable)
│   └── div.overflow-hidden (Glassmorphism Card)
│       ├── button X (MASQUÉ par overflow-hidden)
│       └── contenu

APRÈS (nouvelle structure) :
├── motion.div (conteneur draggable)
│   ├── button X (VISIBLE, en dehors de la carte)
│   └── div.overflow-hidden (Glassmorphism Card)
│       └── contenu
```

**Code modifié** :

1. **Ligne 196** - Après l'ouverture de `motion.div`, ajouter le bouton de fermeture **avant** la carte :

```tsx
<motion.div
  // ... props existantes
  className="absolute bottom-20 right-0 mr-2 touch-pan-y"
  // ... autres props
>
  {/* Close button - Positionné en dehors de la carte pour être visible */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      setShowWelcome(false);
    }}
    className="absolute -top-2 right-0 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-md hover:bg-destructive hover:border-destructive hover:text-white transition-all duration-200 z-20 flex items-center justify-center"
    aria-label="Fermer le message de bienvenue"
  >
    <X className="h-4 w-4" />
  </button>

  {/* Glassmorphism Card */}
  <div className="relative bg-white/95 dark:bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-violet-500/20 border border-violet-200/50 dark:border-violet-500/20 p-4 max-w-[280px] overflow-hidden">
    {/* ... reste du contenu sans le bouton */}
```

2. **Supprimer** le bouton de fermeture de son emplacement actuel (lignes 202-212)

## Résultat Attendu

| Aspect | Avant | Après |
|--------|-------|-------|
| Visibilité | Partiellement masqué | Entièrement visible |
| Position | Coupé par overflow-hidden | Flottant au-dessus de la carte |
| Accessibilité | Difficile à toucher | Zone de 32x32px complètement accessible |

## Fichier à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/AIChatWidget.tsx` | Déplacer le bouton X en dehors de la div overflow-hidden |

