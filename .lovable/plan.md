
# Permettre aux Administrateurs Régionaux de Gérer les Business

## Diagnostic

L'analyse du code révèle que dans `BusinessManagement.tsx` :
- Seul `isSuperAdmin` est extrait du hook `useAdmin` (ligne 92)
- Les actions du dropdown (Ajouter un produit, Gérer les produits, etc.) sont conditionnées par `{isSuperAdmin && (...)}` (ligne 1002)

Cela exclut les **Administrateurs Régionaux** qui devraient avoir accès à ces fonctionnalités.

## Solution

Remplacer la condition `isSuperAdmin` par `hasPermission('manage_businesses')` pour permettre à tout admin ayant cette permission (Super Admins et Admins Régionaux) d'accéder aux actions de gestion.

| Condition actuelle | Nouvelle condition |
|-------------------|-------------------|
| `isSuperAdmin` | `hasPermission('manage_businesses')` |

## Fichier à Modifier

`src/pages/Admin/BusinessManagement.tsx`

### Modification 1 : Extraire `hasPermission` du hook

**Ligne 92** - Ajouter `hasPermission` à la destructuration :

```typescript
// Avant
const { isSuperAdmin } = useAdmin();

// Après
const { isSuperAdmin, hasPermission } = useAdmin();
```

### Modification 2 : Changer la condition du dropdown

**Ligne 1002** - Remplacer la condition pour les actions de gestion :

```typescript
// Avant
{isSuperAdmin && (
  <>
    <DropdownMenuItem onClick={() => {...}}>
      Ajouter un produit
    </DropdownMenuItem>
    ...
  </>
)}

// Après
{hasPermission('manage_businesses') && (
  <>
    <DropdownMenuItem onClick={() => {...}}>
      Ajouter un produit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => {...}}>
      Gérer les produits
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => {...}}>
      Modifier le business
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => {...}}>
      Gérer les catégories
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => {...}}>
      Voir les commandes
    </DropdownMenuItem>
    {/* Supprimer reste réservé aux Super Admins */}
    {isSuperAdmin && (
      <DropdownMenuItem className="text-destructive">
        Supprimer le business
      </DropdownMenuItem>
    )}
  </>
)}
```

## Logique des Permissions

| Rôle | `hasPermission('manage_businesses')` | Actions accessibles |
|------|-------------------------------------|---------------------|
| Super Admin | ✅ (automatique) | Toutes, y compris suppression |
| Admin Régional | ✅ (par défaut) | Toutes, sauf suppression |
| Modérateur | ✅ si activé | Toutes, sauf suppression |

## Sécurité

- **Suppression** : L'action "Supprimer le business" reste réservée aux Super Admins car elle est irréversible
- **Restriction pays** : Les Admins Régionaux ne voient déjà que les business de leurs pays assignés (via `selectedCountry`)
- **Permission granulaire** : Un Modérateur doit avoir `manage_businesses` explicitement activé pour accéder à ces actions

## Résultat Attendu

Après cette modification, les Administrateurs Régionaux verront dans le dropdown :
- ✅ Ajouter un produit
- ✅ Gérer les produits  
- ✅ Modifier le business
- ✅ Gérer les catégories
- ✅ Voir les commandes
- ❌ Supprimer le business (réservé Super Admin)
