
Plan : Corriger la confusion du compteur dans l’étape "Amis"

Constat
- Le backend est déjà correct : le token passe à `completed` uniquement quand l’invité remplit réellement le formulaire et que le contact est bien enregistré.
- La confusion vient surtout de l’UI de l’onboarding :
  1. le libellé actuel parle d’"amis invités", ce qui laisse croire qu’un simple partage incrémente le compteur ;
  2. le compteur démarre visuellement à `0`, puis se met à jour après lecture de la base, ce qui peut donner l’impression que le partage vient d’ajouter 1.

Ce que je vais ajuster
1. Dans `src/components/OnboardingExperience.tsx`, charger le vrai compteur dès l’ouverture de l’étape "Amis" et afficher un petit état de chargement avant d’afficher `0/3`.
2. Garder le compteur branché uniquement sur `friend_form_tokens.status = 'completed'` (source de vérité réelle).
3. Renommer le texte pour enlever l’ambiguïté :
   - au lieu de `X/3 amis invités`
   - afficher `X/3 amis ajoutés` ou `X/3 formulaires complétés`
4. Ajouter un message explicatif sous la barre :
   - "Le compteur augmente uniquement quand ton proche remplit et envoie le formulaire."
5. Vérifier que les actions de partage (`WhatsApp`, `Copier`, `SMS`) n’écrivent jamais dans le compteur local et n’affichent qu’un toast de type :
   - "Lien partagé. En attente de la réponse de ton proche..."

Fichier concerné
- `src/components/OnboardingExperience.tsx`

Détails techniques
- Ajouter un état du type `isLoadingCompletedForms`
- Faire le premier fetch immédiatement à l’entrée sur l’étape 4
- Ne rendre le score/progress qu’après ce premier fetch pour éviter le faux effet `0 → 1`
- Conserver la logique d’auto-redirection seulement quand le count réel en base atteint 3
- Aucun changement de base de données ni Edge Function nécessaire

Résultat attendu
- Partager un lien ne fera plus penser qu’un ami a été ajouté
- Le compteur n’évoluera visuellement que lorsqu’un invité aura réellement rempli et envoyé le formulaire
- L’étape sera beaucoup plus claire et rassurante pour l’utilisateur
