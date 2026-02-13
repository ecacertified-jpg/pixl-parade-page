

# Permettre aux admins de creer leurs propres listes d'utilisateurs et d'entreprises

## Objectif

Chaque administrateur (pas seulement le Super Admin) pourra se constituer sa propre liste d'utilisateurs et d'entreprises a partir des listes globales. Un utilisateur ou une entreprise ne peut appartenir qu'a un seul administrateur a la fois (exclusivite).

## Logique metier

- Un admin ouvre une nouvelle page "Mes affectations" dans la sidebar
- Il voit ses utilisateurs et entreprises deja assignes
- Il peut ajouter de nouveaux utilisateurs/entreprises depuis les listes globales
- Les utilisateurs/entreprises deja assignes a un autre admin sont marques comme indisponibles et ne peuvent pas etre selectionnes
- Le Super Admin conserve sa capacite d'affecter via la page "Administrateurs"

## Modifications

### 1. Nouvelle page : `src/pages/Admin/MyAssignments.tsx`

Page accessible a tous les admins, avec deux onglets :

- **Onglet "Mes utilisateurs"** : liste des utilisateurs assignes a l'admin connecte, avec possibilite de retirer
- **Onglet "Mes entreprises"** : idem pour les entreprises

Bouton "Ajouter" qui ouvre un modal de selection.

### 2. Nouveau composant : `src/components/admin/SelfAssignModal.tsx`

Modal similaire a `AssignUsersBusinessesModal` mais :

- L'admin s'affecte a lui-meme (pas besoin de choisir un admin cible)
- Les utilisateurs/entreprises deja assignes a un autre admin sont **grises avec un label "Deja affecte a [Nom Admin]"**
- Seuls les elements non assignes ou deja assignes a soi-meme sont cochables

### 3. Mise a jour de l'Edge Function : `admin-manage-assignments`

Actuellement reservee aux Super Admins. Modifications :

- **GET** : permettre a tout admin actif de lister ses propres affectations (si `admin_id` correspond a son propre `admin_users.id`)
- **POST** : permettre a tout admin actif d'ajouter des affectations a lui-meme, avec verification d'exclusivite (rejeter si l'utilisateur/entreprise est deja assigne a un autre admin)
- **DELETE** : permettre a tout admin actif de retirer ses propres affectations
- Le Super Admin conserve le droit de gerer les affectations de n'importe quel admin

### 4. Nouvelle route dans `App.tsx`

```text
/admin/my-assignments -> MyAssignments (AdminRoute, tous les admins)
```

### 5. Nouveau lien dans la sidebar (`AdminLayout.tsx`)

Ajouter entre "Logs d'audit" et "Dashboard" ou a un endroit pertinent :

```text
{ title: 'Mes affectations', href: '/admin/my-assignments', icon: ClipboardList }
```

## Verification d'exclusivite (Edge Function)

Avant d'inserer une nouvelle affectation, l'edge function verifiera :

```text
SELECT admin_user_id FROM admin_user_assignments WHERE user_id = :uid
-> Si resultat existe et admin_user_id != admin demandeur -> REJET avec message
```

Meme logique pour les entreprises.

Pour le modal, une requete pre-chargera tous les `user_id` / `business_account_id` deja assignes avec le nom de l'admin, afin d'afficher l'info en temps reel dans la liste.

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/pages/Admin/MyAssignments.tsx` | Creer | Page "Mes affectations" avec onglets et gestion |
| `src/components/admin/SelfAssignModal.tsx` | Creer | Modal de selection avec filtre d'exclusivite |
| `supabase/functions/admin-manage-assignments/index.ts` | Modifier | Ouvrir aux admins (self), ajouter verification d'exclusivite |
| `src/App.tsx` | Modifier | Ajouter la route `/admin/my-assignments` |
| `src/components/AdminLayout.tsx` | Modifier | Ajouter le lien sidebar "Mes affectations" |

## Flux utilisateur

1. L'admin clique sur "Mes affectations" dans la sidebar
2. Il voit ses listes actuelles d'utilisateurs et d'entreprises
3. Il clique sur "Ajouter des utilisateurs" ou "Ajouter des entreprises"
4. Le modal s'ouvre avec une recherche et les listes globales
5. Les elements deja pris par un autre admin sont grises avec indication du responsable
6. L'admin coche les elements disponibles et enregistre
7. Les affectations sont sauvegardees, la liste se met a jour

