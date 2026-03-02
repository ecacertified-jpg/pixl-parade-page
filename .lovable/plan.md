
# Lier manuellement un contact a son compte utilisateur

## Contexte

Le systeme actuel lie automatiquement les contacts aux utilisateurs via les 8 derniers chiffres du numero de telephone (triggers `auto_link_contact_on_insert/update` et `handle_new_user`). Cependant, si le numero du contact ne correspond a aucun profil enregistre (cas de Marie Belle), le `linked_user_id` reste `NULL` et les amis du beneficiaire ne sont jamais notifies lors des contributions.

## Solution

Ajouter un bouton "Lier a un compte" sur chaque contact non lie dans le Dashboard. Ce bouton ouvre un dialog de recherche par nom/telephone parmi les utilisateurs inscrits (`public_profiles`). Une fois le lien confirme, le systeme met a jour `linked_user_id` et cree la relation dans `contact_relationships`.

## Composants a creer/modifier

### 1. Nouveau composant : `src/components/LinkContactDialog.tsx`

Un dialog modal contenant :
- Un champ de recherche (texte libre : nom ou telephone)
- Une liste de resultats depuis la vue `public_profiles` (filtree par `first_name ILIKE` ou `phone ILIKE`)
- Chaque resultat affiche : avatar, prenom, nom, telephone (masque partiellement)
- Un bouton "Lier" par resultat qui :
  - Met a jour `contacts.linked_user_id` avec le `user_id` selectionne
  - Insere dans `contact_relationships` (avec `LEAST/GREATEST` pour la symetrie)
  - Rafraichit la liste des contacts

### 2. Modification : `src/pages/Dashboard.tsx`

- Remplacer le bouton "Inviter" (icone Send) des contacts non lies par un groupe de 2 boutons :
  - **Lier** (icone `Link`) : ouvre `LinkContactDialog`
  - **Inviter** (icone `Send`) : comportement actuel d'invitation
- Importer et integrer `LinkContactDialog`

### 3. Edge Function ou RPC (optionnel, simplifie)

Pas necessaire : les deux operations (UPDATE contact + INSERT contact_relationship) peuvent etre faites cote client via le SDK Supabase, car l'utilisateur est proprietaire du contact (RLS le permet).

## Flux utilisateur

```text
Contact "Marie Belle" (non lie)
  |
  [Clic bouton Lier]
  |
  Dialog de recherche s'ouvre
  |
  Saisie "Marie" -> resultats: Marie Best, Marie Grace, Marie Belle...
  |
  [Clic "Lier" sur le bon profil]
  |
  contacts.linked_user_id = user_id du profil
  contact_relationships cree (bidirectionnel)
  |
  Badge "Sur l'app" apparait, notifications activees
```

## Details techniques

### Recherche dans `public_profiles`

```typescript
const { data } = await supabase
  .from('public_profiles')
  .select('user_id, first_name, last_name, avatar_url, phone')
  .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
  .neq('user_id', currentUserId) // Exclure soi-meme
  .limit(10);
```

### Liaison (2 operations)

```typescript
// 1. Mettre a jour linked_user_id
await supabase
  .from('contacts')
  .update({ linked_user_id: selectedUserId })
  .eq('id', contactId)
  .eq('user_id', currentUserId);

// 2. Creer la relation bidirectionnelle
await supabase
  .from('contact_relationships')
  .upsert({
    user_a: least(currentUserId, selectedUserId),
    user_b: greatest(currentUserId, selectedUserId),
    can_see_events: true,
    can_see_funds: true
  }, { onConflict: 'user_a,user_b' });
```

Note : `LEAST/GREATEST` sera calcule cote JS avant l'insertion pour respecter l'index symetrique.

## Fichiers modifies

- **Nouveau** : `src/components/LinkContactDialog.tsx`
- **Modifie** : `src/pages/Dashboard.tsx` (ajout du bouton Lier + integration du dialog)
