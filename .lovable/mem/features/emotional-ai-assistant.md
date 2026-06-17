---
name: Emotional AI assistant (Joie)
description: IA émotionnelle JDV — hub chat /assistant + edge fns surprises et décoration
type: feature
---

## IA émotionnelle "Joie"

### Hub conversationnel `/assistant`
Chat persistant en localStorage (`jdv_assistant_chat_v1`, dernières 40 messages). Greeting auto au premier chargement. Markdown rendu via react-markdown. Bulle utilisateur en `bg-primary text-primary-foreground`, réponse assistante sans bulle (sur fond carte). 4 starters cliquables tant que conversation < 2 messages.

### Edge function `emotional-assistant-chat`
Non-streaming. Reçoit `{ messages: [{role, content}] }` (max 20 derniers). System prompt "Joie" couvre les 10 capacités émotionnelles (messages, cadeaux, surprises, déco, gratitude, organisation événement, relationnel). Injecte le prénom + ville de l'utilisateur depuis `profiles`. Modèle `google/gemini-3-flash-preview`.

### Edge function `suggest-surprise-ideas`
JSON output : 5 idées surprises (titre, description, emotion, effort, coût XOF). Privilégie au moins 2 idées gratuites.

### Edge function `suggest-decoration-theme`
JSON output : theme_name, mood, palette (4 hex), key_elements, checklist (item+qty+coût), tips. Valorise pagnes/tissus locaux.

### Briques existantes mappées
- Messages anniversaire → `suggest-birthday-message`
- Idées cadeaux → `ai-gift-recommendations`
- Amélioration messages → `enhance-gratitude-message`
- Montage souvenirs → `/souvenirs/retrospective/:year`
- Assistant événement → `event-ai-assistant`
- Intelligence relationnelle → `reciprocity_scores` + `community_scores`