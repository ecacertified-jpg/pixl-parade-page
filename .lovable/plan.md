

## Saisie du code OTP 281408 dans le formulaire /auth

### Etape 1 : Saisir le code dans le formulaire OTP
- Le formulaire OTP devrait etre visible dans le navigateur suite au dernier envoi WhatsApp
- Saisir `281408` dans les 6 champs du formulaire via les outils navigateur
- Soumettre le formulaire

### Etape 2 : Verifier le resultat
- Confirmer la creation de session (access_token, refresh_token)
- Verifier la redirection vers le dashboard ou la page d'accueil
- Verifier les logs console pour toute erreur

### Note
- Si le formulaire n'est plus visible, il faudra d'abord verifier via l'Edge Function `verify-whatsapp-otp` puis re-initier le flux UI (ce qui enverra un nouveau code)

