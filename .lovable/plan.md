

# Corriger la visibilite des affectations pour les admins regionaux

## Probleme identifie

La fonction Edge `admin-manage-assignments` contient une restriction trop severe dans la fonction `canManageAdmin` (ligne 27-32) :

```text
super_admin -> peut voir les affectations de tous les admins
regional_admin -> ne peut voir QUE ses propres affectations (bug)
moderator -> ne peut voir QUE ses propres affectations
```

Un administrateur regional devrait pouvoir consulter les affectations de ses moderateurs (ceux qui partagent les memes pays assignes).

## Solution

### 1. Modifier la fonction `canManageAdmin` dans l'Edge Function

Ajouter une logique qui permet aux `regional_admin` de voir les affectations des admins qui partagent au moins un pays commun dans `assigned_countries`. Cela necessite de recuperer les pays assignes des deux admins pour comparer.

**Fichier** : `supabase/functions/admin-manage-assignments/index.ts`

- Enrichir `getAdminInfo` pour inclure `assigned_countries`
- Modifier `canManageAdmin` pour qu'un `regional_admin` puisse acceder aux affectations d'un admin ayant au moins un pays en commun
- Le `regional_admin` pourra uniquement **consulter** (GET) les affectations, pas les modifier (POST/DELETE) pour les autres admins

### 2. Ajouter la verification des pays cibles

Avant d'autoriser l'acces, la fonction recuperera les `assigned_countries` de l'admin cible et verifiera l'intersection avec ceux de l'appelant.

### Securite

- Seul le **GET** sera elargi aux `regional_admin` pour leurs moderateurs
- Les operations **POST** et **DELETE** restent reservees aux `super_admin` et a l'admin lui-meme
- La verification se fait cote serveur dans la Edge Function (pas de changement cote client)

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/admin-manage-assignments/index.ts` | Elargir `canManageAdmin` pour les `regional_admin` en lecture |

