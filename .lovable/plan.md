

## Probleme identifie

L'admin regional (`aa658506-36fd-474e-a956-67504ce16c3f`) a des permissions incompletes en base de donnees. Il manque `manage_businesses` et `manage_settings` dans son JSON de permissions. C'est pourquoi les actions (Ajouter un produit, Gerer les produits, Modifier le business, Gerer les categories, Voir les commandes) ne s'affichent pas dans le menu.

**Permissions actuelles :**
- manage_content: true
- manage_finances: true
- manage_users: true
- view_analytics: true

**Permissions manquantes :**
- manage_businesses (bloque les actions prestataires)
- manage_admins
- manage_settings

## Cause racine

Le code actuel dans `EditPermissionsModal.tsx` (ligne 104) donne bien toutes les permissions quand on sauvegarde un regional_admin. Mais cet admin a ete cree ou modifie avant cette logique, donc ses permissions sont restees partielles.

De plus, le hook `useAdmin` ne compense pas les permissions manquantes pour un regional_admin : il ne fait que lire le JSON tel quel, sans appliquer la regle "regional_admin = toutes les permissions".

## Plan de correction

### 1. Corriger le hook useAdmin (defense en profondeur)

**Fichier** : `src/hooks/useAdmin.ts`

Modifier la logique de chargement des permissions pour que les `regional_admin` aient automatiquement toutes les permissions, comme les `super_admin`. Cela garantit que meme si le JSON en base est incomplet, l'interface fonctionne correctement.

```text
// Avant (ligne 82-91)
const perms = adminData.permissions as any || {};
setPermissions({
  manage_users: perms.manage_users ?? false,
  ...
});

// Apres
if (adminData.role === 'super_admin' || adminData.role === 'regional_admin') {
  // Super admins et regional admins ont toutes les permissions
  setPermissions({
    manage_users: true,
    manage_admins: true,
    manage_businesses: true,
    manage_content: true,
    manage_finances: true,
    view_analytics: true,
    manage_settings: true,
  });
} else {
  const perms = adminData.permissions as any || {};
  setPermissions({
    manage_users: perms.manage_users ?? false,
    ...
  });
}
```

### 2. Corriger les donnees existantes en base

Mettre a jour les permissions du regional_admin actuel pour refleter la regle. Cela sera fait via une mise a jour SQL directe sur la table `admin_users`.

### Impact

- Les admins regionaux verront immediatement toutes les actions dans le menu des prestataires
- La suppression de business reste reservee aux Super Admins (controle separe via `isSuperAdmin`)
- Aucun changement pour les moderateurs, dont les permissions restent granulaires
- Defense en profondeur : meme si les donnees en base sont incompletes, le hook appliquera la bonne logique

