
# Aligner la page BusinessAuth sur la page Auth (client)

## Objectif

Rendre la page d'authentification Business (`/business-auth`) visuellement et fonctionnellement identique a la page client (`/auth`), en suivant la meme structure d'interface.

## Differences actuelles a corriger

| Element | Auth (client) | BusinessAuth (actuel) |
|---------|--------------|----------------------|
| Bouton Google | EN HAUT, avant les formulaires | En bas, apres les formulaires |
| Ordre methodes | Email en premier, Telephone en second | Telephone en premier, Email en second |
| Titre | "Joie de Vivre" | "Business JOIE DE VIVRE" |
| Sous-titre | "Connectez-vous ou creez un compte pour commencer" | "Creez votre compte business ou connectez-vous..." |
| Icone Espace | Store + "Espace Business" | ArrowLeft + "Compte client" |
| Erreur "User already registered" | Geree avec message francais + bascule vers connexion | Erreur brute affichee |

## Modifications prevues

### Fichier : `src/pages/BusinessAuth.tsx`

#### 1. Restructurer le layout du formulaire de connexion (signin)
- Deplacer le bouton Google EN HAUT (avant le separateur "ou")
- Deplacer le separateur "ou" entre Google et les methodes
- Garder le selecteur Email/Telephone en dessous
- Inverser l'ordre : Email en premier, Telephone en second

#### 2. Restructurer le layout du formulaire d'inscription (signup)
- Ajouter le bouton Google EN HAUT (avant le separateur "ou")
- Deplacer le separateur "ou" entre Google et les methodes
- Inverser l'ordre : Email en premier, Telephone en second

#### 3. Mettre a jour les textes
- Titre : "Joie de Vivre" (avec sous-titre "Connectez-vous ou creez un compte pour commencer")
- Garder l'icone Store et le lien "Espace Business" mais affiche comme dans Auth.tsx
- TabsTrigger "Inscription Business" -> "Inscription"

#### 4. Ajouter la gestion gracieuse de l'erreur "User already registered"
Dans la fonction `handleEmailSignUp`, detecter l'erreur et :
- Afficher "Compte existant - Un compte existe deja avec cet email. Veuillez vous connecter."
- Basculer automatiquement vers l'onglet connexion

#### 5. Changer la methode d'auth par defaut
- `authInputMethod` initialise a `'email'` au lieu de `'phone'`

## Detail technique

### Structure cible pour signin (identique a Auth.tsx)
```text
[Bouton Google]
--- ou ---
[Email] [Telephone]  (Email actif par defaut)
[Formulaire email OU telephone]
```

### Structure cible pour signup
```text
[Bouton Google]
--- ou ---
[Email] [Telephone]  (Email actif par defaut)
[Formulaire email OU telephone]
```

### Gestion erreur "User already registered"
```text
if (error.message?.includes('User already registered') || error?.code === 'user_already_exists') {
  toast: "Compte existant" / "Un compte existe deja avec cet email..."
  setAuthMode('signin')
  return
}
```

## Fichier modifie

- `src/pages/BusinessAuth.tsx`
