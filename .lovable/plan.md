

# Plan : Mode hybride IA + Admin pour les conversations WhatsApp

## Principe

Ajouter un champ `mode` sur chaque conversation (`ai` ou `human`). Quand l'admin bascule en mode `human`, le webhook arrête de générer des réponses IA pour cette conversation. L'admin peut alors envoyer des messages manuellement depuis le dashboard, qui sont envoyés via l'API WhatsApp Cloud.

## Modifications

### 1. Migration SQL — Ajouter colonne `mode` et `assigned_admin_id`

```sql
ALTER TABLE public.whatsapp_conversations 
  DROP CONSTRAINT IF EXISTS whatsapp_conversations_status_check;

ALTER TABLE public.whatsapp_conversations 
  ADD CONSTRAINT whatsapp_conversations_status_check 
  CHECK (status IN ('active', 'closed'));

ALTER TABLE public.whatsapp_conversations 
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'ai' CHECK (mode IN ('ai', 'human')),
  ADD COLUMN assigned_admin_id UUID REFERENCES auth.users(id);
```

### 2. Edge Function `whatsapp-webhook/index.ts`

Avant de générer la réponse IA (ligne ~388), vérifier le mode de la conversation :

```typescript
// Si mode = 'human', sauvegarder le message entrant mais NE PAS répondre avec l'IA
if (conversation.mode === 'human') {
  console.log('👤 Conversation en mode humain, pas de réponse IA');
  return new Response('OK', { status: 200, headers: corsHeaders });
}
```

### 3. Nouvelle Edge Function `whatsapp-admin-reply/index.ts`

- Reçoit `{ conversation_id, message }` du frontend admin
- Vérifie que l'appelant est admin (JWT + check `admin_users`)
- Charge le `phone_number` de la conversation
- Envoie le message via l'API WhatsApp Cloud
- Sauvegarde dans `whatsapp_messages` avec `direction: 'outbound'` et `metadata: { sender: 'admin', admin_id: '...' }`

### 4. Hook `useWhatsAppConversations.ts`

- Ajouter `mode` et `assigned_admin_id` à l'interface `WhatsAppConversation`
- Ajouter fonction `toggleMode(conversationId, newMode)` qui update la conversation en DB
- Ajouter fonction `sendAdminReply(conversationId, message)` qui invoque l'Edge Function

### 5. Composant `WhatsAppAIConversations.tsx`

- **En-tête de conversation** : ajouter un bouton toggle IA/Humain (icône Bot ↔ UserCheck) + badge du mode actuel
- **Zone de saisie** (bas du panneau droit) : un `Textarea` + bouton "Envoyer" visible uniquement quand `mode === 'human'`
- **Bulles de messages** : différencier visuellement les messages admin (icône UserCheck, couleur différente) des messages IA (icône Bot)

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| Migration SQL | Ajouter `mode` et `assigned_admin_id` à `whatsapp_conversations` |
| `supabase/functions/whatsapp-webhook/index.ts` | Vérifier le mode avant réponse IA |
| `supabase/functions/whatsapp-admin-reply/index.ts` | Créer : envoi de messages admin via WhatsApp |
| `src/hooks/useWhatsAppConversations.ts` | Ajouter `toggleMode` et `sendAdminReply` |
| `src/components/admin/WhatsAppAIConversations.tsx` | Ajouter toggle mode + zone de saisie admin |

