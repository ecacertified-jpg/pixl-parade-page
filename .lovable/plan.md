

# Correction de la recherche utilisateur dans `verify-whatsapp-otp`

## Probleme racine

Le telephone est stocke dans `auth.users` **sans le prefixe `+`** (ex: `2250707467445`), mais le code cherche avec le `+` (ex: `+2250707467445`). Le filtre `listUsers({ filter: phone })` ne matche donc jamais.

Preuve en base :
- Stocke : `2250707467445`
- Recherche : `+2250707467445`

## Solution

Modifier la strategie de recherche dans `verify-whatsapp-otp/index.ts` pour :

1. **Chercher d'abord dans la table `profiles`** (qui contient le `user_id` et le `phone`) via une requete Supabase standard, ce qui est plus fiable que `listUsers` pour trouver un utilisateur par telephone.

2. **Si non trouve dans `profiles`, chercher via `listUsers` avec les deux formats** : avec et sans le `+`.

3. **En dernier recours lors de `phone_exists`**, chercher directement dans `auth.users` via une requete SQL admin.

## Fichier modifie

`supabase/functions/verify-whatsapp-otp/index.ts` -- section recherche utilisateur (lignes 109-160)

## Details techniques

### Nouvelle logique de recherche (lignes 109-160)

```typescript
// 1. Chercher dans profiles par phone
const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
const phoneWithoutPlus = phone.replace(/^\+/, '');

const { data: profileData } = await supabaseAdmin
  .from('profiles')
  .select('user_id')
  .or(`phone.eq.${phoneWithPlus},phone.eq.${phoneWithoutPlus}`)
  .limit(1)
  .maybeSingle();

let existingUser = null;

if (profileData?.user_id) {
  const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profileData.user_id);
  if (userData?.user) {
    existingUser = userData.user;
  }
}

// 2. Si pas dans profiles, tenter listUsers avec les deux formats
if (!existingUser) {
  const { data: listData1 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithPlus });
  existingUser = listData1?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus);

  if (!existingUser) {
    const { data: listData2 } = await supabaseAdmin.auth.admin.listUsers({ filter: phoneWithoutPlus });
    existingUser = listData2?.users?.find(u => u.phone === phoneWithPlus || u.phone === phoneWithoutPlus);
  }
}
```

### Gestion `phone_exists` amelioree (retry)

En cas de `phone_exists` apres `createUser`, utiliser `getUserById` via la table `profiles` ou chercher avec les deux formats telephone plutot que de refaire un simple `listUsers({ filter })`.

### Pas d'autre changement

Le reste du code (generation magiclink, session) reste identique. Seule la section de recherche utilisateur est corrigee.

