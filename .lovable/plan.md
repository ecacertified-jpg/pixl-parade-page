

## Plan : Afficher l'anniversaire des utilisateurs dans "Mes affectations"

### Constat
Le champ `birthday` est deja fetché par l'Edge Function et present dans l'interface `UserProfile`, mais il n'est pas affiché dans le tableau des utilisateurs assignés.

### Modification

#### `src/pages/Admin/MyAssignments.tsx`

Ajouter une colonne "Anniversaire" dans le tableau des utilisateurs (onglet "Utilisateurs") :

1. Ajouter un `<TableHead>Anniversaire</TableHead>` apres la colonne "Téléphone"
2. Ajouter la cellule correspondante affichant la date au format `JJ/MM` avec l'icone Cake et un badge d'urgence (jours restants) via `getDaysUntilBirthday`
3. Importer `Cake` de lucide-react et `getDaysUntilBirthday` de `@/lib/utils`

La cellule affichera :
- La date au format JJ/MM
- Un badge coloré indiquant le nombre de jours restants (rouge = aujourd'hui, orange = sous 3j, etc.)
- "Non renseigné" en italique si pas de date

### Fichier concerne
- `src/pages/Admin/MyAssignments.tsx` uniquement

