
Plan : Corriger définitivement l’erreur “l’invitation n’a pas pu être envoyée” pour les numéros de téléphone

1) Constat confirmé
- La base est maintenant correcte :
  - `invitations.invitee_email` est nullable.
  - Les politiques RLS `SELECT/INSERT/UPDATE/DELETE` existent sur `invitations`.
- Pourtant l’erreur persiste côté UI.
- Indice clé : aucune trace d’exécution récente de `send-invitation` dans les logs Edge, ce qui suggère un blocage avant l’exécution du code (préflight CORS/JWT gateway), pas un bug SQL/RLS interne à la fonction.

2) Correctifs à implémenter
- Fichier : `supabase/functions/send-invitation/index.ts`
  - Uniformiser les headers CORS au format étendu déjà utilisé dans d’autres fonctions :
    - inclure `x-supabase-client-platform`, `x-supabase-client-platform-version`, `x-supabase-client-runtime`, `x-supabase-client-runtime-version`
    - ajouter `Access-Control-Allow-Methods: POST, OPTIONS`
  - Garder la réponse `OPTIONS` explicite avec ces headers.
  - Ajouter des logs de diagnostic minimaux (méthode HTTP, présence auth header, statut de `auth.getUser`) pour distinguer clairement :
    - blocage auth
    - blocage CORS
    - erreur insert DB
- Fichier : `src/components/OnboardingExperience.tsx`
  - Renforcer `handleInvite` :
    - vérifier session valide avant `supabase.functions.invoke`
    - afficher un message d’erreur contextualisé selon `error.message` (au lieu du message générique unique)
    - ne considérer succès que si `error === null` ET `data?.invitation_id` présent
    - conserver le lien copiable uniquement en cas de succès réel

3) Résultat attendu
- Un numéro téléphone valide déclenche bien l’insertion `invitations` et renvoie `invitation_id`.
- L’utilisateur voit le lien copiable et n’a plus le toast d’échec injustifié.
- En cas d’échec réel, le message devient explicite (session expirée, accès refusé, validation, etc.).

4) Vérification de bout en bout (obligatoire)
- Tester depuis l’onboarding étape “Amis” :
  - saisir un numéro valide
  - cliquer la flèche d’envoi
  - vérifier :
    - toast de succès
    - affichage du lien copiable
    - incrément du compteur d’invités
- Contrôle technique :
  - requête réseau vers `functions/v1/send-invitation` en 200
  - présence d’entrées dans les logs de la fonction
  - nouvelle ligne dans `public.invitations` avec `invitee_phone` renseigné.
