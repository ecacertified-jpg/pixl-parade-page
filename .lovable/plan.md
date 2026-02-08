

# Ajouter l'authentification par Email/Mot de passe

## Probleme identifie

Actuellement, l'application propose uniquement 2 methodes de connexion :
1. **Telephone (SMS/WhatsApp OTP)** - necessite un numero de telephone
2. **Google OAuth** - necessite un compte Google et un navigateur compatible

Certains utilisateurs n'ont ni numero de telephone, ni compte Google (ou utilisent des navigateurs sans integration Google). Ils ne peuvent donc pas acceder a JDV.

## Solution proposee

Ajouter l'**authentification par email et mot de passe** comme 3e methode de connexion, disponible pour les clients (`Auth.tsx`) et les prestataires (`BusinessAuth.tsx`).

## Plan d'implementation

### Etape 1 : Modifier les schemas de validation (Auth.tsx)

Ajouter de nouveaux schemas Zod pour l'authentification email :

- `emailSignInSchema` : email + mot de passe
- `emailSignUpSchema` : prenom, date anniversaire, ville, email, mot de passe, confirmation mot de passe

### Etape 2 : Ajouter les fonctions email dans Auth.tsx

- `handleEmailSignUp` : appelle `supabase.auth.signUp()` avec email/password et `user_metadata` (first_name, birthday, city)
- `handleEmailSignIn` : appelle `supabase.auth.signInWithPassword()` avec email/password
- `handleForgotPassword` : appelle `supabase.auth.resetPasswordForEmail()` pour la recuperation du mot de passe
- Ajouter un etat `authMethod` ('phone' | 'email') pour basculer entre les deux modes

### Etape 3 : Modifier l'interface Auth.tsx

Ajouter un selecteur de methode en haut du formulaire (Telephone / Email) :

```text
+----------------------------------+
|  [Telephone]  [Email]            |  <-- Selecteur de methode
+----------------------------------+
|  Formulaire selon la methode     |
+----------------------------------+
|          --- ou ---              |
|  [Continuer avec Google]         |
+----------------------------------+
```

Pour le mode Email :
- **Connexion** : champs email + mot de passe + lien "Mot de passe oublie"
- **Inscription** : champs prenom, anniversaire, ville, email, mot de passe, confirmation

### Etape 4 : Appliquer les memes modifications a BusinessAuth.tsx

Reproduire la logique email/mot de passe pour les prestataires :
- Schema de validation avec champs business supplementaires
- Fonctions signUp/signIn par email
- Interface avec selecteur de methode

### Etape 5 : Page de reinitialisation du mot de passe

Creer une page `/reset-password` pour permettre aux utilisateurs de definir un nouveau mot de passe apres avoir clique sur le lien de reinitialisation recu par email.

### Etape 6 : Mettre a jour la detection de methodes dans useAccountLinking

Modifier `fetchAuthMethods` pour detecter correctement les utilisateurs connectes par email/mot de passe (distinctement de Google).

## Fichiers concernes

- `src/pages/Auth.tsx` - Ajout methode email
- `src/pages/BusinessAuth.tsx` - Ajout methode email
- `src/pages/ResetPassword.tsx` - Nouvelle page
- `src/App.tsx` - Ajout route `/reset-password`
- `src/hooks/useAccountLinking.ts` - Detection email auth

## Considerations

- Supabase Auth supporte nativement email/password, pas besoin de migration SQL
- La confirmation par email sera geree par Supabase (email de verification automatique)
- Le trigger `handle_new_user` existant creera automatiquement le profil
- Les utilisateurs pourront ensuite lier un telephone ou Google via la page Account Linking existante

