

# Ajouter un compteur sur le bouton "Affectations"

## Solution

Afficher le total des affectations (utilisateurs + entreprises) sous forme de badge numérique directement sur le bouton "Affectations", en utilisant les `admin.stats` déjà disponibles.

## Modification

**Fichier** : `src/pages/Admin/AdminManagement.tsx`

Aux 3 endroits où le bouton "Affectations" apparaît (mobile ligne ~317, desktop ligne ~428, dropdown ligne ~173), ajouter un `Badge` avec le total :

```tsx
<Button variant="outline" size="sm" ...>
  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
  Affectations
  <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-[10px]">
    {(admin.stats?.users ?? 0) + (admin.stats?.businesses ?? 0)}
  </Badge>
</Button>
```

Le badge affichera `0` si aucune affectation, sinon le total combiné. Aucun fetch supplémentaire nécessaire car les stats sont déjà chargées.

