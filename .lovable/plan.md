

# Ajout de la Permission "Gérer les prestataires"

## Objectif

Ajouter une nouvelle permission `manage_businesses` ("Gérer les prestataires") à la liste des permissions administratives. Cette permission permettra de contrôler l'accès à la gestion des boutiques et comptes vendeurs.

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useAdmin.ts` | Ajouter `manage_businesses` à l'interface `AdminPermissions` |
| `src/components/admin/EditPermissionsModal.tsx` | Ajouter l'option dans la liste `PERMISSIONS` |
| `src/components/admin/AddAdminModal.tsx` | Ajouter l'option dans la liste `PERMISSIONS` |

## Détail des Modifications

### 1. `src/hooks/useAdmin.ts`

Ajouter la nouvelle permission à l'interface TypeScript :

```typescript
export interface AdminPermissions {
  manage_users: boolean;
  manage_admins: boolean;
  manage_businesses: boolean;  // NOUVEAU
  manage_content: boolean;
  manage_finances: boolean;
  view_analytics: boolean;
  manage_settings: boolean;
}
```

Et dans l'état initial + parsing des permissions :

```typescript
const [permissions, setPermissions] = useState<AdminPermissions>({
  manage_users: false,
  manage_admins: false,
  manage_businesses: false,  // NOUVEAU
  manage_content: false,
  manage_finances: false,
  view_analytics: false,
  manage_settings: false,
});

// Et dans setPermissions :
setPermissions({
  manage_users: perms.manage_users ?? false,
  manage_admins: perms.manage_admins ?? false,
  manage_businesses: perms.manage_businesses ?? false,  // NOUVEAU
  manage_content: perms.manage_content ?? false,
  manage_finances: perms.manage_finances ?? false,
  view_analytics: perms.view_analytics ?? false,
  manage_settings: perms.manage_settings ?? false,
});
```

### 2. `src/components/admin/EditPermissionsModal.tsx`

Ajouter l'option dans la constante `PERMISSIONS` (ligne 25-32) :

```typescript
const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
  { key: 'manage_businesses', label: 'Gérer les prestataires' },  // NOUVEAU
  { key: 'manage_content', label: 'Modérer le contenu' },
  { key: 'manage_finances', label: 'Gérer les finances' },
  { key: 'view_analytics', label: 'Voir les analytics' },
  { key: 'manage_settings', label: 'Gérer les paramètres' },
];
```

### 3. `src/components/admin/AddAdminModal.tsx`

Même modification dans la constante `PERMISSIONS` (ligne 29-36) :

```typescript
const PERMISSIONS = [
  { key: 'manage_users', label: 'Gérer les utilisateurs' },
  { key: 'manage_admins', label: 'Gérer les administrateurs' },
  { key: 'manage_businesses', label: 'Gérer les prestataires' },  // NOUVEAU
  { key: 'manage_content', label: 'Modérer le contenu' },
  { key: 'manage_finances', label: 'Gérer les finances' },
  { key: 'view_analytics', label: 'Voir les analytics' },
  { key: 'manage_settings', label: 'Gérer les paramètres' },
];
```

## Note Technique

La permission est stockée en JSONB dans la colonne `permissions` de la table `admin_users`. Aucune migration SQL n'est nécessaire car le format JSONB accepte dynamiquement de nouvelles clés.

## Résultat Attendu

La nouvelle permission "Gérer les prestataires" apparaîtra :
- Dans le modal d'ajout d'administrateur (pour les modérateurs)
- Dans le modal de modification des permissions (pour les modérateurs)

Les super administrateurs et admins régionaux auront automatiquement cette permission (comme toutes les autres).

