

## Afficher le résumé des notifications sur la page de confirmation

### Objectif

Après la création d'une cagnotte collective, afficher sur la page de confirmation combien de notifications WhatsApp et in-app ont été envoyées aux amis du bénéficiaire.

### Modifications

**1. `src/pages/CollectiveCheckout.tsx`** -- Capturer la réponse de l'Edge Function

- Récupérer le `data` retourné par `supabase.functions.invoke('notify-business-fund-friends', ...)` qui contient `{ notified_count, whatsapp_sent, contacts_whatsapp_sent }`
- Stocker ces stats dans une variable locale `notificationStats`
- Passer `notificationStats` dans le `navigate("/collective-order-confirmation", { state: { ..., notificationStats } })`

**2. `src/pages/CollectiveOrderConfirmation.tsx`** -- Afficher le résumé

- Étendre l'interface `ConfirmationState` avec un champ optionnel `notificationStats`
- Ajouter une carte entre le résumé de commande et les boutons d'action :
  - Icône MessageSquare (WhatsApp) avec le nombre total de messages envoyés
  - Icône Bell (in-app) avec le nombre de notifications in-app
  - Texte explicatif : "Les amis de [bénéficiaire] ont été notifiés"
- N'afficher cette section que si `notificationStats` existe (compatibilité arrière)

### Rendu visuel attendu

```text
[Carte commande existante]

--- Notifications envoyées ---
  📱 8 WhatsApp envoyés
  🔔 3 notifications in-app
  Les amis de Françoise ont été prévenus !

[Boutons existants]
```

### Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `src/pages/CollectiveCheckout.tsx` | Capturer la réponse de l'Edge Function et la passer au state de navigation |
| `src/pages/CollectiveOrderConfirmation.tsx` | Ajouter l'interface `notificationStats` et la carte de résumé |

