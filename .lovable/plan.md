

# Plan : Ajouter le template `joiedevivre_birthday_create_fund_nudge`

## Contexte

Actuellement, quand l'anniversaire d'un contact approche (J-7) et qu'aucune cagnotte n'existe, le système envoie `joiedevivre_birthday_no_fund_alert` qui redirige vers `/shop` (acheter un cadeau individuel). Il manque un template qui incite les proches à **créer une cagnotte** pour le bénéficiaire.

## Nouveau template WhatsApp

- **Nom** : `joiedevivre_birthday_create_fund_nudge`
- **Objectif** : Inciter un proche à créer une cagnotte collective pour le bénéficiaire
- **4 paramètres body** : `{{1}}` prénom bénéficiaire, `{{2}}` dayLabel (ex: "dans 5 jours"), `{{3}}` prénom du destinataire, `{{4}}` "JOIE DE VIVRE" (branding)
- **Header** : Image (même image que no_fund_alert ou une dédiée configurable via `BIRTHDAY_CREATE_FUND_NUDGE_IMAGE_URL`)
- **Bouton CTA** : URL dynamique vers `/go/birthday?for={{1}}` (page de création de cagnotte pré-remplie avec le nom du bénéficiaire)
- **Exemple de message** : "Bonjour {{3}} ! L'anniversaire de {{1}} est {{2}}. Pourquoi ne pas organiser une cagnotte collective sur {{4}} ? Vos amis pourront contribuer facilement. Créez la cagnotte maintenant !"

## Changements

### 1. `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Dans le bloc `sendNoFundFriendAlert` (lignes 473-536), remplacer l'envoi de `joiedevivre_birthday_no_fund_alert` par `joiedevivre_birthday_create_fund_nudge` :

- 4 paramètres body : `[contact.name, dayLabel, recipientName, 'JOIE DE VIVRE']`
- 1 paramètre CTA bouton : suffixe dynamique pour l'URL (ex: `?for=${encodeURIComponent(contact.name)}`)
- Header image configurable via `BIRTHDAY_CREATE_FUND_NUDGE_IMAGE_URL` avec fallback vers l'image no_fund existante
- Conserver le fallback SMS existant
- Conserver le `alert_type` existant `friend_birthday_alert_no_fund` pour la déduplication (ou le renommer en `friend_birthday_create_fund_nudge`)

### 2. `.lovable/memory/whatsapp-messaging-strategy.md`

Ajouter le nouveau template dans la liste des templates actifs avec sa description et ses paramètres.

## Template à créer sur Meta Business Manager

Le template doit être créé manuellement dans Meta Business Manager avec :
- Catégorie : UTILITY
- Langue : Français (fr)
- Header : IMAGE
- Body : texte avec 4 variables
- Bouton : CTA URL avec suffixe dynamique `{{1}}`

## Fichiers modifiés

- `supabase/functions/birthday-reminder-with-suggestions/index.ts`
- `.lovable/memory/whatsapp-messaging-strategy.md`

