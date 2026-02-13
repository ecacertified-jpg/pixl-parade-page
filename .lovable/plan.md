

# Afficher les stats utilisateurs/entreprises par administrateur

## Objectif

Ajouter deux nouvelles colonnes dans le tableau des administrateurs : le nombre d'utilisateurs et le nombre d'entreprises dans les pays assignes a chaque admin. Cela permet au Super Admin de voir la charge de responsabilite de chaque administrateur.

## Logique metier

La relation admin-utilisateurs est indirecte : chaque admin a des `assigned_countries`, et chaque utilisateur/entreprise a un `country_code`. Les stats seront donc calculees en comptant les profils et business_accounts dont le `country_code` correspond aux pays assignes de l'admin.

- **Super Admin** (assigned_countries = NULL) : voit le total global
- **Admin Regional / Moderateur** : voit uniquement le total de ses pays assignes
- **Admin sans pays** : affiche 0

## Modifications

### 1. Edge Function `admin-list-admins`

Modifier la fonction pour calculer les stats par admin :

- Executer 2 requetes agreges au debut :
  - `SELECT country_code, COUNT(*) FROM profiles GROUP BY country_code`
  - `SELECT country_code, COUNT(*) FROM business_accounts GROUP BY country_code`
- Pour chaque admin, sommer les compteurs des pays dans `assigned_countries`
- Ajouter `stats: { users: number, businesses: number }` dans la reponse

Cela evite N+1 requetes : seulement 2 requetes supplementaires au total.

### 2. Interface `AdminManagement.tsx`

- Ajouter l'interface `stats` dans le type `Admin`
- Ajouter deux colonnes dans le tableau desktop : "Utilisateurs" et "Entreprises"
- Ajouter ces infos dans la vue mobile (cartes)
- Afficher les compteurs avec des icones Users et Building2

### 3. Fichiers concernes

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/admin-list-admins/index.ts` | Ajouter le calcul des stats par pays et les inclure dans la reponse |
| `src/pages/Admin/AdminManagement.tsx` | Ajouter les colonnes Utilisateurs / Entreprises dans le tableau et les cartes mobiles |

### 4. Format des donnees retournees

Chaque admin dans la reponse inclura :

```text
{
  ...donnees existantes,
  assigned_countries: ["CI", "BJ"],
  stats: {
    users: 222,      // somme des utilisateurs dans CI + BJ
    businesses: 27   // somme des entreprises dans CI + BJ
  }
}
```

### 5. Rendu visuel

Dans le tableau, entre "Pays" et "Date d'attribution", deux nouvelles colonnes :

```text
| Administrateur | Role | Pays | Utilisateurs | Entreprises | Date | Statut | Actions |
```

Chaque cellule affichera un nombre avec une icone (Users / Building2) de couleur subtle.

