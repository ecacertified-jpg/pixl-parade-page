

# Correction du trigger notify-business-order

## Problemes identifies

Deux problemes empechent l'envoi de notifications WhatsApp/SMS aux prestataires apres une commande :

### Probleme 1 : Extension HTTP manquante
Le trigger PL/pgSQL `notify_business_on_new_order` appelle `extensions.http_post()`, mais l'extension `http` n'est pas installee. Le log PostgreSQL confirme :
```
WARNING: Error calling notify-business-order: function extensions.http_post(url => text, body => text, headers => text) does not exist
```

### Probleme 2 : Mauvais token d'authentification
Le trigger utilise l'`anon_key` comme Bearer token, mais la Edge Function verifie si le token est le `SUPABASE_SERVICE_ROLE_KEY`. L'anon key echoue a la verification utilisateur car ce n'est pas un JWT utilisateur valide.

## Solution

Remplacer `extensions.http_post()` par `net.http_collect()` de l'extension `pg_net` (deja disponible sur Supabase) et utiliser le `service_role_key` comme token d'authentification. Alternativement, utiliser le **Database Webhook natif de Supabase** qui est la methode recommandee.

### Approche choisie : Database Webhook via `pg_net`

L'extension `pg_net` est pre-installee sur tous les projets Supabase et permet des appels HTTP asynchrones depuis les triggers.

## Etapes techniques

### Etape 1 : Migration SQL

Remplacer la fonction trigger `notify_business_on_new_order` pour utiliser `net.http_collect()` :

```sql
CREATE OR REPLACE FUNCTION notify_business_on_new_order()
RETURNS TRIGGER AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/notify-business-order',
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'business_orders',
      'record', jsonb_build_object(
        'id', NEW.id,
        'business_account_id', NEW.business_account_id,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'status', NEW.status,
        'created_at', NEW.created_at,
        'order_summary', NEW.order_summary,
        'delivery_address', NEW.delivery_address,
        'beneficiary_phone', NEW.beneficiary_phone,
        'donor_phone', NEW.donor_phone,
        'customer_id', NEW.customer_id
      )
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer SERVICE_ROLE_KEY_HERE'
    )
  ) INTO request_id;

  RAISE LOG 'notify-business-order HTTP request queued: %', request_id;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error calling notify-business-order: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note importante** : Le `service_role_key` doit etre utilise dans le trigger. Comme il ne peut pas etre stocke en variable d'environnement PL/pgSQL, il sera place directement dans la fonction (cette fonction est `SECURITY DEFINER` et n'est pas accessible aux utilisateurs).

### Etape 2 : Ajouter `customer_id` au payload

La fonction trigger actuelle ne transmet pas le `customer_id`, ce qui empeche la Edge Function de recuperer le nom du client pour le template WhatsApp. L'ajout de `'customer_id', NEW.customer_id` dans le payload corrige ce probleme.

### Etape 3 : Verification

Apres la migration :
1. Passer une nouvelle commande test sur BABY SNUS
2. Verifier les logs de `notify-business-order` pour confirmer :
   - Reception du payload avec les bonnes donnees
   - Envoi du template WhatsApp `joiedevivre_new_order`
   - Envoi du SMS (pour le prefixe +225)

## Resultat attendu dans les logs apres correction

```
[notify-business-order] New order received: [order-id]
Business owner found: 06d3be2d-9b14-4faa-86f8-9c22d4db7698
[Routing] phone=+225***, smsReliability=reliable, canSendSms=true
[WhatsApp] Sending joiedevivre_new_order template to business
[WhatsApp] Order notification sent: wamid.xxxxx
[SMS] Sending order notification to business
[SMS] Order notification sent: SMxxxxx
Results: push=X/X, whatsapp=true, sms=true
```

## Impact

- Zero interruption de service (la commande est toujours creee, seule la notification est corrigee)
- Le prestataire BABY SNUS recevra desormais une notification WhatsApp + SMS a chaque nouvelle commande
- Tous les autres prestataires beneficieront aussi de cette correction

