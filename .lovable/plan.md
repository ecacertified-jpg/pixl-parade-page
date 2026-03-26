

# Plan : Mettre à jour la documentation pour joiedevivre_order_confirmed

## Constat

Le template `joiedevivre_order_confirmed` existe déjà dans Meta avec :
- **Catégorie** : UTILITY
- **Body** : `Bonne nouvelle {{1}} ! Votre commande de {{2}} XOF chez {{3}} a ete confirmee. Suivez votre commande sur joiedevivre-africa.com`
- **Paramètres** : `{{1}}` prénom client, `{{2}}` montant, `{{3}}` nom boutique
- **Bouton CTA** : aucun

## Changements

### 1. `.lovable/memory/whatsapp-messaging-strategy.md`
- Retirer `joiedevivre_order_confirmed` de la section "Templates à créer dans Meta Business Manager" (passe de 6 à 5)
- Mettre à jour sa description dans les templates actifs avec le body exact

### 2. `src/hooks/useWhatsAppTemplateInventory.ts`
- Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_order_confirmed`

## Fichiers modifiés
- `.lovable/memory/whatsapp-messaging-strategy.md`
- `src/hooks/useWhatsAppTemplateInventory.ts`

