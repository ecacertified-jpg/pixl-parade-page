

# Ajout du rappel Jour-J avec message de celebration

## Resume

Ajouter un 9e intervalle **Jour-J (le jour meme de l'anniversaire)** au systeme de rappels existant, avec un message de celebration festif envoye aux contacts du cercle d'amis.

## Changements

### 1. Migration SQL - Nouvelle colonne `alert_day_of`

Ajouter une colonne `alert_day_of` (boolean, defaut `true`) a la table `contact_alert_preferences`.

```text
ALTER TABLE public.contact_alert_preferences
  ADD COLUMN IF NOT EXISTS alert_day_of boolean NOT NULL DEFAULT true;
```

### 2. Edge Function `check-birthday-alerts-for-contacts/index.ts`

- Ajouter l'intervalle Jour-J dans `ALERT_INTERVALS` :
  ```text
  { days: 0, column: 'alert_day_of', msgKey: 'j0' }
  ```
- Ajouter le message de celebration dans `MESSAGES` :
  ```text
  j0: "🎂 JoieDvivre: C'est AUJOURD'HUI l'anniversaire de {nom}! 
       Souhaitez-lui une belle journee et offrez-lui un cadeau 
       sur joiedevivre-africa.com 🎁🎉"
  ```
- Adapter `getDaysUntilBirthday()` pour retourner `0` quand l'anniversaire est aujourd'hui (gerer le cas `nextBirthday == today` qui retournait 365 au lieu de 0)

### 3. Hook `useContactAlertPreferences.ts`

- Ajouter `alert_day_of: boolean` dans l'interface `ContactAlertPreferences`
- Ajouter `alert_day_of: true` dans `defaultPreferences`

### 4. Composant `ContactAlertPreferencesSection.tsx`

- Ajouter une checkbox Jour-J apres la checkbox J-1, avec une bordure speciale festive (violet/primary) pour la distinguer :
  - Label : **Jour-J (Le jour meme)**
  - Description : "Message de celebration le jour de l'anniversaire"
  - Style : bordure gauche violette + fond leger celebration

### 5. Edge Function `notify-contact-added/index.ts`

- Ajouter `alert_day_of: true` dans les preferences par defaut lors de la creation d'un nouveau contact.

## Ordre d'implementation

1. Migration SQL (ajout colonne `alert_day_of`)
2. Edge Function `check-birthday-alerts-for-contacts` (intervalle + message + fix `getDaysUntilBirthday`)
3. Edge Function `notify-contact-added` (defaut)
4. Hook TypeScript (interface + defaults)
5. Composant UI (checkbox celebration)

