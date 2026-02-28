

## Envoyer WhatsApp joiedevivre_fund_ready au prestataire quand la cagnotte est pleine

### Contexte

Actuellement, la notification WhatsApp `joiedevivre_fund_ready` au prestataire est envoyee uniquement via le cron `intelligent-notifications` (qui tourne toutes les heures et cherche les cagnottes recemment completees). Ce delai n'est pas optimal -- le prestataire devrait etre notifie immediatement quand la cagnotte atteint 100%.

Il existe deja un trigger DB `notify_on_target_reached` qui se declenche instantanement quand `current_amount >= target_amount`, mais il ne notifie que le createur et les contributeurs (in-app/push). Il ne contacte pas le prestataire business.

### Solution

Creer une Edge Function dediee `notify-fund-ready` qui envoie le WhatsApp au prestataire, et l'appeler depuis le trigger DB via `pg_net.http_post` (meme pattern que `notify-business-order`).

### Fichiers a creer/modifier

**1. `supabase/functions/notify-fund-ready/index.ts`** (nouveau)

Edge Function qui :
- Recoit le `fund_id` en body
- Verifie que le fund a le statut `target_reached` ou `current_amount >= target_amount`
- Cherche le `business_collective_funds` lie a ce fund
- Si c'est un fund business : recupere le prestataire (phone, nom), le produit, le beneficiaire
- Deduplique via `scheduled_notifications` (meme logique que dans `intelligent-notifications`)
- Envoie `joiedevivre_fund_ready` via `sendWhatsAppTemplate` avec les 5 parametres : prenom prestataire, titre cagnotte, montant, nom produit, nom beneficiaire
- Cree une notification in-app `fund_ready_business` pour le prestataire
- Logue le resultat

La logique est extraite directement de la section 5 de `intelligent-notifications` (lignes 232-368) pour reutiliser exactement le meme code.

**2. Migration SQL** (nouveau)

Modifier le trigger `notify_on_target_reached` pour ajouter un appel `net.http_post` vers la nouvelle Edge Function `notify-fund-ready` quand l'objectif est atteint. Pattern identique a `notify_business_on_new_order` :

```text
PERFORM net.http_post(
  url := '.../functions/v1/notify-fund-ready',
  body := jsonb_build_object('fund_id', NEW.id),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer <service_role_key>'
  )
);
```

Le trigger existant continue de notifier createur + contributeurs. Le nouvel appel notifie le prestataire en plus.

### Detail technique

Parametres du template `joiedevivre_fund_ready` (confirme par le screenshot Meta) :
1. Prenom du prestataire (ex: "Alain")
2. Titre/nom du beneficiaire dans la cagnotte (ex: "Francoise")
3. Montant objectif (ex: "30000")
4. Nom du produit (ex: "Collier en or")
5. Nom du beneficiaire (ex: "Francoise")

Bouton CTA dynamique : `/business/orders/{{fund_id}}`

### Deduplication

- Avant d'envoyer, la fonction verifie si une notification `fund_ready_business` existe deja pour ce `fund_id` dans `scheduled_notifications`
- Cela empeche les doublons si le cron `intelligent-notifications` passe aussi dans l'heure

### Impact

- Le prestataire recoit son WhatsApp immediatement apres que la cagnotte atteint 100%
- Le cron existant dans `intelligent-notifications` reste comme filet de securite (deduplication integree)
- Aucun changement cote frontend

