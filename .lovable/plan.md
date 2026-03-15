

# Plan : Augmenter le timeout de vérification OTP (Auth + BusinessAuth)

## Problème

Le timeout de 8 secondes dans `Auth.tsx` et `BusinessAuth.tsx` se déclenche pendant la vérification OTP WhatsApp. L'edge function `verify-whatsapp-otp` effectue plusieurs opérations séquentielles (lookup OTP, recherche utilisateur, génération magiclink, création session) qui dépassent facilement 8s sur les réseaux mobiles africains.

C'est exactement le même problème déjà corrigé dans `AdminAuth.tsx`.

## Corrections

### 1. `src/pages/BusinessAuth.tsx` (ligne 347)
- Augmenter le timeout de **8s à 20s** (plus long que AdminAuth car l'edge function OTP fait plus d'opérations)
- Le reste du code reste inchangé

### 2. `src/pages/Auth.tsx` (ligne 185)
- Même correction : timeout de **8s à 20s**

## Impact
Deux lignes modifiées (une par fichier). Aucun autre changement nécessaire — la logique de vérification OTP elle-même fonctionne correctement.

