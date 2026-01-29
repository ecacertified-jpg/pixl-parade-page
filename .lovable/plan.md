
# Permettre au Super Admin de Modifier le Rôle d'un Administrateur

## Objectif

Ajouter un sélecteur de rôle dans le modal `EditPermissionsModal` pour permettre au Super Admin de changer le rôle d'un administrateur (par exemple, de Modérateur à Admin Régional ou inversement).

## Analyse Actuelle

| Élément | État actuel |
|---------|-------------|
| Modal `EditPermissionsModal` | Affiche le rôle en badge statique, non modifiable |
| Modal `AddAdminModal` | Contient déjà un Select pour choisir le rôle (réutilisable) |
| Validation | Les permissions s'affichent conditionnellement selon le rôle |

## Modifications Techniques

### Fichier : `src/components/admin/EditPermissionsModal.tsx`

**1. Importer les éléments nécessaires**

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Shield, UserCheck } from "lucide-react";
```

**2. Ajouter la constante ROLE_INFO** (comme dans AddAdminModal)

```typescript
type AdminRoleType = 'super_admin' | 'regional_admin' | 'moderator';

const ROLE_INFO = {
  super_admin: {
    label: 'Super Administrateur',
    description: 'Accès complet à tous les pays et toutes les fonctionnalités',
    icon: ShieldCheck,
    color: 'text-primary',
  },
  regional_admin: {
    label: 'Administrateur Régional',
    description: 'Accès complet limité à certains pays',
    icon: Shield,
    color: 'text-blue-500',
  },
  moderator: {
    label: 'Modérateur',
    description: 'Permissions spécifiques sur certains pays',
    icon: UserCheck,
    color: 'text-muted-foreground',
  },
};
```

**3. Ajouter un état local pour le nouveau rôle**

```typescript
const [newRole, setNewRole] = useState<AdminRoleType>(adminRole as AdminRoleType);

// Dans useEffect, réinitialiser avec le rôle actuel
useEffect(() => {
  if (open) {
    setPermissions(currentPermissions || {});
    setAssignedCountries(currentCountries || []);
    setNewRole(adminRole as AdminRoleType); // Nouveau
  }
}, [open, currentPermissions, currentCountries, adminRole]);
```

**4. Remplacer le badge statique par un Select**

Transformer le badge en sélecteur modifiable avec les 3 rôles :

```tsx
{/* Role selection - remplace le badge statique */}
<div className="space-y-2">
  <Label>Rôle</Label>
  <Select value={newRole} onValueChange={(v: AdminRoleType) => setNewRole(v)}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="moderator">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4" />
          Modérateur
        </div>
      </SelectItem>
      <SelectItem value="regional_admin">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          Admin Régional
        </div>
      </SelectItem>
      <SelectItem value="super_admin">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Super Administrateur
        </div>
      </SelectItem>
    </SelectContent>
  </Select>
  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
    <RoleIcon className={`h-4 w-4 ${currentRoleInfo.color}`} />
    <p className="text-xs text-muted-foreground">
      {currentRoleInfo.description}
    </p>
  </div>
</div>
```

**5. Adapter les conditions d'affichage**

Utiliser `newRole` au lieu de `adminRole` pour les conditions d'affichage :

```typescript
// Afficher les pays seulement si pas super_admin
{newRole !== 'super_admin' && (
  <AdminCountryAssignment ... />
)}

// Afficher les permissions seulement pour moderator
{newRole === 'moderator' && (
  <div className="space-y-2">
    <Label>Permissions</Label>
    ...
  </div>
)}
```

**6. Modifier handleSubmit pour inclure le changement de rôle**

```typescript
const handleSubmit = async () => {
  // Validations adaptées au nouveau rôle
  if (newRole === 'moderator' && Object.values(permissions).every(v => !v)) {
    toast.error("Un modérateur doit avoir au moins une permission");
    return;
  }

  if (newRole !== 'super_admin' && assignedCountries.length === 0) {
    toast.error("Veuillez sélectionner au moins un pays");
    return;
  }

  const updateData: any = {
    role: newRole, // NOUVEAU - mise à jour du rôle
    assigned_countries: newRole === 'super_admin' ? null : assignedCountries,
    permissions: newRole === 'moderator' 
      ? permissions 
      : { manage_users: true, manage_content: true, view_analytics: true, manage_finances: true },
  };

  // ... reste de la logique
  
  // Log avec le changement de rôle
  await supabase.from('admin_audit_logs').insert({
    // ...
    description: `Rôle/permissions mis à jour pour ${adminName}`,
    metadata: { 
      previous_role: adminRole,
      new_role: newRole,
      previous_countries: currentCountries,
      new_countries: assignedCountries,
      // ...
    }
  });
};
```

**7. Gérer le cas Super Admin différemment**

Si l'admin édité est déjà Super Admin, on peut soit :
- Bloquer la modification (garde actuelle)
- Permettre de le rétrograder

Proposition : Permettre la modification du rôle Super Admin vers un rôle inférieur, mais afficher un avertissement.

## Comportement Attendu

| Rôle actuel | Nouveau rôle | UI affichée |
|-------------|--------------|-------------|
| Modérateur | - | Select + Pays + Permissions |
| Modérateur → Admin Régional | - | Select + Pays (permissions masquées) |
| Admin Régional | - | Select + Pays |
| Admin Régional → Modérateur | - | Select + Pays + Permissions |
| Super Admin | - | Select + Avertissement rétrogradation |

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/admin/EditPermissionsModal.tsx` | Ajouter Select de rôle + adapter logique |

## Sécurité

- Seul un Super Admin peut modifier les rôles (le modal n'est accessible que par eux)
- Le changement de rôle est audité dans `admin_audit_logs`
- Permissions par défaut assignées automatiquement aux admins régionaux
