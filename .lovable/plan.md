

# Plan : Envoyer `joiedevivre_birthday_celebration` à tous les anniversaires du jour

## Problèmes

1. **`getPreferredChannel` bloque les +225** : Ligne 632, le code vérifie `if (channel === 'whatsapp')` avant d'envoyer. Les numéros ivoiriens retournent `'sms'`, donc ils sont exclus.

2. **Contacts non traités** : La Part B ne boucle que sur `todayBirthdays` (profils). Les contacts dont c'est l'anniversaire ne reçoivent pas le template celebration.

## Corrections dans `birthday-wishes/index.ts`

### 1. Supprimer la condition `getPreferredChannel` pour la célébration

Remplacer lignes 632-633 :
```ts
// AVANT
const channel = getPreferredChannel(profile.phone);
if (channel === 'whatsapp') {

// APRÈS — toujours tenter WhatsApp pour la célébration
if (profile.phone) {
```

Supprimer le `}` fermant correspondant (ligne 678).

### 2. Ajouter l'envoi aux contacts dont c'est l'anniversaire

Après la boucle des profils (après ligne 687), ajouter une section qui :
- Filtre `allContacts` pour ceux dont l'anniversaire est aujourd'hui
- Pour chaque contact avec un téléphone :
  - Vérifie la déduplication via `birthday_contact_alerts` (alert_type = `birthday_celebration_contact`)
  - Envoie `joiedevivre_birthday_celebration` avec `[contactName, "Que cette année soit exceptionnelle !"]` + bouton `['birthday']` + vidéo par défaut
  - Enregistre dans `birthday_contact_alerts`
  - Notifie aussi le propriétaire du contact (in-app) que c'est l'anniversaire de son contact

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `supabase/functions/birthday-wishes/index.ts` | Supprimer condition channel, ajouter boucle contacts jour J |

