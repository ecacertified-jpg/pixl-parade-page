

# Plan : Ajouter un CTA dynamique au template `joiedevivre_contribution_reminder`

## Contexte

Le template est actuellement appelé **sans `buttonParameters`** (ligne 236-241 de `check-fund-contribution-reminders/index.ts`). Le `share_token` est déjà disponible dans l'objet `fund` récupéré à la ligne 116.

La fonction `sendWhatsAppTemplate` supporte déjà les `buttonParameters` — elle les envoie comme boutons URL dynamiques avec suffixe.

## Template Meta à créer/modifier

| Champ | Valeur |
|-------|--------|
| Nom | `joiedevivre_contribution_reminder` |
| Bouton CTA | Type URL, texte `Voir la cagnotte` |
| URL | `https://joiedevivre-africa.com/c/{{1}}` |
| `{{1}}` | `share_token` de la cagnotte |

## Modification code

### Fichier : `supabase/functions/check-fund-contribution-reminders/index.ts`

**Ligne 236-241** — Ajouter `[fund.share_token]` comme 5ème argument (`buttonParameters`) :

```typescript
sendResult = await sendWhatsAppTemplate(
  formattedPhone,
  'joiedevivre_contribution_reminder',
  'fr',
  [fund.title || beneficiaryName, `${remaining.toLocaleString('fr-FR')} XOF`],
  [fund.share_token]  // CTA dynamique → /c/{share_token}
);
```

C'est la seule modification nécessaire — `sendWhatsAppTemplate` gère déjà la construction du payload bouton.

## Fichier modifié

- `supabase/functions/check-fund-contribution-reminders/index.ts` — 1 ligne ajoutée

