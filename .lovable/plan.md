

# Plan : Synchroniser joiedevivre_welcome_add_friends (existant dans Meta)

## Constat

Le template `joiedevivre_welcome_add_friends` est déjà créé et approuvé dans Meta avec :
- **Catégorie** : MARKETING
- **Body** : `Bienvenue sur JOIE DE VIVRE, {{1}} ! Ajoute au moins 2 amis a ton cercle pour commencer a recevoir des cadeaux. Plus tu ajoutes d'amis, plus tu maximises tes chances d'obtenir un cadeau de ta liste de souhaits.`
- **Paramètre** : `{{1}}` = prénom utilisateur
- **Bouton CTA** : "Commence ici" → `https://joiedevivre-africa.com/contacts` (statique)
- **Pas de header ni pied de page**

## Vérification code : OK

Le code Edge Function passe `[firstName]` comme seul paramètre body, ce qui correspond exactement à `{{1}}`. Pas de paramètre bouton nécessaire (CTA statique). Déduplication fonctionnelle.

## Changements

### 1. `src/hooks/useWhatsAppTemplateInventory.ts`
Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_welcome_add_friends`

### 2. `.lovable/memory/whatsapp-messaging-strategy.md`
- Retirer `joiedevivre_welcome_add_friends` de la section "Templates à créer" (passe de 3 à 2)
- Mettre à jour sa description dans les templates actifs avec le body exact et le CTA statique

## Fichiers modifiés
- `src/hooks/useWhatsAppTemplateInventory.ts`
- `.lovable/memory/whatsapp-messaging-strategy.md`

