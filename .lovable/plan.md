
# Plan : corriger définitivement l’erreur OTP persistante

## Ce que j’ai confirmé

- L’envoi WhatsApp fonctionne bien : la requête `send-whatsapp-otp` renvoie `200` avec `success: true`.
- Le collage du code est déjà nettoyé côté client et côté Edge Function.
- Donc le vrai problème n’est probablement plus le copier-coller.

## Do I know what the issue is?

Oui.

Le bug le plus probable est un **mauvais routage du canal OTP au moment de la vérification** :

- `Auth.tsx` et `BusinessAuth.tsx` choisissent le canal avec `otpMethod || defaultMethod`
- or en Côte d’Ivoire, `defaultMethod` reste **`sms`**
- si l’utilisateur a reçu un code **WhatsApp**, mais que l’état local du canal n’est plus la source de vérité, l’app peut tenter une vérification **SMS** au lieu de `verify-whatsapp-otp`
- résultat : le code est bon pour WhatsApp, mais il est vérifié dans le mauvais backend, donc “Code invalide”

C’est cohérent avec le fait que :
- l’envoi WhatsApp réussit
- les anciennes corrections sur la sanitisation n’ont pas suffi
- le problème persiste surtout dans un contexte mobile où l’utilisateur sort vers WhatsApp puis revient

## Pourquoi les fixes précédents ne suffisent pas

Ils ont corrigé :
- les caractères invisibles
- les OTP multiples actifs

Mais ils n’ont pas rendu **persistante et fiable** la méthode réellement utilisée pour envoyer le code.

## Implémentation proposée

### 1. Introduire une vraie source de vérité : `activeOtpMethod`
Dans `Auth.tsx` et `BusinessAuth.tsx` :

- créer un état dédié pour la méthode effectivement envoyée (`sms` ou `whatsapp`)
- le définir uniquement **au moment où l’envoi réussit réellement**
- ne plus utiliser `defaultMethod` pour la vérification d’un code déjà envoyé

Règle :
```text
méthode choisie pour l’envoi = méthode obligatoire pour verify + resend
```

### 2. Persister ce canal pendant le flux OTP
Toujours dans `Auth.tsx` et `BusinessAuth.tsx` :

- stocker temporairement en `sessionStorage` :
  - `activeOtpMethod`
  - `currentPhone`
  - `authMode`
  - expiration/countdown
- restaurer ces infos au retour depuis WhatsApp si la page a été remount/rechargée

But :
- éviter qu’un retour depuis WhatsApp fasse retomber le flux sur `defaultMethod = sms`

### 3. Vérifier avec le bon backend
Modifier la logique de vérification :

- si `activeOtpMethod === 'whatsapp'` → appeler uniquement `verify-whatsapp-otp`
- si `activeOtpMethod === 'sms'` → appeler uniquement `supabase.auth.verifyOtp({ type: 'sms' })`

Et faire la même chose pour **renvoyer** le code :
- resend WhatsApp si le dernier envoi était WhatsApp
- resend SMS si le dernier envoi était SMS

### 4. Afficher clairement le canal dans l’écran OTP
Améliorer l’UI OTP dans les deux pages :

- afficher “Code envoyé via WhatsApp” ou “Code envoyé par SMS”
- éviter le texte générique “Code envoyé au ...”

Cela réduit la confusion utilisateur et sert aussi de vérification visuelle du bon flux.

### 5. Ajouter un logging ciblé et sûr
Comme l’erreur persiste depuis plusieurs itérations :

- ajouter des logs masqués côté client et Edge Function :
  - canal utilisé pour l’envoi
  - canal utilisé pour la vérification
  - téléphone masqué
  - résultat de lookup OTP
- ne jamais logger le code OTP brut

## Fichiers à modifier

| Fichier | Action |
|---|---|
| `src/pages/Auth.tsx` | mémoriser/restaurer `activeOtpMethod`, utiliser ce canal pour verify/resend, afficher le canal dans l’UI OTP |
| `src/pages/BusinessAuth.tsx` | même correction que `Auth.tsx` |
| `supabase/functions/verify-whatsapp-otp/index.ts` | enrichir les logs de diagnostic, sans exposer de données sensibles |

## Détail technique

```text
Aujourd’hui
send via WhatsApp -> état local fragile -> verify choisit parfois sms -> "Code invalide"

Après correction
send via WhatsApp -> activeOtpMethod = whatsapp (persisté) -> verify-whatsapp-otp
send via SMS      -> activeOtpMethod = sms       (persisté) -> supabase.auth.verifyOtp
```

## Résultat attendu

- un code reçu sur WhatsApp est toujours vérifié via le flux WhatsApp
- le retour depuis WhatsApp ne casse plus le canal choisi
- le même correctif couvre connexion et inscription
- le bug cesse sur la page Auth et sur la page BusinessAuth
