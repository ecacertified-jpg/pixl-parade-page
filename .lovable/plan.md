

## Bouton "Contribuer" avec lien dynamique vers la cagnotte

### Configuration dans Meta Business Manager

Le bouton du template `joiedevivre_group_contribution` doit utiliser une **URL dynamique** pour pointer vers la cagnotte specifique.

**Configuration du bouton :**

| Champ | Valeur |
|-------|--------|
| Type de bouton | **Appel a l'action (CTA)** |
| Type d'action | **Visiter le site web** |
| Type d'URL | **Dynamique** |
| URL de base | `https://joiedevivre-africa.com/f/{{1}}` |
| Texte du bouton | `Contribuer` |

La variable `{{1}}` du bouton sera remplacee par l'ID de la cagnotte (ex: `a1b2c3d4-...`), generant un lien comme :
`https://joiedevivre-africa.com/f/a1b2c3d4-5678-9abc-def0-123456789abc`

**Important** : Dans Meta Business Manager, les variables du bouton sont numerotees separement de celles du corps. La variable `{{1}}` du bouton est independante des `{{1}}-{{4}}` du corps du message.

Ajoutez un **exemple** pour la variable du bouton lors de la soumission (ex: `a1b2c3d4-5678-9abc-def0-123456789abc`).

---

### Modification du code

Dans `supabase/functions/notify-business-fund-contributors/index.ts`, deux changements :

1. **Ajouter `share_token` a la requete** `collective_funds` (ligne 59-66) pour pouvoir construire le lien de partage
2. **Passer le `fund_id` comme parametre de bouton** dans l'appel `sendWhatsAppTemplate`

Le helper `sendWhatsAppTemplate` devra recevoir le `fund_id` en parametre supplementaire pour le bouton. Selon l'implementation actuelle du helper, il faudra peut-etre ajouter un parametre `buttonParams` ou simplement ajouter l'ID a la fin du tableau de variables du corps (selon le format attendu par l'API Twilio/Meta).

**Appel modifie :**
```typescript
await sendWhatsAppTemplate(
  friend.phone,
  'joiedevivre_group_contribution',
  'fr',
  [friend.first_name || 'Ami(e)', beneficiaryName, formattedTarget, productName],
  // Parametre de bouton URL dynamique
  [fund_id]
);
```

### Fichier a modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/notify-business-fund-contributors/index.ts` | Passer le `fund_id` comme parametre de bouton dans l'appel WhatsApp |
| `supabase/functions/_shared/sms-sender.ts` | Verifier/ajouter le support des parametres de bouton dans `sendWhatsAppTemplate` |

### Resume

| Etape | Ou | Action |
|-------|----|--------|
| 1 | Meta Business Manager | Modifier le template `joiedevivre_group_contribution` : ajouter un bouton CTA "Contribuer" de type URL dynamique `https://joiedevivre-africa.com/f/{{1}}` |
| 2 | Meta Business Manager | Resoumettre le template a examen |
| 3 | Code | Adapter `sendWhatsAppTemplate` pour supporter les parametres de bouton URL si ce n'est pas deja le cas |
| 4 | Code | Passer `fund_id` en parametre de bouton dans l'Edge Function |

