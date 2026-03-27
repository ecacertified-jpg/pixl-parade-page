

# Plan : Template WhatsApp dédié pour contacts non-inscrits (countdown)

## Problème

Les contacts non-inscrits reçoivent actuellement `joiedevivre_birthday_countdown` avec un CTA "Mettre à jour ma wishlist" → `/wishlist-catalog`, ce qui n'a aucun sens pour quelqu'un sans compte.

## Solution

### 1. Détails du template à créer dans Meta Business Manager

| Champ | Valeur |
|-------|--------|
| **Nom** | `joiedevivre_birthday_countdown_invite` |
| **Catégorie** | MARKETING |
| **Langue** | Français (`fr`) |
| **Header** | Image (même image que countdown : `birthday-countdown.jpeg`) |
| **Body** | `Salut {{1}}, ton anniversaire arrive dans {{2}} jour(s) ! 🎉 Crée ton compte sur Joie de Vivre pour recevoir des cadeaux de tes proches et gérer ta liste de souhaits.` |
| **Footer** | `JOIE DE VIVRE - Célébrons ensemble` |
| **Bouton CTA** | Type : URL statique — Texte : `Créer mon compte` — URL : `https://joiedevivre-africa.com/auth?utm_source=whatsapp&utm_medium=birthday_countdown` |
| **Paramètres body** | `{{1}}` = Prénom contact, `{{2}}` = Nombre de jours |

### 2. Modifier `supabase/functions/birthday-wishes/index.ts`

**Lignes 344-351** : Remplacer l'envoi du template pour les contacts non-inscrits par `joiedevivre_birthday_countdown_invite` avec un CTA statique (pas de suffix dynamique) :

```typescript
await sendWhatsAppTemplate(
  contact.phone,
  'joiedevivre_birthday_countdown_invite',
  'fr',
  [contactName, String(daysUntil)],
  undefined, // CTA statique dans Meta, pas de suffix
  countdownImageUrl
);
```

### 3. Ajouter au monitoring

Ajouter `"joiedevivre_birthday_countdown_invite"` dans `KNOWN_TEMPLATES` de `check-whatsapp-template-health/index.ts`.

### 4. Mettre à jour la documentation

- `.lovable/memory/whatsapp-messaging-strategy.md` — ajouter le nouveau template
- `.lovable/memory/features/birthday-celebration-flow.md` — noter la distinction inscrit/non-inscrit

## Fichiers modifiés

- `supabase/functions/birthday-wishes/index.ts`
- `supabase/functions/check-whatsapp-template-health/index.ts`
- `.lovable/memory/whatsapp-messaging-strategy.md`
- `.lovable/memory/features/birthday-celebration-flow.md`

