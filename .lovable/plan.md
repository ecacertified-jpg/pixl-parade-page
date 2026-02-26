
## Ajouter un bouton "Voir mon cadeau" au template joiedevivre_gift_order

### Objectif
Ajouter un bouton d'appel a l'action (CTA) avec URL dynamique au template WhatsApp `joiedevivre_gift_order`, identique au pattern utilise pour `joiedevivre_group_contribution` avec son bouton "Contribuer".

### Contexte
Le template `joiedevivre_group_contribution` utilise deja `sendWhatsAppTemplate` avec un 5e argument `buttonParameters` contenant l'ID de la cagnotte. Ce meme mecanisme sera replique pour le cadeau.

### Modifications

**Fichier : `supabase/functions/notify-business-order/index.ts`**

1. **Modifier la signature de `sendGiftBeneficiaryNotification`** : ajouter un parametre `orderId: string`
2. **Passer l'ID de commande comme `buttonParameters`** dans l'appel a `sendWhatsAppTemplate` :

```typescript
const result = await sendWhatsAppTemplate(
  beneficiaryPhone,
  'joiedevivre_gift_order',
  'fr',
  [senderName, productName, formattedAmount],
  [orderId]  // <-- nouveau : URL dynamique pour le bouton "Voir mon cadeau"
);
```

3. **Mettre a jour l'appel** a `sendGiftBeneficiaryNotification` (ligne ~209) pour passer `order.id` comme argument supplementaire

### Pre-requis cote Meta Business Manager
Le template `joiedevivre_gift_order` doit etre mis a jour dans Meta Business Manager pour inclure un bouton CTA de type "URL dynamique" pointant vers :

```
https://pixl-parade-page.lovable.app/order-confirmation?orderId={{1}}
```

Cette configuration se fait manuellement dans la console Meta (Gestionnaire WhatsApp > Modeles de messages > joiedevivre_gift_order > Ajouter un bouton > URL dynamique).

### Impact
- Aucune modification de schema de base de donnees
- Aucun nouveau fichier
- Seul le fichier `notify-business-order/index.ts` est modifie (3 lignes)
- Le bouton ne fonctionnera qu'une fois le template mis a jour dans Meta Business Manager
