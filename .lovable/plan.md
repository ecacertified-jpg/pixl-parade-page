

# Plan : Afficher les contacts dans le modal de partage d'anniversaire

## Probleme

Le `ShareBirthdayToCirclesModal` ne montre que les `friend_circles` (groupes nommes comme "Famille", "Amis"). L'utilisateur a des contacts dans la table `contacts` mais ils ne sont pas forcement assignes a un `friend_circle` via `friend_circle_members`. Resultat : le modal affiche "Aucun cercle d'amis cree" meme si l'utilisateur a des amis.

## Solution

Modifier le modal pour afficher deux sections :

1. **Les cercles** (si existants) - comme actuellement
2. **Les contacts individuels** (toujours) - tous les contacts de l'utilisateur

### Fichier : `src/components/ShareBirthdayToCirclesModal.tsx`

1. Ajouter un fetch des contacts de l'utilisateur depuis la table `contacts` (via `supabase.from('contacts').select('id, name, phone').eq('user_id', user.id)`)
2. Importer `useAuth` pour acceder au `user.id`
3. Afficher une section "Vos amis" avec la liste des contacts (nom + telephone)
4. Remplacer le message "Aucun cercle d'amis cree" par la liste des contacts quand il n'y a pas de cercles
5. Quand des cercles existent, afficher les cercles EN PLUS des contacts non-assignes

### Logique d'affichage

```text
Si cercles > 0 :
  → Afficher les cercles avec checkboxes (existant)
  → En dessous, afficher les contacts hors cercles

Si cercles == 0 ET contacts > 0 :
  → Afficher "Vos amis" avec la liste des contacts

Si cercles == 0 ET contacts == 0 :
  → Message actuel "Aucun cercle / partagez le lien"
```

### Donnees affichees par contact
- Nom
- Nombre de jours avant anniversaire (si date connue)

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/ShareBirthdayToCirclesModal.tsx` | Ajouter fetch contacts, afficher liste contacts, adapter logique d'affichage vide |

