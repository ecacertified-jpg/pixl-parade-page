

## Probleme

Le bouton "Se deconnecter" dans `ProfileDropdown.tsx` utilise `supabase.auth.signOut({ scope: 'global' })`. Si la session serveur est deja invalide ou corrompue (ce qui arrive souvent vu les logs `bad_jwt` / `missing sub claim`), l'appel echoue et le `catch` affiche le toast d'erreur rouge au lieu de deconnecter l'utilisateur.

Le meme probleme existe dans `BusinessProfileDropdown.tsx` mais est moins visible car le `catch` y navigue quand meme vers `/auth`.

---

## Correction

### Fichier 1 : `src/components/ProfileDropdown.tsx`

Rendre la deconnexion resiliente :
- Utiliser `scope: 'local'` au lieu de `'global'` (nettoie la session locale sans dependre du serveur)
- Toujours naviguer vers `/auth` meme en cas d'erreur
- Nettoyer manuellement les cles `sb-*` du localStorage en cas d'echec (via le helper existant `cleanupCorruptedSession`)
- Afficher le toast de succes dans tous les cas

### Fichier 2 : `src/components/BusinessProfileDropdown.tsx`

Appliquer la meme logique : utiliser `scope: 'local'` pour coherence et robustesse.

---

## Details techniques

```text
handleSignOut (avant)
  signOut({ scope: 'global' })
    -> Echec si session invalide -> Toast erreur -> Reste bloque

handleSignOut (apres)
  signOut({ scope: 'local' })
    -> Succes ou echec -> cleanupCorruptedSession() en fallback
    -> Toast succes -> Navigate /auth (toujours)
```

Le pattern `scope: 'local'` est suffisant pour une deconnexion utilisateur standard. Il supprime la session du navigateur sans appeler le serveur, ce qui le rend insensible aux erreurs JWT.

