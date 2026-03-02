

# Harmoniser l'affichage des badges sur mobile

## Probleme

Sur mobile, le nom du contact et les deux badges ("Sur l'app" + relation) sont sur la meme ligne avec `justify-between`. Quand le nom est long, les badges se retrouvent colles ou passent a la ligne de maniere desequilibree.

## Solution

Passer a un layout en deux lignes sur la premiere zone :
- **Ligne 1** : nom du contact (pleine largeur)
- **Ligne 2** : les deux badges alignes a gauche avec un petit `gap`

Cela garantit un affichage propre quelle que soit la longueur du nom.

```text
Avant (probleme sur mobile) :
| Aboutou WhatsApp    [Sur l'app] [Famille] |

Apres :
| Aboutou WhatsApp                          |
| [Sur l'app] [Famille]                     |
```

## Modification technique

**Fichier** : `src/pages/Dashboard.tsx`, lignes 888-918

Remplacer le `div flex justify-between` par un `div flex flex-col` :

```tsx
<div className="w-full">
  <div className="flex items-center justify-between">
    <span className="font-medium">{friend.name}</span>
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {friend.linked_user_id && (
        <Tooltip>...</Tooltip>
      )}
      <Badge variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
        {friend.relation}
      </Badge>
    </div>
  </div>
</div>
```

Le changement cle est l'ajout de `flex-shrink-0` sur le conteneur des badges pour empecher leur compression, et `min-w-0` ou `truncate` sur le nom pour qu'il se tronque proprement plutot que de pousser les badges.

Cela preserve le meme layout `justify-between` mais empeche le debordement sur mobile.

## Fichier modifie

- `src/pages/Dashboard.tsx` (lignes 888-918 uniquement)

