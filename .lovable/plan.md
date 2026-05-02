## Problèmes identifiés

**1. Modale "Un compte similaire existe déjà" s'affiche systématiquement**

Dans `supabase/functions/check-existing-account/index.ts` (lignes 160-209), une recherche fuzzy par prénom (`ilike '%aissatou%'`) ramène n'importe quel profil existant qui partage un prénom courant. Côté client (`src/pages/Auth.tsx` ligne 592), dès que `accounts.length > 0`, la modale s'ouvre — **sans tenir compte du `confidence`**. Le fallback `useDuplicateAccountDetection.ts` fait exactement la même chose côté client.

Résultat : tout utilisateur dont le prénom existe déjà en base (très fréquent : Aïssatou, Koffi, Aya…) est bloqué, peu importe son numéro réel.

**2. Le sélecteur SMS / WhatsApp s'affiche au lieu de WhatsApp seul**

Pour la Côte d'Ivoire, `country.smsReliability = 'unreliable'` + `whatsappFallbackEnabled = true` → `showFallback = true` (choix manuel) au lieu de `autoWhatsApp = true` (envoi WhatsApp direct). C'est pour cela que l'écran « Mode de vérification » apparaît avec deux boutons.

L'utilisateur veut **uniquement WhatsApp** après le clic sur "Recevoir mon code de vérification".

---

## Correctifs proposés

### A. Détection de doublon : ne déclencher la modale QUE pour les correspondances exactes

**`src/pages/Auth.tsx`** (et symétriquement pour les chemins email/signin lignes ~1145)
- Remplacer `if (serverResult.exists && serverResult.accounts.length > 0)` par :
  ```ts
  const hasExactMatch = serverResult.accounts.some(
    (a: any) => a.is_exact_phone_match || a.is_exact_email_match
  );
  if (serverResult.exists && hasExactMatch && serverResult.confidence === 'high') { … modal … }
  ```
- Supprimer entièrement le fallback client-side `checkForDuplicate(...)` qui ne se base que sur le prénom — il génère des faux positifs et duplique la logique serveur.

**`supabase/functions/check-existing-account/index.ts`**
- Supprimer (ou désactiver derrière un flag `include_name_matches: true`) le bloc de recherche fuzzy par prénom (lignes 160-209). Cette branche n'apporte rien de fiable et empoisonne les inscriptions.
- Ne renvoyer `exists: true` que pour les correspondances exactes téléphone/email.

**`src/components/DuplicateAccountModal.tsx`**
- Plus de changement nécessaire : la modale ne s'affichera désormais qu'en cas de vrai doublon (téléphone ou email exact).

### B. Forcer WhatsApp pour la Côte d'Ivoire (et alignement avec la stratégie WhatsApp-first)

**`src/components/auth/OtpMethodSelector.tsx`** — ajuster la fonction `useWhatsAppFallback` :
```ts
// Forcer WhatsApp dès que whatsappFallbackEnabled = true (plus de sélecteur)
const autoWhatsApp = country.whatsappFallbackEnabled === true;
const showFallback = false;
const defaultMethod: OtpMethod = autoWhatsApp ? 'whatsapp' : 'sms';
```

Conséquences :
- CI / SN / TG / BJ / ML / BF : envoi WhatsApp direct au clic sur "Recevoir mon code de vérification".
- L'écran intermédiaire "Mode de vérification" disparaît automatiquement (le bloc conditionné par `showFallback` ne s'affiche plus).
- Le code de `handleSignUpSubmit` / `handleSignInSubmit` qui appelle `sendOtpSignUp` directement quand `autoWhatsApp` est vrai s'occupe déjà du reste.

> Conforme à la mémoire projet **WhatsApp-first strategy** : SMS reste utilisable uniquement comme fallback CI/SN si `whatsappFallbackEnabled` est désactivé, ce qui n'est plus le cas par défaut.

### C. Nettoyage

- Retirer du `Auth.tsx` les imports/usages de `useDuplicateAccountDetection` devenus inutiles.
- Garder `DuplicateAccountModal.tsx` pour le seul cas "téléphone/email exact" (haut confiance).
- Mémoire à mettre à jour : la stratégie de détection de doublon ne se base plus sur le prénom (faux positifs).

---

## Fichiers modifiés

- `src/pages/Auth.tsx` — condition de déclenchement de la modale + suppression fallback client
- `supabase/functions/check-existing-account/index.ts` — retrait de la recherche fuzzy par prénom
- `src/components/auth/OtpMethodSelector.tsx` — `autoWhatsApp = whatsappFallbackEnabled`
- (option) `src/hooks/useDuplicateAccountDetection.ts` — supprimer ou simplifier

## Résultat attendu

1. L'utilisateur remplit l'inscription avec un prénom courant + un nouveau numéro → la modale "Un compte similaire existe déjà" **n'apparaît plus**.
2. Au clic sur "Recevoir mon code de vérification" depuis la pré-auth → **OTP WhatsApp envoyé directement**, plus d'écran intermédiaire SMS/WhatsApp.
3. La modale reste affichée uniquement si le numéro (ou l'email) est **exactement** déjà associé à un compte — comportement légitime et attendu.
