

## Plan : Transition animee au changement d'onglet

### Approche
Utiliser `framer-motion` (deja installe) avec `AnimatePresence` pour animer le contenu des onglets lors du changement. L'animation sera un fade + leger slide vertical, rapide et fluide.

### Implementation

**Fichier : `src/pages/Dashboard.tsx`**

1. Importer `motion, AnimatePresence` depuis `framer-motion`
2. Envelopper chaque `TabsContent` dans un wrapper `AnimatePresence` + `motion.div` avec :
   - `initial={{ opacity: 0, y: 12 }}`
   - `animate={{ opacity: 1, y: 0 }}`
   - `exit={{ opacity: 0, y: -8 }}`
   - `transition={{ duration: 0.25, ease: "easeOut" }}`
   - `key={activeTab}` pour declencher l'animation au changement
3. Remplacer les 5 blocs `<TabsContent>` par un seul bloc conditionnel base sur `activeTab`, enveloppe dans `AnimatePresence mode="wait"` :

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.25, ease: "easeOut" }}
    className="mt-4"
  >
    {activeTab === 'amis' && <AmiContent />}
    {activeTab === 'evenements' && <EventContent />}
    {/* etc. */}
  </motion.div>
</AnimatePresence>
```

Puisque les contenus sont deja directement dans les `TabsContent` (pas des composants extraits), on gardera les `TabsContent` mais on ajoutera le `motion.div` a l'interieur de chacun, avec une `key` sur `activeTab` et un `AnimatePresence` global autour de tous les `TabsContent`.

### Fichier impacte
- `src/pages/Dashboard.tsx`

