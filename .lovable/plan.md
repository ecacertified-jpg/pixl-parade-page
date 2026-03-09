

## Plan : Corriger la visibilite des onglets actifs a la source

### Cause racine
Le composant `TabsTrigger` dans `tabs.tsx` (ligne 31) applique `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md` comme styles de base. La fonction `cn()` utilise `tailwind-merge` qui resout les conflits de classes de maniere imprevisible — les `!important` et valeurs arbitraires du Dashboard sont ecrasees ou ignorees.

### Solution
Modifier directement `src/components/ui/tabs.tsx` pour retirer les styles actifs par defaut du `TabsTrigger`. Ensuite simplifier les classes dans `Dashboard.tsx`.

**Fichier 1 : `src/components/ui/tabs.tsx`** (ligne 31)
- Retirer `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md`
- Les remplacer par des styles neutres : `data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm`

**Fichier 2 : `src/pages/Dashboard.tsx`** (lignes 602-661)
- Simplifier les classes des `TabsTrigger` sans `!important` :
  - `data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-bold data-[state=active]:border-b-[3px] data-[state=active]:border-primary data-[state=active]:shadow-none`
- Les styles fonctionneront car ils ne seront plus en conflit avec la base

### Fichiers impactes
- `src/components/ui/tabs.tsx`
- `src/pages/Dashboard.tsx`

