

## Rendre le badge "Sur l'app" cliquable

### Objectif

Transformer le badge statique "Sur l'app" en un lien cliquable qui redirige vers la page **Idees cadeaux / wishlist** du contact lie (`/gift-ideas/:contactId`).

### Modification

**Fichier** : `src/pages/Dashboard.tsx` (lignes 719-724)

Remplacer le `<span>` statique par un `<button>` ou `<span>` cliquable avec `onClick={() => navigate(`/gift-ideas/${friend.id}`)}`. Le badge conservera son style actuel (vert, icone CheckCircle) avec un curseur pointer et un leger effet hover pour indiquer l'interactivite.

### Details techniques

Le badge actuel :
```text
<span className="inline-flex items-center gap-0.5 text-[10px] ...">
  <CheckCircle /> Sur l'app
</span>
```

Sera transforme en :
```text
<Tooltip>
  <TooltipTrigger asChild>
    <button
      className="inline-flex items-center gap-0.5 text-[10px] font-medium
                 text-success bg-success/10 rounded-full px-1.5 py-0.5
                 hover:bg-success/20 transition-colors cursor-pointer"
      onClick={() => navigate(`/gift-ideas/${friend.id}`)}
    >
      <CheckCircle className="h-3 w-3" />
      Sur l'app
    </button>
  </TooltipTrigger>
  <TooltipContent>Voir les souhaits de {friend.name}</TooltipContent>
</Tooltip>
```

### Comportement

- **Clic** : navigue vers `/gift-ideas/{contactId}` qui affiche le profil du contact, son historique de cadeaux, sa wishlist et les recommandations IA
- **Hover** : fond vert legerement plus fonce + tooltip "Voir les souhaits de {nom}"
- **Aucun changement** pour les contacts non lies (le bouton "Inviter" reste inchange)

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/Dashboard.tsx` | Badge "Sur l'app" transforme en bouton cliquable avec navigation et tooltip |

