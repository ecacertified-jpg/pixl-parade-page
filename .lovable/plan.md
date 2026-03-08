

## Plan: Harmoniser "Ma liste de souhaits" mobile et desktop

### Probleme
Sur mobile, le titre et les 2 boutons sont sur la meme ligne, ce qui cause un retour a la ligne disgracieux du titre (visible sur le screenshot).

### Modification

**Fichier** : `src/components/FavoriteArticlesSection.tsx`

Remplacer le layout du header par un design responsive :

1. **Mobile** : Titre + icone coeur sur une ligne, boutons en dessous (flex-col)
2. **Desktop** : Tout sur une ligne comme actuellement (md:flex-row md:items-center md:justify-between)

```
<div className="flex flex-col gap-2 mb-3">
  <div className="flex items-center gap-2">
    <Heart ... />
    <h3 ...>Ma liste de souhaits</h3>
  </div>
  <div className="flex items-center gap-2">
    <!-- boutons Parcourir + Voir tout -->
  </div>
</div>
```

Sur desktop (`md:`), repasser en `md:flex-row md:items-center md:justify-between` pour garder le layout horizontal.

Aucun autre fichier modifie.

