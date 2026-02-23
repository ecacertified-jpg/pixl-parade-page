
# Lien de partage unique pour chaque Admin

## Objectif
Chaque admin dispose d'un lien de partage unique qu'il peut diffuser sur les reseaux sociaux. Quand un utilisateur ou une entreprise clique sur ce lien et se connecte/s'inscrit, il est automatiquement ajoute aux affectations de l'admin qui a partage le lien.

## Flux utilisateur

```text
Admin copie son lien (ex: joiedevivre.app/join/ADM-XXXX)
        |
        v
Utilisateur clique sur le lien
        |
        v
Redirection vers /auth ou /business-auth
(avec param ?admin_ref=ADM-XXXX stocke en sessionStorage)
        |
        v
Utilisateur s'inscrit ou se connecte
        |
        v
Edge Function auto-assigne l'utilisateur
a l'admin correspondant au code
        |
        v
Redirection vers /dashboard ou /business-account
```

## Modifications

### 1. Migration SQL - Table `admin_share_codes`

Nouvelle table pour stocker les codes de partage uniques des admins :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Cle primaire |
| admin_user_id | uuid | FK vers admin_users.id |
| code | text | Code unique (ex: ADM-A7X9) |
| is_active | boolean | Statut actif |
| clicks_count | integer | Nombre de clics |
| signups_count | integer | Inscriptions generees |
| assignments_count | integer | Affectations reussies |
| created_at | timestamptz | Date de creation |

RLS : seuls les admins actifs peuvent voir/gerer leurs propres codes. Fonction `generate_admin_share_code()` pour generer un code unique.

### 2. Route `/join/:code` - Page de redirection

Nouvelle page legere qui :
- Lit le code admin depuis l'URL
- Verifie sa validite via requete Supabase
- Incremente `clicks_count`
- Stocke le code en `sessionStorage` (`jdv_admin_ref`)
- Redirige vers `/auth` (utilisateur) ou `/business-auth` (entreprise) avec `?admin_ref=CODE`

### 3. Edge Function `admin-auto-assign`

Nouvelle Edge Function appelee apres inscription/connexion pour :
- Lire le `admin_ref` depuis les parametres
- Trouver l'admin correspondant au code
- Verifier que l'utilisateur n'est pas deja affecte
- Creer l'affectation dans `admin_user_assignments` ou `admin_business_assignments`
- Incrementer `signups_count` et `assignments_count`
- Creer une notification pour l'admin

### 4. Modification de `Auth.tsx` et `BusinessAuth.tsx`

Apres inscription/connexion reussie :
- Detecter le parametre `admin_ref` dans l'URL ou `sessionStorage`
- Appeler la Edge Function `admin-auto-assign` avec le code et le user_id
- Nettoyer le sessionStorage

### 5. Composant `AdminShareLinkCard`

Carte affichee dans "Mes affectations" ET accessible depuis le profil admin :
- Affiche le lien unique de l'admin
- Bouton copier le lien
- Menu de partage (WhatsApp, Facebook, Instagram/TikTok, SMS, Email, natif)
- Statistiques : clics, inscriptions, affectations
- Possibilite de regenerer le code

### 6. Composant `AdminShareMenu`

Dialog de partage (reutilisant le pattern de `BusinessShareMenu` et `ReferralShareMenu`) avec :
- Boutons WhatsApp, Facebook, SMS, Email, Copier, Partage natif
- Message pre-redige en francais avec le lien
- Icones coherentes avec l'existant

### 7. Hook `useAdminShareCode`

Hook personnalise pour :
- Charger le code de l'admin connecte
- Generer un code si inexistant (auto-generation au premier acces)
- Regenerer le code
- Recuperer les statistiques

## Details techniques

- Le code est au format `ADM-XXXX` (4 caracteres alphanumeriques) pour etre court et partageable
- Le lien est `{origin}/join/{CODE}` - court et propre pour les reseaux sociaux
- L'auto-affectation respecte la regle d'exclusivite : si l'utilisateur est deja affecte a un autre admin, pas de reassignation
- Le tracking de clics se fait cote client dans la page `/join/:code` pour simplicite
- La page `/join/:code` ne necessite pas d'authentification
