

# Plan : Mettre à jour la documentation pour joiedevivre_order_rejected

## Constat

Le template `joiedevivre_order_rejected` existe déjà dans Meta avec :
- **Catégorie** : UTILITY
- **Body** : `Bonjour {{1}}, votre commande de {{2}} XOF chez {{3}} n'a pas pu etre acceptee. Contactez-nous sur joiedevivre-africa.com pour plus d'informations.`
- **Paramètres** : `{{1}}` prénom client, `{{2}}` montant, `{{3}}` nom boutique
- **Bouton CTA** : aucun

## Changements

### 1. `.lovable/memory/whatsapp-messaging-strategy.md`
- Retirer `joiedevivre_order_rejected` de la section "Templates à créer dans Meta Business Manager" (passe de 5 à 4)
- Mettre à jour sa description dans les templates actifs avec le body exact et la mention "Pas de bouton CTA"

### 2. `src/hooks/useWhatsAppTemplateInventory.ts`
- Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_order_rejected`

## Fichiers modifiés
- `.lovable/memory/whatsapp-messaging-strategy.md`
- `src/hooks/useWhatsAppTemplateInventory.ts`

