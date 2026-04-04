

# Plan : Dashboard Admin des Conversations WhatsApp IA

## Contexte

Les tables `whatsapp_conversations` et `whatsapp_messages` stockent déjà toutes les conversations IA. Il manque une interface admin pour les visualiser.

## Architecture

Dashboard en 2 panneaux : liste des conversations à gauche, détail des messages à droite (style messagerie).

## Fichiers à créer/modifier

| Fichier | Action |
|---------|--------|
| `src/hooks/useWhatsAppConversations.ts` | Créer : hook pour charger conversations + messages + stats |
| `src/components/admin/WhatsAppAIConversations.tsx` | Créer : composant principal avec liste + détail |
| `src/pages/Admin/WhatsAppAIChat.tsx` | Créer : page admin avec AdminLayout |
| `src/App.tsx` | Ajouter route `/admin/whatsapp-ai` |
| `src/components/AdminLayout.tsx` | Ajouter lien dans la navigation |

## Détails

### Hook `useWhatsAppConversations`
- Charge `whatsapp_conversations` triées par `last_message_at`
- Fonction `fetchMessages(conversationId)` pour charger les messages d'une conversation
- Stats : total conversations, actives aujourd'hui, messages total
- Recherche par numéro de téléphone ou nom
- Realtime subscription sur `whatsapp_messages` pour les nouveaux messages

### Composant `WhatsAppAIConversations`
- **Panneau gauche** : liste des conversations avec nom/téléphone, dernier message, badge de statut, heure
- **Panneau droit** : fil de messages style chat (bulles inbound à gauche, outbound à droite)
- **En-tête** : KPIs (total conversations, actives, messages aujourd'hui)
- Filtre par statut (active/closed) et recherche

### Page `WhatsAppAIChat`
- Utilise `AdminLayout` + `AdminPageHeader`
- Route : `/admin/whatsapp-ai`

### Navigation
- Ajouter entrée "Chat IA WhatsApp" dans le menu admin, section messagerie (près des liens WhatsApp existants)

