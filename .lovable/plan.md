
## Dedupliquer les friend IDs dans notify-business-fund-friends

### Probleme

La requete `contact_relationships` peut retourner le meme ami plusieurs fois (ex: `b8d0d4e4` apparait 2 fois dans les logs). Cela cause des notifications WhatsApp et in-app en double.

### Correction

**Fichier** : `supabase/functions/notify-business-fund-friends/index.ts` (lignes 70-73)

Remplacer l'extraction des friend IDs par une version dedupliquee avec un `Set` :

```ts
// Extract friend IDs and deduplicate
const friendIds = [...new Set(
  (friendships || []).map(f => 
    f.user_a === beneficiary_user_id ? f.user_b : f.user_a
  )
)];
```

### Impact

- Corrige les notifications WhatsApp en double pour les amis
- Corrige les notifications in-app en double
- Corrige les scheduled_notifications en double
- Aucun changement cote client, uniquement l'Edge Function
