

# Indicateurs de progression sur tous les formulaires d'inscription

## Constat actuel

- **BusinessAuth.tsx** : Dispose deja d'un `SignupProgressIndicator` avec barre de progression et etapes (Identite, Business, Contact, Validation) -- aucun changement necessaire
- **Auth.tsx (inscription client)** : Aucun indicateur de progression sur les formulaires d'inscription (telephone et email)
- **CompleteProfileModal.tsx** : Aucun indicateur de progression pour les 3 champs obligatoires (anniversaire, ville, telephone)
- **OnboardingModal.tsx** : Des points indicateurs existent deja pour les 3 slides -- aucun changement necessaire

## Modifications prevues

### 1. Ajouter un indicateur de progression sur Auth.tsx (inscription client)

Creer un composant `ClientSignupProgressIndicator` directement dans Auth.tsx (meme pattern que BusinessAuth) qui affiche :

**Pour l'inscription par telephone** :
- Barre de progression dynamique basee sur les champs remplis
- 4 etapes visuelles : Identite (prenom) > Anniversaire > Localisation > Telephone
- Pourcentage affiche en temps reel
- Checkmarks verts pour les etapes completees

**Pour l'inscription par email** :
- Meme barre de progression
- 4 etapes : Identite (prenom) > Anniversaire/Localisation > Email > Mot de passe
- Meme style visuel

Le composant sera place juste au-dessus du formulaire d'inscription, dans les deux variantes (phone et email).

### 2. Ajouter un indicateur de progression sur CompleteProfileModal.tsx

Ajouter un mini-indicateur dans le modal de completion de profil :
- 3 etapes : Anniversaire > Localisation > Telephone
- Barre de progression et checkmarks, meme design que les autres formulaires
- Se met a jour en temps reel quand l'utilisateur remplit chaque champ

## Design

Le composant reutilise le meme style que celui deja present dans BusinessAuth :
- Fond `bg-secondary/30 rounded-xl` avec padding
- Barre `Progress` avec couleur verte a 100%
- Ligne d'etapes avec icones Check (vert) ou cercles gris
- Label dynamique qui change selon la progression ("Commencez", "Presque termine !", "Pret !")

## Fichiers impactes

- **Modifie** : `src/pages/Auth.tsx` -- ajout du composant de progression dans les formulaires d'inscription (phone + email)
- **Modifie** : `src/components/CompleteProfileModal.tsx` -- ajout d'un indicateur de progression pour les 3 champs

## Aucun fichier nouveau necessaire

Les composants sont definis inline dans leurs fichiers respectifs, suivant le pattern deja etabli dans BusinessAuth.tsx.

