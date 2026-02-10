

# Ajouter une animation de transition au clic sur les cartes pays

## Approche

Utiliser Framer Motion pour ajouter un effet visuel au clic (scale down puis navigation), combinant le feedback tactile immediat avec la transition de page existante via `AnimatedRoutes`.

## Modification

### `src/components/admin/CountryStatsCards.tsx`

- Importer `motion` de `framer-motion`
- Remplacer `<Card>` par `<motion.div>` wrappant le `<Card>`
- Ajouter `whileTap={{ scale: 0.97 }}` et `whileHover={{ scale: 1.02 }}` pour un feedback interactif
- Ajouter une legere transition de fond au hover via `transition`

```tsx
import { motion } from 'framer-motion';

// Chaque carte :
<motion.div
  key={country.code}
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
  onClick={() => navigate(`/admin/countries/${country.code}`)}
  className="cursor-pointer"
>
  <Card className="hover:shadow-md transition-shadow h-full">
    <CardContent className="p-5 flex flex-col items-center text-center gap-2">
      ...
    </CardContent>
  </Card>
</motion.div>
```

Meme approche pour le skeleton loading (sans interaction).

## Impact

- 1 fichier modifie : `CountryStatsCards.tsx`
- Animation spring au hover (zoom leger) et au clic (compression)
- La transition de page existante dans `AnimatedRoutes` gere le reste de l'animation apres navigation

