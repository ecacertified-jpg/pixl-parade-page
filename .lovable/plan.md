

## Notifier le prestataire par WhatsApp quand une cagnotte business atteint son objectif

### Contexte

Aujourd'hui, quand une cagnotte liee a un produit business atteint 100% (`status = 'target_reached'`), seuls les contributeurs recoivent une notification in-app. Le prestataire (vendeur) n'est pas notifie, ce qui retarde la livraison du cadeau.

### Template Meta a creer manuellement

**Nom** : `joiedevivre_fund_ready`
**Categorie** : Transactional (Utility)
**Langue** : fr
**Corps** :
```
Bonjour {{1}} ! 🎁

La cagnotte pour "{{2}}" a atteint son objectif de {{3}} XOF !

Produit a preparer : {{4}}
Beneficiaire : {{5}}

Merci de preparer la commande.
```
**Bouton CTA** : "Voir la commande" -> URL base + `/business/orders/{{1}}`

> Ce template doit etre cree et approuve dans Meta Business Manager avant que le code fonctionne. En attendant l'approbation, le systeme enverra uniquement la notification in-app.

### Modification technique

**Fichier** : `supabase/functions/intelligent-notifications/index.ts`

Ajouter une **section 5** apres la section "CELEBRATION COLLECTIVE" (ligne 228) qui :

1. Requete les cagnottes `target_reached` de la derniere heure qui ont un `business_product_id` non null (via jointure `business_collective_funds`)
2. Pour chaque cagnotte trouvee :
   - Recupere le produit (`products`) et le compte business (`business_accounts`) avec le telephone du prestataire
   - Recupere le nom du beneficiaire depuis `profiles` ou `contacts`
   - Envoie le template WhatsApp `joiedevivre_fund_ready` au prestataire avec les parametres : prenom prestataire, titre cagnotte, montant, nom produit, nom beneficiaire
   - Cree aussi une notification in-app (`scheduled_notifications`) pour le prestataire
   - Log l'envoi dans `whatsapp_template_logs` (deja gere automatiquement par `sendWhatsAppTemplate`)
3. Ajoute un import de `sendWhatsAppTemplate` depuis `../_shared/sms-sender.ts`

### Flux de donnees

```text
collective_funds (status=target_reached, updated_at < 1h)
  |
  +-> business_collective_funds (lien fund_id -> business_id, product_id)
  |     |
  |     +-> business_accounts (phone du prestataire)
  |     +-> products (nom du produit)
  |
  +-> beneficiary: profiles ou contacts (nom du beneficiaire)
  |
  +---> sendWhatsAppTemplate('joiedevivre_fund_ready', ...)
  +---> scheduled_notifications (in-app pour le prestataire)
```

### Code ajoute (resume)

```typescript
// 5. NOTIFICATION PRESTATAIRE - Cagnotte business a 100%
const { data: businessFunds } = await supabase
  .from('business_collective_funds')
  .select('fund_id, business_id, product_id, beneficiary_user_id')
  .in('fund_id', completedFundIds);

for (const bf of businessFunds) {
  // Recuperer business phone, product name, beneficiary name
  // sendWhatsAppTemplate(businessPhone, 'joiedevivre_fund_ready', 'fr', [...])
  // Insert scheduled_notification for business owner
}
```

### Garde-fous

- Deduplication : verifier qu'une notification `fund_ready_business` n'existe pas deja pour ce `fund_id` dans `scheduled_notifications` avant d'en creer une nouvelle
- Fallback : si le template WhatsApp echoue (non approuve ou erreur), la notification in-app est quand meme creee
- Le prestataire recoit 1 seule notification par cagnotte, jamais de doublon

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/intelligent-notifications/index.ts` | Ajouter import `sendWhatsAppTemplate`, section 5 pour notifier le prestataire quand une cagnotte business atteint 100% |

### Action manuelle requise

Creer le template `joiedevivre_fund_ready` dans Meta Business Manager avec le format decrit ci-dessus, puis attendre son approbation avant de tester l'envoi WhatsApp.

