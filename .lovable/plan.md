

## Plan : Tri par anniversaire le plus proche dans "Mes affectations"

### Modification : `src/pages/Admin/MyAssignments.tsx`

1. **Ajouter un state de tri** : `sortByBirthday` (boolean, default `false`)
2. **Rendre le header "Anniversaire" cliquable** avec une icone de tri (ArrowUpDown de lucide-react)
3. **Trier la liste** avant le `.map()` : quand le tri est actif, utiliser `getDaysUntilBirthday` pour trier par anniversaire le plus proche en premier. Les utilisateurs sans anniversaire sont placés en fin de liste.

```typescript
const sortedUserAssignments = sortByBirthday
  ? [...userAssignments].sort((a, b) => {
      const dA = a.profile?.birthday ? getDaysUntilBirthday(a.profile.birthday) : 999;
      const dB = b.profile?.birthday ? getDaysUntilBirthday(b.profile.birthday) : 999;
      return dA - dB;
    })
  : userAssignments;
```

Le header "Anniversaire" deviendra un bouton toggle pour activer/desactiver le tri.

### Fichier concerne
- `src/pages/Admin/MyAssignments.tsx` uniquement

