
# Voir les affectations d'un admin depuis "Gestion des administrateurs"

## Objectif

Ajouter une option "Voir les affectations" dans le menu Actions de chaque administrateur sur la page "Gestion des administrateurs". Au clic, un modal s'ouvre et affiche les tableaux detailles (utilisateurs et entreprises) assignes a cet admin, avec les memes colonnes que la page "Mes affectations".

## Modifications

### 1. Nouveau composant `ViewAdminAssignmentsModal`

Fichier : `src/components/admin/ViewAdminAssignmentsModal.tsx`

Un Dialog/modal qui :
- Recoit `adminId`, `adminName`, `open`, `onOpenChange` en props
- Charge les affectations via l'edge function `admin-manage-assignments?admin_id=...` (le Super Admin a deja les droits)
- Affiche deux onglets (Tabs) : Utilisateurs et Entreprises
- Reutilise la meme structure de tableaux que MyAssignments :
  - **Utilisateurs** : Avatar/Nom, Pays (CountryBadge), Telephone, Completion (Progress + Tooltip), Date d'inscription
  - **Entreprises** : Nom, Pays, Type, Contact, Date d'inscription, Statut (Badge colore)
- Mode lecture seule (pas de bouton Retirer dans ce contexte)
- Inclut les boutons "Voir le profil" pour ouvrir UserProfileModal / BusinessProfileModal

Reutilise les fonctions `calculateProfileCompletion` et `getStatusBadge` (extraites ou dupliquees depuis MyAssignments).

### 2. Page `AdminManagement.tsx` - Ajout de l'action

- Importer `ViewAdminAssignmentsModal` et l'icone `ClipboardList` (ou `Eye`)
- Ajouter un etat `viewAssignmentsOpen: boolean` et reutiliser `selectedAdminId` / `selectedAdminName`
- Dans `renderAdminActions`, ajouter une option "Voir les affectations" entre "Affecter utilisateurs/entreprises" et "Revoquer l'acces admin"
- Rendre le modal en bas du composant avec les modals existants

### 3. Structure du menu Actions (resultat final)

```text
Desactiver / Activer
Modifier les permissions
Affecter utilisateurs/entreprises
Voir les affectations          <-- NOUVEAU
---
Revoquer l'acces admin (rouge)
```

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/admin/ViewAdminAssignmentsModal.tsx` | Creer | Modal avec tableaux detailles des affectations |
| `src/pages/Admin/AdminManagement.tsx` | Modifier | Ajouter l'action et le rendu du modal |

## Details techniques

- L'appel a l'edge function `admin-manage-assignments` avec `admin_id` du admin selectionne fonctionne deja pour les Super Admins (la verification `canManageAdmin` autorise les super_admin a gerer n'importe quel admin)
- Le modal sera en lecture seule pour eviter la confusion avec la page "Mes affectations" qui permet les modifications
- Les profils detailles (UserProfileModal, BusinessProfileModal) seront accessibles via un bouton dans chaque ligne
