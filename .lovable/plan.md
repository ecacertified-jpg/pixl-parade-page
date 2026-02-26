
## Ajouter une confirmation avant suppression d'un contact

### Probleme
Quand l'utilisateur clique sur l'icone poubelle d'un contact dans le Dashboard, la suppression s'effectue immediatement sans avertissement. Cela peut causer des suppressions accidentelles.

### Solution
Ajouter un `AlertDialog` de confirmation (deja utilise ailleurs dans l'app, ex: `PostActionsMenu.tsx`) qui demande a l'utilisateur de confirmer avant de supprimer le contact.

### Modifications

**Fichier : `src/pages/Dashboard.tsx`**

1. **Ajouter un state** pour stocker l'ID du contact a supprimer :
   ```typescript
   const [contactToDelete, setContactToDelete] = useState<string | null>(null);
   ```

2. **Modifier le bouton supprimer** (ligne ~720) pour ouvrir le dialog au lieu de supprimer directement :
   ```typescript
   onClick={() => setContactToDelete(friend.id)}
   ```

3. **Ajouter le composant `AlertDialog`** dans le JSX avec :
   - Titre : "Supprimer ce contact ?"
   - Description : "Cette action est irreversible. Le contact sera definitivement supprime de votre cercle d'amis."
   - Bouton "Annuler" et bouton "Supprimer" (style destructive)
   - Au clic sur Supprimer : appeler `handleDeleteFriend(contactToDelete)` puis fermer le dialog

4. **Importer les composants AlertDialog** depuis `@/components/ui/alert-dialog` (deja utilises dans le projet)

### Impact
- 1 seul fichier modifie (`src/pages/Dashboard.tsx`)
- Pattern identique a celui utilise dans `PostActionsMenu.tsx` pour la suppression de publications
- Aucun changement de logique metier, juste ajout d'une etape de confirmation
