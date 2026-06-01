## Problème

Lorsqu'un utilisateur envoie un message dans le chat IA, la fonction edge `ai-chat-assistant` renvoie une erreur 500 « Erreur de base de données » (code DB). Test direct :

```
POST /ai-chat-assistant → 500 {"error":"Erreur de base de données","code":"DB"}
```

## Cause identifiée

Les tables `public.ai_conversations` et `public.ai_messages` n'ont **aucun GRANT** pour les rôles `anon`, `authenticated` ou `service_role` (vérifié via `information_schema.role_table_grants`). Les politiques RLS existent et sont correctes, mais sans GRANT, PostgREST/Supabase refuse toute opération → l'INSERT dans `ai_conversations` échoue, ce qui déclenche la réponse d'erreur générique côté front (le toast rouge « Une erreur est survenue »).

Les autres champs/colonnes/policies sont OK :
- RLS autorise `anon` à insérer (`user_id IS NULL AND session_id IS NOT NULL`)
- RLS autorise `authenticated` à gérer ses propres conversations
- Le code edge envoie bien `session_id` + `user_id`

C'est uniquement la couche de privilèges SQL qui bloque.

## Correctif

Créer une nouvelle migration ajoutant les GRANTs manquants :

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT SELECT, INSERT ON public.ai_conversations TO anon;
GRANT ALL ON public.ai_conversations TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.ai_messages TO authenticated;
GRANT SELECT, INSERT ON public.ai_messages TO anon;
GRANT ALL ON public.ai_messages TO service_role;
```

(Les politiques RLS existantes restent en place et continuent de scoper l'accès par `user_id`/`session_id`.)

## Validation

1. Re-tester l'edge function via curl → doit renvoyer un stream SSE et non plus 500.
2. Envoyer un message depuis l'UI (connecté + déconnecté) → réponse de l'assistant affichée sans toast d'erreur.

Aucune modification de code applicatif (front, edge function) n'est nécessaire.
