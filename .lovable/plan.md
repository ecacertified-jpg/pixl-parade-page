

## Probleme identifie

L'erreur "Impossible d'envoyer le code WhatsApp" se produit parce que la passerelle Supabase Edge **rejette la requete avant qu'elle n'atteigne la fonction**. Voici ce qui se passe :

1. Le telephone de l'utilisateur a une session corrompue/expiree dans le localStorage (probleme recurrent lie aux erreurs `bad_jwt` / `missing sub claim`)
2. `supabase.functions.invoke()` envoie automatiquement ce token JWT invalide dans l'en-tete `Authorization`
3. La passerelle Supabase valide le JWT et retourne une erreur 401 **avant** que la fonction Edge ne s'execute
4. Cote client, `error` est vrai, donc le message d'erreur s'affiche

Preuve : les logs serveur montrent que la fonction n'a jamais ete appelee au moment de l'erreur (09:14), alors qu'un appel precedent a 08:16 a fonctionne.

---

## Solution

Remplacer `supabase.functions.invoke()` par un appel `fetch()` direct **sans en-tete d'authentification** pour la fonction `send-whatsapp-otp`. Cette fonction ne necessite aucune authentification utilisateur (elle utilise le service role key cote serveur), donc il est inutile et risque d'envoyer un JWT.

### Fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `src/pages/BusinessAuth.tsx` | Remplacer `supabase.functions.invoke('send-whatsapp-otp', ...)` par `fetch()` direct |
| `src/pages/Auth.tsx` | Meme modification pour le flux utilisateur standard |

### Changement technique

```text
AVANT (vulnerable aux sessions corrompues) :
  supabase.functions.invoke('send-whatsapp-otp', { body: {...} })
  -> Envoie automatiquement le JWT (possiblement invalide)
  -> Passerelle rejette avec 401
  -> Erreur affichee

APRES (resilient) :
  fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({...})
  })
  -> Pas de JWT envoye, apikey suffit pour l'acces anon
  -> La fonction s'execute normalement
```

L'URL et la cle anon sont deja disponibles dans `src/integrations/supabase/client.ts`.

### Alternative consideree

Ajouter un `cleanupCorruptedSession()` avant l'appel : rejete car cela deconnecterait l'utilisateur en cours de session valide. Le `fetch` direct est plus propre et cible.

