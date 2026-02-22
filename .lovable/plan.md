

## Saisie immediate du code OTP 726889 dans le formulaire /auth

### Etape 1 : Verifier le code via Edge Function
- Appeler `verify-whatsapp-otp` avec `phone: +2250707467445` et `code: 726889` pour confirmer qu'il est encore valide

### Etape 2 : Saisir le code dans l'interface
- Le formulaire OTP devrait deja etre visible dans le navigateur (suite au clic "WhatsApp" precedent)
- Saisir `726889` dans les 6 champs du formulaire OTP via le navigateur
- Soumettre le formulaire

### Etape 3 : Verifier la redirection
- Confirmer la creation de session (access_token, refresh_token)
- Verifier la redirection vers le dashboard ou la page d'accueil
- Verifier les logs console pour toute erreur

### Note importante
- Si le formulaire OTP n'est plus visible, il faudra re-naviguer vers `/auth`, re-entrer le numero et re-selectionner WhatsApp, ce qui enverra un NOUVEAU code et invalidera `726889`
- Dans ce cas, il faudra un nouveau code de l'utilisateur

### Details techniques
- Edge Function : `verify-whatsapp-otp`
- Utilisateur existant : `b8d0d4e4-3eec-45df-a87d-b9ec7e4bf95a`
- Session via `generateLink({ type: 'magiclink' })` + `verifyOtp({ type: 'magiclink' })`

