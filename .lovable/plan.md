
Plan : Corriger l’erreur “Edge Function returned a non-2xx” sur l’invitation par téléphone

1. Diagnostic confirmé
- Les logs `send-invitation` montrent `AuthSessionMissingError` alors que l’en-tête Authorization est présent.
- Cause racine : la fonction utilise `supabaseClient.auth.getUser()` (sans token explicite). En Edge runtime, cela peut échouer car il n’y a pas de session locale.

2. Correctifs dans `supabase/functions/send-invitation/index.ts`
- Lire `Authorization`, vérifier le format `Bearer <token>`, extraire le JWT.
- Remplacer l’authentification par `supabaseClient.auth.getUser(token)` (au lieu de `getUser()`).
- Garder le header Authorization sur le client Supabase pour que l’INSERT reste dans le contexte utilisateur (RLS).
- Retourner des erreurs 401 claires (`Session invalide ou expirée`) quand le token est absent/invalide.
- Ajuster le type de payload : `invitee_email?: string` pour refléter le flux téléphone-only.

3. Correctifs dans `src/components/OnboardingExperience.tsx`
- Utiliser `ensureValidSession()` du `AuthContext` (plus robuste que `getSession()` seul).
- Vérifier `session.access_token` avant l’appel Edge Function.
- Passer explicitement `Authorization: Bearer ${session.access_token}` dans `supabase.functions.invoke(...)`.
- Améliorer l’erreur affichée : tenter de lire le message JSON renvoyé par la fonction au lieu du message générique Supabase.
- Conserver la règle actuelle : succès uniquement si `data?.invitation_id` existe (sinon pas de lien/copie/compteur).

4. Vérification end-to-end
- Étape “Amis” : saisir un numéro valide puis cliquer la flèche.
- Attendu :
  - pas de toast “non-2xx”,
  - toast de succès/partage,
  - lien copiable visible,
  - compteur “+1 ami invité” incrémenté.
- Vérification technique :
  - réponse réseau `functions/v1/send-invitation` en 200,
  - logs Edge avec `Auth status: authenticated`,
  - nouvelle ligne dans `public.invitations` avec `invitee_phone` renseigné.

5. Résultat attendu
- Le flux invitation téléphone fonctionne de façon fiable pour un utilisateur connecté.
- L’utilisateur voit des erreurs explicites uniquement en cas de vraie session invalide.
