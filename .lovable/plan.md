

## Tracker de delivrabilite WhatsApp via webhook Meta

### Contexte

Actuellement, le webhook `whatsapp-webhook` traite les status updates de Meta mais ne met a jour que la table `whatsapp_messages` (conversations chatbot). Les templates HSM envoyes via `sendWhatsAppTemplate` (cagnottes, OTP, anniversaires, etc.) sont logues dans `whatsapp_template_logs` mais **sans `whatsapp_message_id`**, donc les callbacks de statut Meta (delivered, read, failed) ne peuvent pas etre correles.

### Architecture actuelle

```text
sendWhatsAppTemplate() -> Meta API -> retourne message_id
                       -> whatsapp_template_logs (status: sent/failed, PAS de message_id)

Meta webhook callback -> whatsapp-webhook -> cherche whatsapp_messages.whatsapp_message_id
                                          -> NE CHERCHE PAS dans whatsapp_template_logs
```

### Solution

```text
sendWhatsAppTemplate() -> Meta API -> retourne message_id
                       -> whatsapp_template_logs (status: sent, whatsapp_message_id: wamid.xxx)

Meta webhook callback -> whatsapp-webhook -> cherche DANS whatsapp_messages
                                          -> cherche AUSSI DANS whatsapp_template_logs
                                          -> met a jour status + timestamps (delivered_at, read_at, failed_at)
```

### Modifications

---

**1. Migration SQL : ajouter colonnes a `whatsapp_template_logs`**

Ajouter 4 colonnes :
- `whatsapp_message_id` (text, nullable, indexed) : l'ID retourne par Meta (ex: `wamid.xxx`)
- `delivered_at` (timestamptz, nullable) : quand le message a ete delivre
- `read_at` (timestamptz, nullable) : quand le message a ete lu
- `failed_at` (timestamptz, nullable) : quand le message a echoue

Index sur `whatsapp_message_id` pour un lookup rapide lors du webhook callback.

---

**2. `supabase/functions/_shared/sms-sender.ts` : sauvegarder le message_id**

Modifier `logTemplateResult` pour accepter un parametre optionnel `whatsappMessageId` et l'inclure dans l'insert.

Modifier `sendWhatsAppTemplate` pour passer le `messageId` retourne par Meta a `logTemplateResult` lors d'un envoi reussi.

---

**3. `supabase/functions/whatsapp-webhook/index.ts` : enrichir le traitement des statuts**

Dans le bloc `value.statuses`, actuellement le code ne cherche que dans `whatsapp_messages`. Ajouter une recherche dans `whatsapp_template_logs` par `whatsapp_message_id` :

```text
SI status update recu (delivered, read, failed) :
  1. Mettre a jour whatsapp_messages (existant)
  2. Chercher dans whatsapp_template_logs par whatsapp_message_id
  3. Si trouve :
     - Mettre a jour le status
     - Ecrire le timestamp correspondant (delivered_at, read_at, failed_at)
     - Si failed : ecrire error_message depuis errors[0].title
  4. Logger le resultat
```

Extraire aussi les informations d'erreur de Meta (`errors[0].title`, `errors[0].code`) pour les statuts `failed`.

---

### Resume des fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Migration SQL | Ajouter `whatsapp_message_id`, `delivered_at`, `read_at`, `failed_at` a `whatsapp_template_logs` |
| `supabase/functions/_shared/sms-sender.ts` | Passer le message_id Meta dans `logTemplateResult` |
| `supabase/functions/whatsapp-webhook/index.ts` | Chercher et mettre a jour `whatsapp_template_logs` lors des callbacks de statut |

### Ordre d'implementation

1. Migration SQL (colonnes + index)
2. `sms-sender.ts` (sauvegarder le message_id)
3. `whatsapp-webhook` (correlater les statuts)
4. Deployer les deux Edge Functions

