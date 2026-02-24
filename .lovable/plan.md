
# Correction de la colonne 'data' dans notify-business-order

## Probleme

L'Edge Function `notify-business-order` utilise `data` comme nom de colonne lors de l'insertion dans la table `notifications`, mais cette colonne n'existe pas. Le bon nom est `metadata`.

Erreur dans les logs :
```
Could not find the 'data' column of 'notifications' in the schema cache
```

## Solution

Modifier une seule ligne dans `supabase/functions/notify-business-order/index.ts` (ligne 469) :

- Remplacer `data:` par `metadata:` dans la fonction `createInAppNotification`

## Detail technique

Fichier : `supabase/functions/notify-business-order/index.ts`

Avant :
```typescript
data: {
  order_id: order.id,
  ...
},
```

Apres :
```typescript
metadata: {
  order_id: order.id,
  ...
},
```

## Verification

Les deux autres Edge Functions (`handle-order-action` et `notify-order-confirmation`) utilisent deja le bon nom de colonne `metadata`. Seul `notify-business-order` est affecte.

Apres deploiement, passer une commande test pour confirmer que le log `"In-app notification created"` apparait sans erreur.
