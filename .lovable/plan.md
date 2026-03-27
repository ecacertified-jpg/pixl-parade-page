

# Plan : Corriger les parametres du template `joiedevivre_contribution_reminder`

## Probleme

Le template Meta attend **4 parametres body** :
- `{{1}}` = Nom du destinataire (ex: "Aminata")
- `{{2}}` = Titre de la cagnotte (ex: "Anniversaire")
- `{{3}}` = Nom du beneficiaire (ex: "Francoise")
- `{{4}}` = Nombre de jours restants (ex: "7")

Le code n'envoie que **2 parametres** : `[fund.title, remaining XOF]`. Cela provoque une erreur `#132000` (parameter count mismatch) de Meta.

De plus, le CTA est "Contribuer maintenant" (pas "Voir la cagnotte") -- le `buttonParameters` avec `share_token` reste correct car c'est un suffixe d'URL dynamique.

## Correction

### Fichier : `supabase/functions/check-fund-contribution-reminders/index.ts`

**Lignes 232-242** -- Recalculer `daysRemaining` et envoyer les 4 parametres corrects :

```typescript
if (channel === 'whatsapp') {
  const remaining = fund.target_amount - fund.current_amount;
  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(fund.deadline_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));
  
  // Get target user's name for {{1}}
  let targetName = 'Ami(e)';
  if (reminder.target_user_id) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('user_id', reminder.target_user_id)
      .single();
    if (targetProfile?.first_name) targetName = targetProfile.first_name;
  }
  
  sendResult = await sendWhatsAppTemplate(
    formattedPhone,
    'joiedevivre_contribution_reminder',
    'fr',
    [targetName, fund.title || 'Cagnotte', beneficiaryName, String(daysRemaining)],
    [fund.share_token]
  );
  // ... fallback unchanged
}
```

Les 4 parametres correspondent maintenant exactement au template Meta :
- `{{1}}` = targetName ("Aminata")
- `{{2}}` = fund.title ("Anniversaire")
- `{{3}}` = beneficiaryName ("Francoise")
- `{{4}}` = daysRemaining ("7")

## Fichier modifie

- `supabase/functions/check-fund-contribution-reminders/index.ts` -- correction des parametres body (2 -> 4)

