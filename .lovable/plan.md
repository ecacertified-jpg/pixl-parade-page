

# Rendre la Edge Function notify-business-order testable

## Probleme

La fonction `notify-business-order` rejette les appels avec un token utilisateur standard. Elle n'accepte que :
1. Un webhook Supabase avec signature HMAC (`X-Webhook-Signature`)
2. Le `SUPABASE_SERVICE_ROLE_KEY` en Bearer token

L'outil de test Lovable envoie un token utilisateur, qui est bien verifie (lignes 113-125), mais le code ne trouve pas le header `Authorization` tel qu'envoye par l'outil.

## Solution

Modifier la logique d'authentification pour accepter aussi les appels d'utilisateurs connectes. Cela permettra de tester depuis le preview tout en conservant la securite du webhook.

## Modification : `supabase/functions/notify-business-order/index.ts`

### Changement dans le fallback auth (lignes 100-132)

La logique actuelle verifie deja le token utilisateur, mais l'outil de test ne semble pas passer le header. Le correctif est d'accepter aussi l'`apikey` header comme fallback pour l'authentification, car Supabase le passe automatiquement.

```text
Avant (ligne 101):
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) { return 401 }

Apres:
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader) {
    // Tenter avec l'apikey Supabase (appels via supabase.functions.invoke)
    const apiKey = req.headers.get('apikey');
    if (!apiKey) {
      return 401;
    }
    // Si apikey est presente, c'est un appel interne Supabase - parser le body directement
    console.log('Authenticated via apikey header');
  }
```

En realite, le probleme principal est que l'outil curl_edge_functions de Lovable ne transmet pas le token d'authentification lorsque la fonction a `verify_jwt = false` dans config.toml.

## Approche recommandee

Plutot que modifier la securite de la fonction, **ajouter un mode test explicite** :

### Ajouter un parametre `test_mode` protege

```typescript
// Apres la verification webhook (ligne 98), avant le fallback auth
// Accept test calls with valid user auth
const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
if (authHeader) {
  const token = authHeader.replace('Bearer ', '');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (token === serviceRoleKey) {
    console.log('Service role call detected');
  } else {
    const verifyClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await verifyClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Authenticated user call:', user.id);
  }
  
  const payload: OrderPayload = await req.json();
  return await processOrder(payload);
}

// Si aucun header d'auth, rejeter
return new Response(
  JSON.stringify({ error: 'Unauthorized - Authentication required' }),
  { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
);
```

Ce code est fonctionnellement identique a l'actuel, mais le probleme est que l'outil de test ne passe pas du tout le header Authorization.

## Alternative pragmatique

Puisque l'outil de test ne passe pas le token, la meilleure approche est :

1. **Pas de modification de code** - la fonction est correctement securisee
2. **Tester en passant une vraie commande** sur la boutique BABY SNUS depuis le preview
3. **Verifier les logs** apres la commande pour confirmer l'envoi WhatsApp

## Etapes

1. Naviguer vers la boutique BABY SNUS dans le preview
2. Ajouter un produit au panier et passer commande
3. Verifier les logs de `notify-business-order` pour voir le routage et l'envoi du template `joiedevivre_new_order`

## Resultat attendu dans les logs

```text
New order received: [order-id]
Business owner found: 06d3be2d-9b14-4faa-86f8-9c22d4db7698
[Routing] phone=+225070***, smsReliability=reliable, canSendSms=true
[WhatsApp] Sending joiedevivre_new_order template to business
[WhatsApp] Order notification sent: wamid.xxxxx
[SMS] Sending order notification to business
[SMS] Order notification sent: SMxxxxx
Results: push=X/X, whatsapp=true, sms=true
```

