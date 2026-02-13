

# Enrichir l'affichage des affectations avec des tableaux detailles

## Objectif

Transformer la page "Mes affectations" pour afficher les utilisateurs et entreprises dans des tableaux riches avec les memes colonnes que les pages de gestion globales (UserManagement et BusinessManagement).

## Modifications

### 1. Edge Function `admin-manage-assignments` - Enrichir les donnees retournees

Dans le handler GET (quand `admin_id` est fourni), enrichir les requetes pour retourner plus de champs :

**Profils utilisateurs** : ajouter `phone`, `country_code`, `birthday`, `city`, `bio`, `created_at`, `is_suspended` aux champs selectionnes dans la requete `profiles`.

**Entreprises** : ajouter `email`, `phone`, `country_code`, `created_at`, `status`, `is_active`, `is_verified` aux champs selectionnes dans la requete `business_accounts`.

### 2. Page `MyAssignments.tsx` - Tableaux riches

Remplacer les listes simples de cartes par des tableaux structures.

**Onglet Utilisateurs** - Colonnes :
| Colonne | Donnee |
|---------|--------|
| Utilisateur | Avatar + Nom complet |
| Pays | CountryBadge avec code pays |
| Telephone | Numero ou "Non renseigne" |
| Completion | Barre de progression + pourcentage (meme calcul que UserManagement) |
| Date d'inscription | Format fr-FR |
| Actions | Menu deroulant (Retirer) |

**Onglet Entreprises** - Colonnes :
| Colonne | Donnee |
|---------|--------|
| Nom du business | Nom de l'entreprise |
| Pays | CountryBadge |
| Type | Type d'activite |
| Contact | Email + telephone |
| Date d'inscription | Format fr-FR |
| Statut | Badge colore selon statut |
| Actions | Menu deroulant (Retirer) |

Le calcul de completion de profil sera importe depuis la meme logique que `UserManagement.tsx` (fonction `calculateProfileCompletion` avec les poids : prenom 15%, nom 15%, telephone 15%, ville 15%, anniversaire 15%, photo 15%, bio 10%).

### 3. Composants reutilises

- `CountryBadge` pour l'affichage du pays
- `Progress` pour la barre de completion
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead` pour la structure
- `Badge` pour les statuts d'entreprise
- `DropdownMenu` pour les actions
- `Avatar` pour les photos de profil
- `Tooltip` pour le detail des champs de completion

## Fichiers concernes

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/functions/admin-manage-assignments/index.ts` | Modifier | Elargir les champs selectionnes pour profiles et business_accounts |
| `src/pages/Admin/MyAssignments.tsx` | Modifier | Remplacer les cartes par des tableaux riches avec toutes les colonnes |

