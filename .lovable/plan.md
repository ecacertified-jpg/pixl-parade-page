
# Nouveaux intervalles de rappel d'anniversaire : J-30, J-21, J-14, J-7, J-5, J-3, J-2, J-1

## Changements

Les anciens intervalles (J-10, J-5, J-3, J-2, J-1, Jour-J) sont remplaces par : **J-30, J-21, J-14, J-7, J-5, J-3, J-2, J-1**.

Cela signifie :
- **Suppression** de J-10 et Jour-J
- **Ajout** de J-30, J-21, J-14, J-7

## Fichiers a modifier

### 1. Migration SQL - Table `contact_alert_preferences`

Ajouter 4 nouvelles colonnes et supprimer 2 colonnes :

```text
-- Ajout
alert_30_days  boolean default true
alert_21_days  boolean default true
alert_14_days  boolean default true
alert_7_days   boolean default true

-- Suppression
alert_10_days
alert_day_of
```

Mettre a jour les preferences existantes pour activer les nouveaux intervalles par defaut.

### 2. Edge Function `check-birthday-alerts-for-contacts/index.ts`

- Remplacer `ALERT_INTERVALS` par les 8 nouveaux intervalles
- Remplacer les `MESSAGES` par 8 messages adaptes :
  - J-30 : "L'anniversaire de {nom} est dans 1 mois. Commencez a preparer une surprise!"
  - J-21 : "L'anniversaire de {nom} est dans 3 semaines. Pensez au cadeau ideal!"
  - J-14 : "L'anniversaire de {nom} est dans 2 semaines. Decouvrez nos idees cadeaux!"
  - J-7 : "L'anniversaire de {nom} est dans 1 semaine. Il est temps de commander!"
  - J-5, J-3, J-2, J-1 : messages existants conserves (avec ajustements mineurs)

### 3. Edge Function `notify-contact-added/index.ts`

Mettre a jour les valeurs par defaut lors de la creation des preferences pour un nouveau contact :
- Remplacer `alert_10_days` et `alert_day_of` par `alert_30_days`, `alert_21_days`, `alert_14_days`, `alert_7_days`

### 4. Hook `useContactAlertPreferences.ts`

- Mettre a jour l'interface `ContactAlertPreferences` : supprimer `alert_10_days` et `alert_day_of`, ajouter les 4 nouveaux champs
- Mettre a jour `defaultPreferences` avec les nouveaux intervalles

### 5. Composant `ContactAlertPreferencesSection.tsx`

- Remplacer les 6 checkboxes actuels par 8 checkboxes correspondant aux nouveaux intervalles
- Descriptions :
  - J-30 : "Anticipez 1 mois a l'avance"
  - J-21 : "Rappel 3 semaines avant"
  - J-14 : "Rappel 2 semaines avant"
  - J-7 : "Rappel 1 semaine avant"
  - J-5 : "Rappel pour trouver le cadeau"
  - J-3 : "Rappel pour commander"
  - J-2 : "Rappel derniere chance"
  - J-1 : "Dernier rappel urgent" (avec bordure orange conservee)

## Ordre d'implementation

1. Migration SQL (ajout colonnes, suppression anciennes)
2. Edge Functions (intervalles + messages)
3. Hook TypeScript (interface + defaults)
4. Composant UI (checkboxes)
