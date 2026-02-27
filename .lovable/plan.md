

## Filtrer les contacts via le compteur "Sur l'app" / "À inviter"

### Objectif

Rendre les deux badges du compteur cliquables pour filtrer la liste des contacts. Un clic sur "X sur l'app" n'affiche que les contacts liés. Un clic sur "Y à inviter" n'affiche que les non liés. Un second clic sur le filtre actif le désactive et réaffiche tous les contacts.

### Modification

**Fichier** : `src/pages/Dashboard.tsx`

**1. Nouveau state de filtre**

```ts
const [friendFilter, setFriendFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
```

**2. Rendre les badges cliquables**

Transformer les deux `<span>` du compteur (lignes 726-734) en `<button>` avec :
- Style actif (opacité pleine, soulignement ou fond coloré) quand le filtre correspondant est sélectionné
- Style inactif (semi-transparent) quand un autre filtre est actif
- `cursor-pointer` et `hover` sur les deux
- Un clic bascule entre le filtre et "all"

**3. Filtrer la liste affichée**

Avant le `.map(friend => ...)`, appliquer le filtre :

```ts
const filteredFriends = friends.filter(f => {
  if (friendFilter === 'linked') return !!f.linked_user_id;
  if (friendFilter === 'unlinked') return !f.linked_user_id;
  return true;
});
```

Utiliser `filteredFriends` dans le rendu et pour la condition "liste vide".

**4. Rendu visuel**

```text
Mon cercle d'amis                        [+ Ajouter]
  [✓ 2 sur l'app]  ·  [✉ 0 à inviter]    ← cliquables
```

- Filtre actif : fond coloré (bg-success/20 ou bg-muted/20), texte plein
- Filtre inactif : fond transparent, opacité réduite (opacity-60)
- Aucun filtre : tous en style normal (état actuel)

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/pages/Dashboard.tsx` | Ajout state `friendFilter`, badges cliquables, filtrage de la liste |

