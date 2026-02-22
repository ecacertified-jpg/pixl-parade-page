

## Logs structures pour verify-whatsapp-otp

### Objectif
Remplacer les `console.log` / `console.error` eparpilles par un systeme de logging structure avec :
- Un **request ID** unique par requete pour tracer le flux complet
- Des **etapes nommees** (step) pour identifier rapidement ou le processus echoue
- Des **durees** (ms) pour chaque etape afin de detecter les lenteurs
- Un **log de synthese** en fin de requete avec le resultat global

### Format des logs

Chaque log sera un objet JSON avec cette structure :
```text
{
  "requestId": "abc123",
  "step": "profile_lookup",
  "phone": "+225...",
  "duration_ms": 45,
  "result": "found",
  "details": { "user_id": "..." }
}
```

### Etapes tracees

| Etape | Quand | Informations loguees |
|-------|-------|---------------------|
| `request_start` | Debut de la requete | phone (masque), timestamp |
| `otp_lookup` | Recherche du code OTP | found/not_found, otp_id, attempts |
| `otp_validation` | Verification du code | valid/invalid, remaining_attempts |
| `profile_lookup` | Recherche dans profiles | found/not_found, user_id |
| `listusers_lookup` | Recherche via listUsers | found/not_found, format utilise, user_id |
| `user_creation` | Creation d'un nouvel utilisateur | success/error, user_id, country |
| `phone_exists_retry` | Retry apres erreur phone_exists | found/not_found, methode |
| `email_setup` | Mise a jour email fictif | email genere |
| `magiclink_generate` | Generation du magiclink | success/error |
| `session_create` | Verification OTP magiclink | success/error, has_session |
| `cleanup` | Suppression OTP verifie | success |
| `request_complete` | Fin de la requete | total_duration_ms, result, is_new_user |

### Details techniques

**Fichier modifie** : `supabase/functions/verify-whatsapp-otp/index.ts`

**Implementation** :
- Une fonction helper `createLogger(phone)` qui retourne un objet avec une methode `log(step, data)` et `summary()`
- Le request ID est genere via `crypto.randomUUID().slice(0, 8)`
- Le telephone est masque dans les logs (ex: `+225***5445`) pour la securite
- Chaque appel a `log()` mesure le temps depuis la derniere etape
- La methode `summary()` produit un log final avec la duree totale et toutes les etapes traversees
- Les `console.error` existants sont remplaces par des logs structures avec `level: "error"`

**Securite** :
- Le code OTP n'est jamais logue
- Le telephone est partiellement masque
- Les tokens de session ne sont pas logues

**Pas de migration SQL necessaire** - modifications uniquement dans l'Edge Function.

