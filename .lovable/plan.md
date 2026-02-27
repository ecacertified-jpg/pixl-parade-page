

## Ajouter un compteur contacts lies / non lies

### Modification

**Fichier** : `src/pages/Dashboard.tsx` (autour de la ligne 699)

Juste en dessous du titre "Mon cercle d'amis" (ligne 700), ajouter un petit compteur qui calcule dynamiquement le nombre de contacts lies et non lies a partir du tableau `friends` existant.

### Rendu visuel

Le compteur apparaitra sous forme de badges compacts entre le titre et la liste :

```text
Mon cercle d'amis                    [+ Ajouter]
  ✓ 28 sur l'app  ·  ✉ 52 a inviter
```

### Details techniques

- Calculer `linkedCount` et `notLinkedCount` directement depuis le tableau `friends` deja charge :
  ```ts
  const linkedCount = friends.filter(f => f.linked_user_id).length;
  const notLinkedCount = friends.length - linkedCount;
  ```
- Afficher entre les lignes 705 et 707 (apres le bouton Ajouter, avant la liste) un `div` avec deux petits badges :
  - Badge vert : `{linkedCount} sur l'app` avec icone `CheckCircle`
  - Badge gris/muted : `{notLinkedCount} a inviter` avec icone `UserPlus`
- Ne s'affiche que si `friends.length > 0`
- Pas de nouveau state ni fetch supplementaire — tout est derive des donnees existantes

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `src/pages/Dashboard.tsx` | Ajout du compteur entre le header et la liste de contacts |

