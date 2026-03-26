

# Plan : Synchroniser joiedevivre_join_reminder (existant dans Meta)

## Constat

Le template `joiedevivre_join_reminder` est déjà créé et approuvé dans Meta avec :
- **Catégorie** : MARKETING
- **Header** : Image (statique, configurée dans Meta)
- **Body** : `😍 {{1}} t'a ajouté à son cercle d'amis sur Joie de Vivre 🎉\n\nCrée ton propre cercle pour profiter aussi de la générosité de tes proches et recevoir des cadeaux pour ton anniversaire !\n\n👉 Inscris-toi gratuitement sur joiedevivre-africa.com`
- **Paramètre** : `{{1}}` = nom de l'ami qui a ajouté
- **Pied de page** : `JOIE DE VIVRE - Célébrons ensemble`
- **Bouton CTA** : "Créer mon cercle" → `https://joiedevivre-africa.com/auth?utm_source=whatsapp&utm_medium=join_reminder` (statique)

## Vérification du code Edge Function

Le code dans `notify-contacts-join-reminder/index.ts` est **correct** :
- Passe 1 paramètre body `[ownerName]` → correspond à `{{1}}`
- Pas de `headerImageUrl` nécessaire (image statique dans Meta)
- Pas de `buttonParameters` nécessaire (CTA statique)
- Déduplication via `birthday_contact_alerts` avec `alert_type: 'join_reminder'`

Le template **fonctionne correctement** côté code.

## Changements

### 1. `src/hooks/useWhatsAppTemplateInventory.ts`
Retirer `needsMetaCreation: true` de l'entrée `joiedevivre_join_reminder`

### 2. `.lovable/memory/whatsapp-messaging-strategy.md`
- Retirer `joiedevivre_join_reminder` de la section "Templates à créer" (passe de 4 à 3)
- Mettre à jour sa description dans les templates actifs avec le body exact, le CTA et la mention du header image statique

## Fichiers modifiés
- `src/hooks/useWhatsAppTemplateInventory.ts`
- `.lovable/memory/whatsapp-messaging-strategy.md`

