

# Ajouter "Voir le profil" dans les actions des affectations

## Objectif

Ajouter une option "Voir le profil" dans le menu Actions de chaque ligne des tableaux utilisateurs et entreprises de la page "Mes affectations", en reutilisant les modals existants `UserProfileModal` et `BusinessProfileModal`.

## Modifications

### Fichier unique : `src/pages/Admin/MyAssignments.tsx`

**1. Imports a ajouter :**
- `UserProfileModal` depuis `@/components/admin/UserProfileModal`
- `BusinessProfileModal` depuis `@/components/admin/BusinessProfileModal`
- Icone `FileText` (ou `Eye`) depuis `lucide-react` pour l'option de menu

**2. Nouveaux etats :**
- `selectedUserId: string | null` - l'ID utilisateur selectionne pour le profil
- `userProfileModalOpen: boolean` - visibilite du modal profil utilisateur
- `selectedBusinessId: string | null` - l'ID entreprise selectionne
- `businessProfileModalOpen: boolean` - visibilite du modal profil entreprise

**3. Menu Actions - Onglet Utilisateurs :**

Ajouter avant l'option "Retirer" :

```text
Voir le profil  (icone FileText)
---  (separateur)
Retirer  (existant, en rouge)
```

Au clic, on set `selectedUserId = a.user_id` et `userProfileModalOpen = true`.

**4. Menu Actions - Onglet Entreprises :**

Ajouter avant l'option "Retirer" :

```text
Voir le profil  (icone FileText)
---  (separateur)
Retirer  (existant, en rouge)
```

Au clic, on set `selectedBusinessId = a.business_account_id` et `businessProfileModalOpen = true`.

**5. Rendu des modals :**

Ajouter en fin de composant, avant la fermeture du div principal :

```text
<UserProfileModal userId={selectedUserId} open={userProfileModalOpen} onOpenChange={setUserProfileModalOpen} />
<BusinessProfileModal businessId={selectedBusinessId} open={businessProfileModalOpen} onOpenChange={setBusinessProfileModalOpen} />
```

## Aucun autre fichier impacte

Les composants `UserProfileModal` et `BusinessProfileModal` existent deja et acceptent les memes props que celles utilisees dans `UserManagement.tsx` et `BusinessManagement.tsx`. Aucune modification de l'edge function n'est necessaire.

