## Problème

Quand l'utilisateur clique sur **"Recevoir"** dans la modale d'avertissement WhatsApp, l'écran OTP (les 6 cases pour saisir le code) ne s'affiche qu'après :
1. La fermeture de la modale d'avertissement
2. La fermeture du flow de discovery (`PreAuthDiscovery`)
3. L'appel serveur de vérification de doublons (`checkExistingAccount`)
4. L'appel à l'edge function `send-whatsapp-otp`

Soit ~2-5 secondes d'attente sur un écran qui semble figé. L'utilisateur peut cliquer ailleurs par confusion.

## Solution : transition optimiste vers l'écran OTP

Afficher l'écran OTP **immédiatement** au clic sur "Recevoir", puis exécuter en arrière-plan la vérification de doublons et l'envoi du code WhatsApp. En cas d'erreur (doublon détecté ou échec d'envoi), revenir en arrière proprement.

### Changements

**`src/pages/Auth.tsx`** — handler `onSubmitPhoneSignup` du composant `<PreAuthDiscovery>` (lignes 1927-1946) :
- Avant `await sendOtpSignUp(...)`, faire immédiatement :
  - `setCurrentPhone(\`${data.countryCode}${data.phone}\`)`
  - `setOtpMethod('whatsapp')` (méthode par défaut du flow discovery)
  - `setOtpSent(true)` → bascule sur l'UI OTP (lignes 1820+)
  - `setShowDiscovery(false)` (déjà fait)
  - `setAuthMode('signup')` (déjà fait)
- Lancer `sendOtpSignUp(...)` sans `await` (fire-and-forget) pour ne pas bloquer.

**`src/pages/Auth.tsx`** — fonction `sendOtpSignUp` (lignes 579-663) :
- Si un doublon exact est détecté, faire un `setOtpSent(false)` avant d'ouvrir la modale de doublon, pour ramener l'utilisateur en arrière sans piéger l'écran OTP.
- Si l'envoi WhatsApp échoue (`sendWhatsAppOtp` retourne sans succès), faire un `setOtpSent(false)` afin que l'utilisateur retourne au formulaire (le toast d'erreur est déjà affiché).

**`src/pages/Auth.tsx`** — fonction `sendWhatsAppOtp` (lignes 453-510) :
- Retourner un booléen `success` pour permettre à `sendOtpSignUp` (ou au handler discovery) de savoir si l'OTP a vraiment été envoyé. Aujourd'hui la fonction ne retourne rien.
- Idem pour `sendSmsOtp` afin de garder la cohérence.

**`src/components/PreAuthDiscovery.tsx`** — bouton "Recevoir" (lignes 723-733) :
- Ne plus attendre `handlePhoneSignup()` (retirer le `await` interne) : la modale doit se fermer instantanément. Le state `submittingPhone` n'est plus nécessaire pour bloquer l'UI puisque l'écran OTP prend le relais.

### UX résultante

1. Clic sur "Recevoir" → modale fermée + écran OTP visible **en < 100 ms**.
2. Le toast "Code envoyé via WhatsApp" apparaît dès que l'edge function répond.
3. En cas d'erreur (doublon, échec envoi), retour automatique au formulaire avec toast explicite.

### Détails techniques

- Pas de modification du composant OTP lui-même — il sait déjà gérer `countdown=0` (l'utilisateur peut commencer à voir les cases pendant que le code arrive).
- `currentPhone` est défini avant `setOtpSent(true)` pour éviter un flash "Code envoyé au " vide dans le header (ligne 1825).
- Aucun changement de schéma DB ni d'edge function.
