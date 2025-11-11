# Configuration du CRON Job pour les vœux d'anniversaire

## Instructions de configuration

Pour activer l'envoi automatique quotidien de vœux d'anniversaire, vous devez configurer un CRON job dans Supabase.

### Étape 1: Activer les extensions nécessaires

Connectez-vous à votre console Supabase et exécutez ces requêtes SQL dans l'éditeur SQL :

```sql
-- Activer l'extension pg_cron pour planifier des tâches
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Activer l'extension pg_net pour faire des appels HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### Étape 2: Créer le CRON job

Exécutez cette requête pour créer le job quotidien. **Important** : Remplacez les valeurs suivantes :
- `YOUR_PROJECT_URL` : Votre URL Supabase (ex: `https://vaimfeurvzokepqqqrsl.supabase.co`)
- `YOUR_ANON_KEY` : Votre clé publique Supabase (SUPABASE_ANON_KEY)

```sql
SELECT cron.schedule(
  'birthday-wishes-daily-check',
  '1 0 * * *', -- Chaque jour à 00h01 (heure du serveur)
  $$
  SELECT
    net.http_post(
        url:='YOUR_PROJECT_URL/functions/v1/birthday-wishes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

### Exemple complet avec vos valeurs :

```sql
SELECT cron.schedule(
  'birthday-wishes-daily-check',
  '1 0 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-wishes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
```

### Étape 3: Vérifier que le job a été créé

```sql
-- Voir tous les jobs CRON configurés
SELECT * FROM cron.job;
```

Vous devriez voir votre job `birthday-wishes-daily-check` dans la liste.

### Étape 4: Tester le job manuellement (optionnel)

Pour tester immédiatement sans attendre le lendemain :

```sql
SELECT cron.schedule(
  'birthday-wishes-test',
  '* * * * *', -- Toutes les minutes (TEMPORAIRE pour test)
  $$
  SELECT
    net.http_post(
        url:='https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/birthday-wishes',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaW1mZXVydnpva2VwcXFxcnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzgwMjYsImV4cCI6MjA2ODg1NDAyNn0.qX-5TcAzGZ4bk8trpEKbtQql9w0VxvnAvZfMBEkZ504"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Après test, supprimer le job de test :
SELECT cron.unschedule('birthday-wishes-test');
```

## Gestion du job

### Désactiver temporairement le job

```sql
SELECT cron.unschedule('birthday-wishes-daily-check');
```

### Recréer le job

Utilisez la commande de l'étape 2 à nouveau.

### Voir l'historique d'exécution

```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'birthday-wishes-daily-check'
ORDER BY start_time DESC
LIMIT 10;
```

## Comment ça fonctionne ?

1. **Chaque jour à 00h01**, le CRON job appelle l'edge function `birthday-wishes`
2. La fonction vérifie tous les utilisateurs dont c'est l'anniversaire aujourd'hui
3. Pour chaque utilisateur, elle crée une notification spéciale de type `birthday_wish_ai`
4. La notification apparaît dans le dashboard de l'utilisateur avec une carte festive spéciale
5. L'assistant IA détecte automatiquement l'anniversaire et souhaite un joyeux anniversaire lors de la conversation

## Fonctionnalités incluses

✅ Message personnalisé avec le prénom de l'utilisateur  
✅ Notification avec animations festives et confettis  
✅ Bouton pour générer une chanson d'anniversaire (via ElevenLabs)  
✅ Assistant IA qui souhaite automatiquement l'anniversaire lors du chat  
✅ Priorité maximale pour les notifications d'anniversaire  
✅ Vérification pour éviter les doublons (une seule notification par jour)  

## Notes importantes

- Le CRON s'exécute à l'heure UTC par défaut. Ajustez l'horaire si nécessaire pour votre fuseau horaire.
- La génération de musique est optionnelle et utilise des crédits ElevenLabs.
- Les notifications sont automatiquement supprimées après 24h par le système.
