

# Plan : Mettre à jour la documentation pour joiedevivre_new_order

## Changement — `.lovable/memory/whatsapp-messaging-strategy.md`

1. **Retirer** `joiedevivre_new_order` de la section "Templates à créer dans Meta Business Manager" (il n'en reste plus que 6)
2. **Mettre à jour** son entrée dans les templates actifs avec les détails exacts :
   - Body : `*Nouvelle commande sur Joie de Vivre !*\nClient : {{1}}\nMontant : {{2}} XOF\nCommande : {{3}}\nConnectez-vous pour accepter ou refuser cette commande.`
   - Bouton CTA statique : "Connectez-vous" → `https://joiedevivre-africa.com/business-account?tab=orders`

## Changement — `src/hooks/useWhatsAppTemplateInventory.ts`

Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_new_order` pour que le dashboard affiche le bon statut.

## Fichiers modifiés

- `.lovable/memory/whatsapp-messaging-strategy.md`
- `src/hooks/useWhatsAppTemplateInventory.ts`

