

## Plan : Arrondir les angles du conteneur d'onglets

Le `TabsList` a `rounded-none` (ligne 603). Il suffit de remplacer par `rounded-xl` pour s'aligner avec les cartes du dashboard qui utilisent le radius par defaut (`1rem`).

### Modification

**Fichier : `src/pages/Dashboard.tsx`** (ligne 603)
- Remplacer `rounded-none` par `rounded-xl` sur le `TabsList`

