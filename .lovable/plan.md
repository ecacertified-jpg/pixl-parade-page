

# Affecter des utilisateurs et entreprises aux administrateurs

## Objectif

Permettre au Super Admin d'assigner directement des utilisateurs et des entreprises a un administrateur via le menu "Actions" du tableau de gestion des admins.

## Architecture

Actuellement, la relation admin-utilisateurs est indirecte (via `assigned_countries`). Cette fonctionnalite ajoute une affectation directe, individuelle, en plus de l'affectation par pays.

### Nouvelles tables en base de donnees

**`admin_user_assignments`** - Liaison directe admin <-> utilisateur

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Cle primaire |
| admin_user_id | uuid | FK vers admin_users.id |
| user_id | uuid | FK vers auth.users.id (utilisateur assigne) |
| assigned_by | uuid | FK vers auth.users.id (super admin qui a fait l'affectation) |
| created_at | timestamptz | Date d'affectation |

Contrainte unique sur (admin_user_id, user_id).

**`admin_business_assignments`** - Liaison directe admin <-> entreprise

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Cle primaire |
| admin_user_id | uuid | FK vers admin_users.id |
| business_account_id | uuid | FK vers business_accounts.id |
| assigned_by | uuid | FK vers auth.users.id |
| created_at | timestamptz | Date d'affectation |

Contrainte unique sur (admin_user_id, business_account_id).

Les deux tables auront RLS active avec acces reserve aux admins actifs.

### Nouvelle edge function : `admin-manage-assignments`

Gerera les operations CRUD sur les affectations :

- **GET** `?admin_id=xxx` : liste les utilisateurs et entreprises assignes a cet admin
- **POST** : ajouter des affectations (body: `{ admin_id, user_ids?, business_ids? }`)
- **DELETE** : retirer des affectations (body: `{ admin_id, assignment_ids, type: 'user' | 'business' }`)

Securite : verification que l'appelant est super_admin actif.

### Nouveau composant : `AssignUsersBusinessesModal`

Modal accessible depuis le menu Actions de chaque admin, avec deux onglets :

- **Onglet "Utilisateurs"** : recherche par nom/email, liste paginee, checkbox pour selectionner, affichage des utilisateurs deja assignes
- **Onglet "Entreprises"** : recherche par nom, meme logique

Chaque onglet affiche :
- En haut : barre de recherche
- Liste avec checkbox : avatar + nom + email/type
- Les elements deja assignes sont precoches
- Bouton "Enregistrer" pour sauvegarder les modifications

### Modifications de l'interface existante

**`AdminManagement.tsx`** - Ajouter une entree dans le menu Actions :

```text
Modifier les permissions
Affecter utilisateurs/entreprises    <-- NOUVEAU
Revoquer l'acces admin
```

Ajouter l'etat et le rendu du nouveau modal.

**Mise a jour des stats** - Les colonnes "Utilisateurs" et "Entreprises" prendront en compte les affectations directes en plus des pays. La logique dans l'edge function `admin-list-admins` sera mise a jour pour sommer :
- Utilisateurs/entreprises des pays assignes
- Utilisateurs/entreprises directement assignes (sans doublons)

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| Migration SQL (nouveau) | Creer | Tables `admin_user_assignments` et `admin_business_assignments` + RLS |
| `supabase/functions/admin-manage-assignments/index.ts` | Creer | Edge function GET/POST/DELETE pour gerer les affectations |
| `src/components/admin/AssignUsersBusinessesModal.tsx` | Creer | Modal avec onglets Utilisateurs/Entreprises |
| `src/pages/Admin/AdminManagement.tsx` | Modifier | Ajouter entree menu Actions + etat du modal |
| `supabase/functions/admin-list-admins/index.ts` | Modifier | Inclure les affectations directes dans le calcul des stats |

## Flux utilisateur

1. Super Admin ouvre le menu Actions d'un admin
2. Clique sur "Affecter utilisateurs/entreprises"
3. Le modal s'ouvre avec les deux onglets
4. Recherche et selectionne des utilisateurs/entreprises
5. Clique sur "Enregistrer"
6. Les affectations sont sauvegardees, les stats se mettent a jour
7. Un log d'audit est cree

