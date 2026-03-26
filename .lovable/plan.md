

# Plan : Synchroniser joiedevivre_friends_circle_reminder (existant dans Meta)

## Constat

Le template existe dans Meta avec :
- **Catégorie** : MARKETING
- **Header texte** : "Joie de Vivre"
- **Body** : `Salut {{1}}, Ton cercle d'amis n'est pas encore complet ! Ajoute des proches pour maximiser tes chances de recevoir un cadeau de ta liste de souhaits. Tu peux ajouter autant d'amis que tu veux.`
- **Paramètre** : `{{1}}` = prénom utilisateur
- **CTA** : "Ajoute-les ici" → `https://joiedevivre-africa.com/contacts` (statique)

## Vérification code : OK

Le code dans `check-friends-circle-reminders/index.ts` passe `[firstName]` comme seul paramètre body, ce qui correspond exactement à `{{1}}`. CTA statique = aucun paramètre bouton nécessaire. Déduplication et fallback SMS fonctionnels.

## Changements

### 1. `src/hooks/useWhatsAppTemplateInventory.ts`
Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_friends_circle_reminder`

### 2. `.lovable/memory/whatsapp-messaging-strategy.md`
- Retirer de la section "Templates à créer" (passe de 2 à 1 — seul `joiedevivre_delivery_reminder` reste)
- Mettre à jour sa description dans les templates actifs avec le body exact, le header texte et le CTA statique

## Fichiers modifiés
- `src/hooks/useWhatsAppTemplateInventory.ts`
- `.lovable/memory/whatsapp-messaging-strategy.md`

