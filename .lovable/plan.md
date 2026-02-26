
## Audit WhatsApp : couverture par fonction et par pays

### Etat actuel

L'envoi WhatsApp repose sur deux mecanismes dans `_shared/sms-sender.ts` :
- `sendWhatsApp()` : message texte libre (necessite une fenetre de 24h)
- `sendWhatsAppTemplate()` : modele HSM (fonctionne sans fenetre de 24h)
- `getPreferredChannel()` : retourne `'whatsapp'` pour tous les pays sauf CI (+225) et SN (+221)

### Fonctions correctement configurees (WhatsApp + SMS)

| Fonction | WhatsApp | SMS | Routage intelligent |
|----------|----------|-----|---------------------|
| `send-whatsapp-otp` | Template HSM | Non | Toujours WhatsApp |
| `notify-contact-added` | Template + fallback texte | Oui | `getSmsPrefixReliability()` par pays |
| `notify-business-order` | Template HSM | Oui | `getSmsPrefixReliability()` par pays |
| `handle-order-action` | Template HSM | Oui | `shouldUseSms()` |
| `check-friends-circle-reminders` | Template HSM | Oui | `getPreferredChannel()` |
| `whatsapp-webhook` | Texte libre (chatbot) | Non | Toujours WhatsApp |

### Fonctions PROBLEMATIQUES (SMS uniquement, pas de WhatsApp)

Ces fonctions utilisent `shouldUseSms()` ou `sendSms()` directement, et **ne font rien** pour les utilisateurs du Benin, Togo, Mali, Burkina Faso (ou le SMS est marque `unavailable`) :

| Fonction | Probleme | Impact |
|----------|----------|--------|
| `birthday-reminder-with-suggestions` | Utilise `shouldUseSms()` : ne notifie que CI/SN | Rappels d'anniversaire silencieux pour BJ/TG/ML/BF |
| `check-birthday-alerts-for-contacts` | Utilise `getPreferredChannel()` mais la branche WhatsApp est un `console.log` factice | Aucun message recu pour BJ/TG/ML/BF |
| `notify-order-confirmation` | Utilise `shouldUseSms()` uniquement | Pas de notification de remboursement pour BJ/TG/ML/BF |
| `check-fund-contribution-reminders` | Utilise `sendSms()` directement sans verifier le canal | Echoue silencieusement pour BJ/TG/ML/BF |
| `send-invitation` | Email uniquement (Resend), pas de SMS ni WhatsApp | Pas de notification telephonique du tout |

### Correction proposee

Pour chaque fonction problematique, ajouter le support WhatsApp en suivant le pattern deja utilise dans `notify-contact-added` et `handle-order-action` :

---

#### 1. `birthday-reminder-with-suggestions/index.ts`
- Importer `sendWhatsAppTemplate` et `getPreferredChannel`
- Remplacer la condition `shouldUseSms()` par un routage : si `getPreferredChannel() === 'whatsapp'`, envoyer via `sendWhatsAppTemplate` avec un template a creer (`joiedevivre_birthday_reminder`)
- Fallback : si pas de template, utiliser `sendWhatsApp()` texte libre

#### 2. `check-birthday-alerts-for-contacts/index.ts`
- Remplacer le `console.log` factice (ligne 178) par un vrai appel `sendWhatsAppTemplate` ou `sendWhatsApp`
- Le code a deja la branche `else if (preferences.whatsapp_enabled)` mais elle ne fait rien

#### 3. `notify-order-confirmation/index.ts`
- Ajouter une branche WhatsApp quand `shouldUseSms()` retourne `false`
- Utiliser `sendWhatsAppTemplate` avec un template comme `joiedevivre_refund_alert`
- Fallback `sendWhatsApp()` texte libre

#### 4. `check-fund-contribution-reminders/index.ts`
- Importer `getPreferredChannel` et `sendWhatsAppTemplate`
- Avant d'appeler `sendSms()`, verifier le canal prefere
- Si WhatsApp : utiliser un template ou texte libre

#### 5. `send-invitation/index.ts` (optionnel, priorite basse)
- Actuellement email uniquement via Resend
- Ajouter un envoi WhatsApp si `invitee_phone` est fourni
- Utiliser un template d'invitation

---

### Templates WhatsApp a creer dans Meta Business Manager

Pour que les messages fonctionnent hors fenetre de 24h, il faut creer ces templates HSM :

| Template | Categorie | Parametres |
|----------|-----------|------------|
| `joiedevivre_birthday_reminder` | Utility | `{{1}}` nom du contact, `{{2}}` nombre de jours |
| `joiedevivre_refund_alert` | Utility | `{{1}}` numero de commande |
| `joiedevivre_contribution_reminder` | Utility | `{{1}}` nom de la cagnotte, `{{2}}` montant restant |

> **Note** : Les templates doivent etre approuves par Meta avant de fonctionner. En attendant, le code utilisera `sendWhatsApp()` en texte libre comme fallback (fonctionne uniquement dans la fenetre de 24h).

---

### Resume des fichiers a modifier

| Fichier | Modification |
|---------|-------------|
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Ajouter routage WhatsApp avec template/fallback |
| `supabase/functions/check-birthday-alerts-for-contacts/index.ts` | Remplacer le `console.log` par un vrai envoi WhatsApp |
| `supabase/functions/notify-order-confirmation/index.ts` | Ajouter branche WhatsApp pour alertes remboursement |
| `supabase/functions/check-fund-contribution-reminders/index.ts` | Ajouter routage par canal avant envoi |

4 fonctions a corriger. Les fonctions `notify-contact-added`, `notify-business-order`, `handle-order-action` et `check-friends-circle-reminders` sont deja correctement configurees.
