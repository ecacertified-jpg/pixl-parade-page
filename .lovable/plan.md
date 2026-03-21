

# Plan : Recherche admin par téléphone et email

## Contexte

Les barres de recherche admin filtrent uniquement par nom. Les admins doivent aussi pouvoir chercher par **numéro de téléphone** et **email**.

## Emplacements à modifier

Il y a **4 points de recherche** à enrichir :

### 1. `src/components/admin/AssignUsersBusinessesModal.tsx` (ligne 113)
- **Utilisateurs** : ajouter `phone.ilike` au `.or()` existant
  - `first_name.ilike.%${s}%,last_name.ilike.%${s}%` → `first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%`
- **Entreprises** (ligne 136) : étendre avec `.or()` incluant `phone.ilike`, `email.ilike`
  - `query.ilike('business_name', ...)` → `query.or(\`business_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%\`)`

### 2. `src/components/admin/AddAdminModal.tsx` (lignes 80, 172)
- `fetchUsers` (ligne 80) : ajouter `phone` au select
- `filteredUsers` (ligne 172) : inclure `u.phone` dans le filtre local
  - `\`${u.first_name} ${u.last_name} ${u.phone || ''}\`.toLowerCase().includes(...)`

### 3. `src/components/admin/UserBusinessTable.tsx` (ligne 42)
- Filtre client-side : ajouter recherche dans les champs `phone` et `email` des businesses (déjà dans les données `UserWithBusiness`)
- Vérifier que le hook `useUserBusinessStats` charge bien `phone`/`email` des profils — si non, ajouter

### 4. `src/hooks/useFriendRequests.ts` (ligne 131) — recherche amis
- Ajouter `phone.ilike` au `.or()` pour permettre la recherche par téléphone
  - Note : pas d'email car `profiles` n'a pas de colonne email

### Placeholder des inputs
- Mettre à jour les placeholders des champs de recherche pour indiquer "Nom, téléphone ou email..." là où pertinent

## Fichiers modifiés

- `src/components/admin/AssignUsersBusinessesModal.tsx`
- `src/components/admin/AddAdminModal.tsx`
- `src/components/admin/UserBusinessTable.tsx`
- `src/hooks/useFriendRequests.ts`
- `src/hooks/useUserBusinessStats.ts` (si le phone profil n'est pas chargé)

