1. Stabiliser l’écran d’inscription pré-auth
- Revoir l’intégration de `PreAuthDiscovery` dans `src/pages/Auth.tsx`.
- Supprimer le point fragile introduit par le chargement lazy si nécessaire, ou au minimum remplacer le `Suspense fallback={null}` par un rendu explicite pour éviter l’écran vide.
- Vérifier la cause du rendu blanc observé sur `/auth?tab=signup` et sécuriser le montage du flux pour qu’un chargement incomplet ne laisse jamais une couche vide plein écran.

2. Corriger la régression de clic sur les 3 boutons finaux
- Reprendre la partie "action" dans `src/components/PreAuthDiscovery.tsx`.
- Isoler la confirmation WhatsApp pour qu’elle n’intercepte pas les clics quand elle est fermée.
- Garder le comportement demandé :
  - `Recevoir mon code de vérification` ouvre l’avertissement WhatsApp
  - `S’inscrire avec Google` lance immédiatement le flux Google
  - `Peut-être plus tard` ferme immédiatement le parcours
- Vérifier aussi que `submittingPhone` / `submittingGoogle` ne laissent jamais les boutons bloqués après une tentative annulée ou interrompue.

3. Simplifier la confirmation WhatsApp pour éviter les conflits de couches
- Remplacer si besoin l’`AlertDialog` actuel par une implémentation plus sûre dans ce contexte plein écran (par ex. `Dialog` simple ou carte de confirmation inline).
- Conserver exactement le message produit :
  - Titre d’avertissement WhatsApp
  - Bouton `Recevoir`
- Faire en sorte que seule l’action téléphone passe par cette confirmation, sans impacter Google ni la fermeture.

4. Vérifier le flux OTP côté Auth
- Contrôler l’enchaînement `PreAuthDiscovery -> onSubmitPhoneSignup -> sendOtpSignUp` dans `src/pages/Auth.tsx`.
- Vérifier qu’après confirmation, le parcours ferme bien la découverte et déclenche l’envoi WhatsApp sans réactiver la détection de doublons de façon incorrecte.
- Confirmer que le mode WhatsApp reste l’unique méthode affichée/comportement attendu dans ce flux.

5. Validation fonctionnelle à faire après correction
- Tester sur mobile l’étape finale du parcours pré-auth :
  - clic sur `Recevoir mon code de vérification` -> ouverture de la modale -> clic sur `Recevoir` -> envoi OTP WhatsApp
  - clic sur `S’inscrire avec Google` -> démarrage du flux Google (ou message preview prévu)
  - clic sur `Peut-être plus tard` -> fermeture immédiate
- Revalider qu’aucun écran blanc n’apparaît sur `/auth?tab=signup`.

Détails techniques
- Fichiers principaux : `src/components/PreAuthDiscovery.tsx`, `src/pages/Auth.tsx`
- Indice relevé pendant l’exploration : l’écran `/auth?tab=signup` peut tomber sur un fond vide, et le parcours pré-auth est actuellement lazy-loadé avec un `Suspense fallback={null}`, ce qui augmente le risque d’un écran figé/silencieux en cas de problème de chargement.
- Je traiterai donc la cause visible (les boutons figés) et la cause structurelle probable (montage fragile de l’écran et superposition de modale).