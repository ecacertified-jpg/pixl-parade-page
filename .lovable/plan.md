

# Fallback texte libre pour `joiedevivre_fund_completed`

## Modification

**Fichier** : `supabase/functions/notify-fund-ready/index.ts`

1. **Ajouter `sendWhatsApp`** à l'import depuis `_shared/sms-sender.ts`
2. **Dans `notifyFriend()`**, quand `waResult.success === false`, tenter un envoi texte libre via `sendWhatsApp` avec un message de félicitations formaté :

```typescript
if (waResult.success) {
  sentPhones.add(normalizedPhone);
  friendWaSent++;
} else {
  // Fallback: texte libre
  const fallbackMsg = `🎉 Félicitations ${recipientName} ! La cagnotte "${fundTitle}" pour ${beneficiaryName} a atteint son objectif de ${fundAmount} FCFA ! Voir : https://joiedevivre-africa.com/f/${fund_id}`;
  const fallbackResult = await sendWhatsApp(profile.phone, fallbackMsg);
  if (fallbackResult.success) {
    sentPhones.add(normalizedPhone);
    friendWaSent++;
    console.log(`📱 Fund completed WA fallback -> ${source} ${profile.user_id}: ✅`);
  } else {
    friendWaFailed++;
    console.error(`❌ Fund completed WA template+fallback -> ${source} ${profile.user_id}: template=${waResult.error}, fallback=${fallbackResult.error}`);
  }
}
```

3. **Même logique dans le `catch`** : tenter le fallback texte libre avant d'abandonner

## Note importante

Le fallback texte libre (`sendWhatsApp`) ne fonctionne que si le destinataire a envoyé un message dans les dernières 24h (fenêtre de conversation Meta). Si ce n'est pas le cas, le fallback échouera aussi — mais au moins on tente les deux voies et les logs seront explicites.

## Déploiement

Redéployer `notify-fund-ready` après la modification.

