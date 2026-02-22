
# Correction du bug `verify-whatsapp-otp` : recherche d'utilisateur et creation de session

## Probleme identifie

Le flux de verification OTP WhatsApp echoue a l'etape de creation de session. Deux bugs sont en cause :

1. **Recherche d'utilisateur defaillante** : `listUsers()` retourne seulement la premiere page (~50 utilisateurs). Avec 270+ utilisateurs en base, le numero `+2250707467445` n'est pas trouve, et le code tente de creer un utilisateur deja existant, ce qui declenche l'erreur `phone_exists`.

2. **Creation de session fragile** : le mecanisme actuel utilise un mot de passe temporaire + `signInWithPassword`, ce qui est peu fiable et pose des problemes de securite.

## Solution proposee

Remplacer la logique defaillante dans `verify-whatsapp-otp/index.ts` par :

### 1. Recherche utilisateur via `listUsers({ filter })` avec gestion `phone_exists`

Utiliser le filtre natif de l'API Admin pour chercher par telephone au lieu de charger tous les utilisateurs :

```typescript
// Chercher l'utilisateur par telephone via l'API Admin
const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
  filter: phone  // Filtre cote serveur, pas besoin de tout charger
});
const existingUser = listData?.users?.find(u => u.phone === phone);
```

En cas de `phone_exists` lors de `createUser`, traiter comme un utilisateur existant au lieu de retourner une erreur.

### 2. Generation de session via `generateLink` au lieu de `signInWithPassword`

Utiliser `generateLink({ type: 'magiclink' })` pour obtenir les proprietes de hachage, puis les utiliser avec `verifyOtp({ type: 'magiclink' })` pour creer une session propre sans mot de passe temporaire :

```typescript
const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',
  email: emailForPhone,
});

// Extraire le token du lien genere
const url = new URL(linkData.properties.action_link);
const token = url.searchParams.get('token');

// Utiliser verifyOtp pour creer une session
const { data: sessionData } = await supabaseAdmin.auth.verifyOtp({
  token_hash: token,
  type: 'magiclink',
});
```

### 3. Suppression du mecanisme de mot de passe temporaire

Retirer entierement la logique de `tempPassword` + `signInWithPassword` qui est source de bugs et de failles de securite.

## Fichier modifie

- `supabase/functions/verify-whatsapp-otp/index.ts` : refactoring de la section recherche utilisateur (lignes 109-200+)

## Details techniques

### Flux corrige

```
Code OTP valide
    |
    v
Recherche utilisateur par filtre telephone
    |
    +-- Trouve --> utiliser l'utilisateur existant
    |
    +-- Non trouve --> createUser()
         |
         +-- Succes --> nouvel utilisateur
         |
         +-- phone_exists --> re-rechercher et utiliser l'existant
    |
    v
Generer un magiclink via l'API Admin
    |
    v
Extraire le token_hash du lien
    |
    v
verifyOtp(token_hash) --> session (access_token + refresh_token)
    |
    v
Retourner la session au client
```

### Points de securite

- Suppression du mot de passe temporaire (faille potentielle)
- Pas de `listUsers()` complet (performance et scalabilite)
- Email fictif genere de maniere deterministe a partir du telephone pour le magiclink
