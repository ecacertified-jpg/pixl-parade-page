

## Test end-to-end du flux WhatsApp OTP via l'interface /auth

### Objectif
Valider le parcours complet : envoi OTP WhatsApp, saisie dans le formulaire UI, creation de session, et redirection apres connexion.

### Etapes

1. **Envoyer un nouveau code OTP**
   - Appeler l'Edge Function `send-whatsapp-otp` avec le numero `+2250707467445`
   - Confirmer l'envoi reussi

2. **Recevoir le code de l'utilisateur**
   - Attendre que l'utilisateur communique le code recu sur WhatsApp

3. **Saisir le code dans l'interface /auth**
   - Naviguer vers `/auth`
   - Selectionner l'onglet "Telephone"
   - Entrer le numero `0707467445`
   - Cliquer "Envoyer le code" puis "WhatsApp (recommande)"
   - Saisir le code OTP dans le formulaire a 6 chiffres
   - Soumettre le formulaire

4. **Verifier le resultat**
   - Confirmer que la session est creee (access_token + refresh_token)
   - Verifier la redirection vers le dashboard ou la page d'accueil
   - Verifier les logs console pour toute erreur

### Details techniques

- Edge Function : `send-whatsapp-otp` (envoi) et `verify-whatsapp-otp` (verification)
- Recherche utilisateur via la table `profiles` (methode fiabilisee)
- Creation de session via `generateLink({ type: 'magiclink' })` + `verifyOtp({ type: 'magiclink' })`
- Email fictif au format `${phone}@phone.joiedevivre.app`
- Le test valide toute la chaine : UI -> Edge Function -> Auth -> Session -> Redirection

### Risque identifie
- Cliquer "WhatsApp (recommande)" dans l'UI declenche un nouvel OTP, invalidant le precedent
- Solution : enchainer rapidement ou verifier que le formulaire OTP reste affiche apres l'envoi

