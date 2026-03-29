

# Plan : Corriger les paramètres du template et tester l'envoi

## Problème identifié

Le template `joiedevivre_birthday_reminder` attend 3 variables body :
- **{{1}}** = nom du destinataire (celui qui reçoit le WhatsApp, ex: "Aminata")
- **{{2}}** = nom de la personne dont c'est l'anniversaire (ex: "Florentin")
- **{{3}}** = nombre de jours restants (ex: "7")

Le bouton CTA "Préparer une surprise" a une URL **statique** (`https://joiedevivre-africa.com/shop`) → pas de `buttonParameters`.

### Code actuel (incorrect)

**`check-birthday-alerts-for-contacts/index.ts` ligne 205** :
```ts
[userName, String(daysUntilBirthday), 'Préparez une surprise inoubliable 🎁']
```
- {{1}} reçoit `userName` (devrait être le nom du destinataire/owner)
- {{3}} reçoit un texte libre au lieu du nombre de jours

**`birthday-reminder-with-suggestions/index.ts` ligne 299** :
```ts
[contact.name, '1', 'Préparez une surprise inoubliable 🎁']
```
- Même problème : 3 params mais {{1}} devrait être le destinataire

## Corrections

### 1. `check-birthday-alerts-for-contacts/index.ts`

Récupérer le prénom du owner (contact.name ou ownerProfile.first_name) et corriger l'ordre :
```ts
// Avant
[userName, String(daysUntilBirthday), 'Préparez une surprise inoubliable 🎁']

// Après — {{1}}=destinataire, {{2}}=fêté, {{3}}=jours
[contact.name || 'Ami(e)', userName, String(daysUntilBirthday)]
```

### 2. `birthday-reminder-with-suggestions/index.ts`

Corriger de la même façon :
```ts
// Avant
[contact.name, '1', 'Préparez une surprise inoubliable 🎁']

// Après — {{1}}=destinataire, {{2}}=fêté, {{3}}=jours
[userProfile.first_name || 'Ami(e)', contact.name, String(daysUntilBirthday)]
```

### 3. Tester l'envoi

Après déploiement, appeler `test-whatsapp-send` avec un numéro de test et les 3 body parameters corrects pour valider la réception.

## Données de test disponibles

| Owner (destinataire) | Contact (fêté) | Téléphone owner |
|---------------------|----------------|-----------------|
| Françoise | Aboutou WhatsApp | +2250708895257 |
| Aboutou WhatsApp | Richmond | +2250546566646 |

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Corriger l'ordre des 3 params |
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Corriger l'ordre des 3 params |

