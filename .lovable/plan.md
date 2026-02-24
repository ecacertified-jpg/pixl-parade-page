

# Augmenter le delai de renvoi OTP a 5 minutes

## Constat

- **Auth.tsx** (page client) : le countdown est fixe a **60 secondes** partout (4 occurrences de `setCountdown(60)`).
- **BusinessAuth.tsx** (page business) : le countdown est a **120 secondes** (3 occurrences de `setCountdown(120)`).
- L'utilisateur souhaite uniformiser a **300 secondes (5 minutes)** pour laisser plus de temps avant de proposer le renvoi de code, alignant le comportement avec la duree de validite des codes WhatsApp OTP.

## Modifications

### 1. `src/pages/Auth.tsx`

Remplacer les 4 occurrences de `setCountdown(60)` par `setCountdown(300)` :
- Ligne 341 : apres envoi SMS OTP (signin)
- Ligne 385 : apres envoi WhatsApp OTP (signin)
- Ligne 639 : apres envoi OTP signup
- Ligne 810 : apres renvoi de code (resend)

### 2. `src/pages/BusinessAuth.tsx`

Remplacer les 3 occurrences de `setCountdown(120)` par `setCountdown(300)` :
- Ligne 626 : apres envoi SMS OTP
- Ligne 665 : apres envoi WhatsApp OTP
- Ligne 994 : apres renvoi de code (resend)

### 3. Affichage du timer

Le countdown affiche deja les secondes en format `XXs`. Avec 300 secondes, il affichera `300s`, `299s`, etc. Pour une meilleure lisibilite, convertir l'affichage en minutes:secondes (`4:59`, `4:58`...) dans les deux fichiers. Exemple : `Renvoyer dans 4:32` au lieu de `Renvoyer dans 272s`.

## Impact

- Aucune modification backend necessaire (les codes OTP Supabase et WhatsApp restent valides bien au-dela de 5 minutes).
- Zero risque de regression : seul le timer d'attente cote UI change.

