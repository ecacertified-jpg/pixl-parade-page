

# Plan : Corriger la vérification OTP copié-collé depuis WhatsApp

## Problème

Quand l'utilisateur copie-colle un code OTP depuis WhatsApp, la vérification échoue avec "Code invalide". Deux causes probables :

1. **Caractères invisibles dans le presse-papier** : WhatsApp peut ajouter des espaces, zero-width spaces, ou retours à la ligne lors du copier-coller. Le composant `InputOTP` filtre les caractères visuels mais certains caractères Unicode invisibles peuvent passer.

2. **Pas de sanitisation côté client ni serveur** : Le code OTP est envoyé tel quel (`data.otp` / `otpValue`) sans `.trim()` ni suppression des non-chiffres. Côté edge function, la regex `^\d{6}$` rejette les codes avec caractères parasites, retournant "Le code doit contenir 6 chiffres" — ou si les caractères passent la regex, le code ne matche pas avec celui en base.

## Solution

Ajouter une sanitisation `trim().replace(/\D/g, '')` à 3 niveaux :

### 1. Client — Auth.tsx (connexion + inscription)
Sanitiser `data.otp` avant envoi dans `verifyOtp()` :
```typescript
const cleanCode = data.otp.trim().replace(/\D/g, '');
// puis utiliser cleanCode au lieu de data.otp
```

### 2. Client — BusinessAuth.tsx (espace business)
Même sanitisation sur `otpValue` dans `verifyOtp()` :
```typescript
const cleanCode = otpValue.trim().replace(/\D/g, '');
```

### 3. Serveur — Edge Function `verify-whatsapp-otp`
Sanitiser `code` à la réception avant toute validation :
```typescript
const cleanCode = code.trim().replace(/\D/g, '');
// Utiliser cleanCode pour la validation et la comparaison
```

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/pages/Auth.tsx` | Sanitiser `data.otp` dans `verifyOtp()` |
| `src/pages/BusinessAuth.tsx` | Sanitiser `otpValue` dans `verifyOtp()` |
| `supabase/functions/verify-whatsapp-otp/index.ts` | Sanitiser `code` à la réception (défense en profondeur) |

