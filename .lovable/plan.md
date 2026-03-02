

# Repositionner le badge "Sur l'app" a cote du badge de relation

## Probleme actuel

Le badge "Sur l'app" est actuellement place a droite du prenom dans le groupe de gauche, tandis que le badge de relation ("Famille", "Ami") est aligne a l'extreme droite. Sur mobile, cela cree un espacement desequilibre.

```text
Actuel :
| Aboutou [Sur l'app]                    Famille |

Souhaite :
| Aboutou                     [Sur l'app] Famille |
```

## Modification technique

**Fichier** : `src/pages/Dashboard.tsx`, lignes 888-915

1. **Retirer** le badge "Sur l'app" (lignes 891-911) du div du nom (ligne 889).
2. **Deplacer** ce badge dans le groupe de droite, juste avant le badge de relation (ligne 913), en les enveloppant dans un `div` flex avec `gap-1.5`.

Structure resultante :

```tsx
<div className="flex items-center justify-between w-full">
  {/* Gauche : nom seul */}
  <div className="font-medium">
    {friend.name}
  </div>
  {/* Droite : badges groupes */}
  <div className="flex items-center gap-1.5">
    {friend.linked_user_id && (
      <Tooltip>...</Tooltip>  // badge "Sur l'app"
    )}
    <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
      {friend.relation}
    </Badge>
  </div>
</div>
```

Aucun changement de logique -- seul l'emplacement visuel du badge est deplace.

