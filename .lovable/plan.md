

## Test du flux complet de notification prestataire

### Constat apres exploration

Le code de la section 5 dans `intelligent-notifications/index.ts` (lignes 232-368) est correctement implemente. Voici ce que le test doit valider :

### Etape 1 : Creer les donnees de test en base

Inserer via SQL (dans le SQL Editor Supabase) :

1. **Creer une cagnotte de test** avec `status = 'target_reached'` et `updated_at` recent (< 1h) :
```sql
INSERT INTO collective_funds (id, title, target_amount, current_amount, currency, status, occasion, creator_id, is_public, updated_at)
VALUES (
  'aaaaaaaa-test-fund-0001-000000000001',
  'Montre casio pour Françoise TEST',
  15000, 15000, 'XOF', 'target_reached', 'anniversaire',
  'e19c4519-9d98-431c-8772-60ecfcf13c43', -- user ABIDJAN CHIC
  true,
  NOW()
);
```

2. **Lier la cagnotte au commerce ABIDJAN CHIC et au produit Montre casio** :
```sql
INSERT INTO business_collective_funds (fund_id, business_id, product_id, beneficiary_user_id)
VALUES (
  'aaaaaaaa-test-fund-0001-000000000001',
  'a8a39b9f-530b-4cf9-8c78-8ec93e2370de', -- ABIDJAN CHIC
  '7b4dc070-08a6-49f4-ae84-c0e33e65d785', -- Montre casio
  'b3427608-b28e-4265-af53-81d63e8b4598'  -- un user pour le beneficiaire
);
```

### Etape 2 : Invoquer la Edge Function

Appeler `intelligent-notifications` avec le service role key (via curl ou le dashboard Supabase). La fonction va :
1. Detecter la cagnotte `target_reached` (updated_at < 1h)
2. Trouver le lien `business_collective_funds` vers ABIDJAN CHIC
3. Recuperer le telephone du prestataire (`+2250757195733`)
4. Envoyer le template WhatsApp `joiedevivre_fund_ready` avec les params :
   - `{{1}}` = MOUSTAPHA (prenom du proprietaire)
   - `{{2}}` = Montre casio pour Françoise TEST (titre)
   - `{{3}}` = 15000 (montant)
   - `{{4}}` = Montre casio (produit)
   - `{{5}}` = prenom du beneficiaire
   - Bouton CTA : fund_id comme suffixe URL
5. Creer une notification in-app `fund_ready_business` dans `scheduled_notifications`

### Etape 3 : Verifier les resultats

1. **Logs Edge Function** : Verifier dans les logs de `intelligent-notifications` les messages :
   - `Found X business funds linked to completed funds`
   - `WhatsApp to vendor ABIDJAN CHIC: OK ou erreur`
   - `Vendor notification created for ABIDJAN CHIC`

2. **Table `whatsapp_template_logs`** :
```sql
SELECT * FROM whatsapp_template_logs
WHERE template_name = 'joiedevivre_fund_ready'
ORDER BY created_at DESC LIMIT 5;
```

3. **Table `scheduled_notifications`** :
```sql
SELECT * FROM scheduled_notifications
WHERE notification_type = 'fund_ready_business'
ORDER BY created_at DESC LIMIT 5;
```

4. **Dashboard admin** : Verifier que le log apparait dans l'onglet "Notification prestataire" de `/admin/business-fund-wa`

### Etape 4 : Tester la deduplication

Invoquer la fonction une deuxieme fois. La notification ne doit PAS etre recree (log attendu : `Skipping fund ... - notification already sent`).

### Etape 5 : Nettoyage

```sql
DELETE FROM scheduled_notifications WHERE action_data->>'fund_id' = 'aaaaaaaa-test-fund-0001-000000000001';
DELETE FROM business_collective_funds WHERE fund_id = 'aaaaaaaa-test-fund-0001-000000000001';
DELETE FROM collective_funds WHERE id = 'aaaaaaaa-test-fund-0001-000000000001';
```

### Point d'attention : CTA bouton

Le code actuel passe `bf.fund_id` comme parametre de bouton CTA (`/business/orders/{fund_id}`). Or le template Meta attend un **order ID**. Si aucune commande `collective_fund_orders` n'existe encore au moment ou la cagnotte atteint 100%, le lien CTA pointera vers un fund_id, pas un order_id. Deux options :
- **Option A** : Changer le bouton CTA du template Meta pour pointer vers `/f/{fund_id}` (page de la cagnotte) au lieu de `/business/orders/`
- **Option B** : Creer automatiquement la commande dans `collective_fund_orders` avant d'envoyer la notification, et passer l'order_id

Ceci est a decider avant la mise en production.

### Fichiers impliques (aucune modification requise pour le test)

| Fichier | Role |
|---------|------|
| `supabase/functions/intelligent-notifications/index.ts` | Section 5 - logique testee |
| `supabase/functions/_shared/sms-sender.ts` | `sendWhatsAppTemplate` |
| `src/pages/Admin/BusinessFundWhatsAppLogs.tsx` | Dashboard de suivi |

