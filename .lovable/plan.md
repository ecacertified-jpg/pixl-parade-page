
Objectif: supprimer l’erreur persistante “Code invalide” quand l’utilisateur saisit un OTP WhatsApp encore valable, surtout après plusieurs demandes ou un copier-coller depuis WhatsApp.

1. Corriger la vraie cause dans l’Edge Function `verify-whatsapp-otp`
- Le bug principal vient du fait que la fonction ne lit que le dernier OTP non vérifié pour un numéro:
  - `order(created_at desc).limit(1).maybeSingle()`
- Si l’utilisateur a reçu plusieurs codes encore valides, il peut entrer un ancien code toujours dans WhatsApp, mais la fonction compare uniquement avec le plus récent et renvoie “Code invalide”.
- Modification prévue:
  - rechercher d’abord un OTP exact par `phone + code` parmi les OTP non vérifiés et non expirés
  - ne plus dépendre uniquement du “dernier OTP”
  - si aucun OTP exact n’existe, retourner l’erreur actuelle
- Bonus sécurité:
  - après validation réussie d’un code, invalider aussi les autres OTP actifs du même numéro pour éviter les ambiguïtés futures

2. Assainir la génération d’OTP dans `send-whatsapp-otp`
- Aujourd’hui, plusieurs OTP actifs peuvent coexister pour un même numéro.
- Modification prévue:
  - avant d’insérer un nouveau code, supprimer ou marquer invalides les OTP précédents non vérifiés du même numéro
  - conserver la règle de rate limit 60s
- Résultat:
  - un seul OTP actif par numéro
  - cohérence entre le code reçu et le code attendu côté vérification

3. Aligner `BusinessAuth.tsx` avec `Auth.tsx` sur le rate limit
- `Auth.tsx` gère déjà le `429 rate_limit` correctement en affichant l’écran de saisie OTP et en synchronisant le countdown.
- `BusinessAuth.tsx` affiche encore une erreur destructrice dans ce cas.
- Modification prévue:
  - reproduire la même logique dans `BusinessAuth.tsx`
  - si le serveur répond `rate_limit`, ouvrir l’écran OTP au lieu d’afficher une erreur bloquante

4. Durcir l’UX contre les doubles demandes
- Le flux OTP peut être relancé plusieurs fois rapidement, créant des situations ambiguës.
- Modification prévue:
  - ajouter un garde-fou simple côté client pour éviter les doubles clics / doubles soumissions pendant l’envoi
  - réutiliser le pattern déjà recommandé dans les mémoires de résilience auth
- Impact:
  - moins de créations d’OTP concurrents
  - moins de cas où l’utilisateur reçoit plusieurs codes rapprochés

5. Vérifier les deux écrans concernés
- `src/pages/Auth.tsx`
- `src/pages/BusinessAuth.tsx`
- Vérifications à couvrir après implémentation:
  - connexion: demander un code, coller le code WhatsApp, validation OK
  - inscription: même comportement
  - renvoi avant 60s: bascule vers l’écran OTP sans erreur bloquante
  - ancien code expiré: erreur claire
  - dernier code valide: connexion réussie

Fichiers à modifier
- `supabase/functions/verify-whatsapp-otp/index.ts`
- `supabase/functions/send-whatsapp-otp/index.ts`
- `src/pages/BusinessAuth.tsx`
- possiblement `src/pages/Auth.tsx` pour harmoniser le garde-fou anti double soumission

Pourquoi l’erreur continue aujourd’hui
- Le code n’est plus rejeté à cause du copier-coller uniquement.
- Le problème le plus probable est maintenant un décalage entre:
  - le code que l’utilisateur voit dans WhatsApp
  - le code le plus récent stocké dans `whatsapp_otp_codes`
- Donc un code “valide pour l’utilisateur” peut être “invalide pour la fonction” si un autre OTP a été créé après.

Détail technique
```text
Aujourd’hui:
verify-whatsapp-otp
→ prend le dernier OTP actif du numéro
→ compare son code au code saisi

Cas d’échec:
OTP A envoyé
OTP B envoyé ensuite
utilisateur saisit OTP A
→ la fonction charge OTP B
→ comparaison échoue
→ "Code invalide"

Après correction:
verify-whatsapp-otp
→ cherche l’OTP actif correspondant exactement au code saisi
→ si trouvé: succès
→ sinon: erreur
```
