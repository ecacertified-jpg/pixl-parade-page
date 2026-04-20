

## Objectif

Permettre au Super Admin d'affecter un utilisateur (depuis la liste « Gestion des utilisateurs ») à un Admin (admin régional / modérateur), individuellement ou en lot.

## Backend — déjà disponible ✅

L'edge function `admin-manage-assignments` (POST `{ admin_id, user_ids }`) gère déjà :
- Vérification que l'appelant est super_admin
- Contrôle d'exclusivité (un user = un seul admin) avec rapport de conflits
- Upsert dans `admin_user_assignments` avec `assigned_via='manual'`
- Audit log

Aucune migration nécessaire.

## Changements UI — `src/pages/Admin/UserManagement.tsx`

### 1. Action ligne par ligne (menu kebab `⋮`)

Ajouter un nouvel item `DropdownMenuItem` (visible uniquement si `isSuperAdmin`), avant la section destructive :

```text
👤 Voir le profil
💳 Historique des transactions
─────────────
🔀 Fusionner avec un autre compte         (super admin)
🎯 Affecter à un admin                    ← NOUVEAU (super admin)
─────────────
🚫 Suspendre / Réactiver
🗑 Supprimer le compte                    (super admin)
```

L'item ouvre une nouvelle modale `AssignUserToAdminModal` pré-remplie avec **l'utilisateur cliqué**.

### 2. Action en lot (sélection multiple)

- Ajouter une **checkbox** dans chaque ligne du tableau + une checkbox « tout sélectionner » dans l'en-tête (super admin only).
- Quand `selectedUserIds.size > 0`, afficher une barre d'action sticky en haut du tableau :
  - `N utilisateur(s) sélectionné(s)` + bouton **« Affecter à un admin »** + bouton **« Désélectionner »**.
- Le bouton ouvre la même modale, en mode lot.

### 3. Nouvelle modale — `src/components/admin/AssignUserToAdminModal.tsx`

Props :
```text
open, onOpenChange, userIds: string[], userLabels: string[], onSuccess()
```

Contenu :
- **Liste des admins éligibles** chargée via `admin-list-admins` (filtre `is_active=true`, exclut les super_admins puisqu'ils voient déjà tout).
- Chaque ligne admin = avatar + nom + rôle (badge) + pays affectés + nombre actuel d'utilisateurs.
- Sélection radio (un seul admin cible).
- Bouton « Affecter » → POST `admin-manage-assignments` `{ admin_id, user_ids }`.
- Affichage des conflits éventuels (`results.conflicts`) : « X utilisateur(s) déjà affecté(s) à un autre admin — réaffecter ? » avec confirmation qui supprime puis réinsère (2e appel DELETE + POST si confirmé).
- Toast de succès : `N utilisateur(s) affecté(s) à <Nom Admin>`.
- `onSuccess` rafraîchit la liste utilisateurs.

### 4. Indicateur visuel d'affectation (optionnel mais utile)

Charger en parallèle un map `userId → admin assigné` (via une requête légère sur `admin_user_assignments` joint à `admin_users`+`profiles`) et afficher un petit badge `Affecté à : Prénom N.` sous le nom de l'utilisateur. Permet de voir d'un coup d'œil qui gère qui.

## Sécurité

- Bouton/menu masqué pour non-super-admins (`isSuperAdmin` déjà disponible via `useAdmin()`).
- Toute la validation reste côté serveur (déjà en place dans l'edge function).
- Audit log automatique (déjà géré).

## Mémoire à mettre à jour

`mem://admin/gestion-regionale-et-affectations` : préciser qu'un Super Admin peut désormais affecter des utilisateurs **soit depuis la fiche admin** (modale existante côté `/admin/admins`), **soit directement depuis la liste des utilisateurs** (`/admin/users`) en ligne par ligne ou en lot.

## Résultat

Le Super Admin gagne un workflow inverse : au lieu de partir d'un admin pour lui ajouter des users, il part d'un user (ou d'une sélection) pour choisir l'admin référent — beaucoup plus naturel quand on traite les comptes au fil de l'eau.

