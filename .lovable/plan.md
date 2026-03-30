

# Plan : Ajouter `joiedevivre_birthday_countdown_invite` à KNOWN_TEMPLATES

## Modification

Dans `src/hooks/useWhatsAppTemplateInventory.ts`, ajouter une entrée dans le tableau `KNOWN_TEMPLATES` :

```typescript
{ name: 'joiedevivre_birthday_countdown_invite', description: 'Invitation compte à rebours anniversaire', edgeFunction: 'birthday-wishes' },
```

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `src/hooks/useWhatsAppTemplateInventory.ts` | Ajouter 1 entrée à `KNOWN_TEMPLATES` |

