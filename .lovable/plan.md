

## Plan : Abandonner tailwind-merge — style conditionnel direct

### Cause racine confirmee
`tailwind-merge` dans `cn()` fusionne les classes Tailwind et **ecrase silencieusement** les overrides du Dashboard. Apres 4 tentatives avec differentes strategies CSS (`!important`, remplacement des styles de base, etc.), le probleme persiste car `tailwind-merge` resout les conflits de maniere imprevisible avec les classes conditionnelles `data-[state=*]`.

### Nouvelle approche : style conditionnel via React state
Abandonner completement les classes `data-[state=active/inactive]:*` sur les `TabsTrigger` du Dashboard. A la place, utiliser directement la variable `activeTab` pour appliquer les classes conditionnellement :

```tsx
<TabsTrigger 
  value="amis" 
  className={`... ${activeTab === 'amis' 
    ? 'bg-transparent text-primary font-bold border-b-[3px] border-primary shadow-none' 
    : 'bg-transparent text-muted-foreground border-b-[3px] border-transparent'}`}
>
```

Cela contourne entierement `tailwind-merge` car les classes ne sont plus en conflit — seul un jeu de classes est present a la fois.

### Fichier impacte
- `src/pages/Dashboard.tsx` — remplacer les classes `data-[state=*]:` par du conditionnel `activeTab === 'xxx'` sur les 5 `TabsTrigger`

