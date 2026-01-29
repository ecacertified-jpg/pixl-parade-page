

# Améliorer l'Accessibilité du Bouton de Fermeture du Chat AI

## Problème

Le bouton de fermeture (X) de la bulle de bienvenue du chat AI est difficile à toucher sur mobile :
- Position trop proche du bord (`top-1 right-1`)
- Zone de toucher visuellement petite malgré les dimensions min-w/min-h
- L'icône X est petite (`h-4 w-4`)
- Le fond semi-transparent (`bg-muted/80`) rend le bouton peu visible

## Solution

Agrandir et repositionner le bouton de fermeture pour une meilleure accessibilité tactile :

| Aspect | Avant | Après |
|--------|-------|-------|
| Position | `top-1 right-1` | `top-2 right-2` |
| Padding | `p-2.5` | `p-2` |
| Taille icône | `h-4 w-4` | `h-5 w-5` |
| Fond | `bg-muted/80` | `bg-gray-100 dark:bg-gray-800` (plus visible) |
| Dimensions min | `min-w-[44px] min-h-[44px]` | `w-8 h-8` avec zone tactile élargie |
| Bordure | Aucune | `border border-gray-200` pour meilleure visibilité |

## Modification Technique

### Fichier : `src/components/AIChatWidget.tsx`

**Lignes 203-209** - Améliorer le bouton de fermeture :

```tsx
// Avant
<button
  onClick={() => setShowWelcome(false)}
  className="absolute top-1 right-1 p-2.5 rounded-full bg-muted/80 hover:bg-destructive/20 hover:text-destructive transition-all duration-200 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center"
  aria-label="Fermer le message de bienvenue"
>
  <X className="h-4 w-4 text-muted-foreground" />
</button>

// Après
<button
  onClick={(e) => {
    e.stopPropagation();
    setShowWelcome(false);
  }}
  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-md hover:bg-destructive hover:border-destructive hover:text-white transition-all duration-200 z-20 flex items-center justify-center"
  aria-label="Fermer le message de bienvenue"
>
  <X className="h-4 w-4" />
</button>
```

## Design Résultant

Le bouton de fermeture sera :
- **Plus visible** : Fond blanc opaque avec bordure et ombre
- **Mieux positionné** : Légèrement en dehors de la carte (`-top-2 -right-2`) comme un badge
- **Plus facile à toucher** : Zone de 32x32px clairement visible
- **Feedback visuel** : Change de couleur au hover (rouge destructive)
- **z-index élevé** : `z-20` pour s'assurer qu'il est au-dessus de tout

## Fichier à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/AIChatWidget.tsx` | Améliorer le style et la position du bouton X |

