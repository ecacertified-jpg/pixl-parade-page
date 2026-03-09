

## Plan : Onglet actif vraiment visible

### Probleme racine
Les classes locales `data-[state=active]:bg-[hsl(259,58%,42%)]` sont en conflit avec les classes de base du composant `TabsTrigger` (`data-[state=active]:bg-primary`). Le resultat est un contraste insuffisant.

### Solution
Utiliser le prefixe `!` de Tailwind pour forcer les styles actifs, et ajouter une bordure inferieure epaisse coloree comme indicateur supplementaire :

**Fichier : `src/pages/Dashboard.tsx`** (lignes 602-661)

Sur chaque `TabsTrigger`, remplacer les classes actives par :
```
data-[state=active]:!bg-[hsl(259,58%,35%)]
data-[state=active]:!text-white
data-[state=active]:!shadow-lg
data-[state=active]:!border-b-2
data-[state=active]:!border-white
data-[state=active]:!font-bold
```

Le `!` force la priorite sur les styles de base. La luminosite passe a 35% (encore plus fonce). La bordure blanche inferieure et le gras ajoutent un signal visuel supplementaire.

### Fichier impacte
- `src/pages/Dashboard.tsx`

