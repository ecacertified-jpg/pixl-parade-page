

## Problème détecté

Les logs WhatsApp confirment que **template A échoue à 100%** avec l'erreur Meta `(#132000) Number of parameters does not match the expected number of params`. Les templates B et C n'ont jamais été déclenchés mais présentent des problèmes similaires détectables visuellement.

## Diagnostic par template

### Template A — `joiedevivre_birthday_page_invite` ❌
**Capture Meta** : body contient 3 placeholders (`{{1}}` prénom destinataire, `{{2}}` prénom célébré, `{{3}}` jours).
**Code actuel** : envoie **4 body params** `[firstName, celebrated, days, slug]`.
**Correctif** : envoyer 3 params, garder le slug uniquement pour le bouton.

### Template B — `joiedevivre_birthday_page_activity` ⚠️
**Capture Meta** : body avec 3 placeholders (Nacoulma, Salimata, action). Texte hardcodé : `"vient de {{3}} sur ta page d'anniversaire"`.
**Code actuel** : envoie 3 params `[celebrated, actor, "ajouter une photo 📸"]` → résultat correct visible dans la capture ("vient de ajouter une photo").
**Status** : ✅ OK structurellement, jamais testé en réel.

### Template C — `joiedevivre_admin_fund_created` ⚠️
**Capture Meta** : body montre `"Objectif : 50 000 XOF XOF"` — double "XOF". Le template Meta a déjà " XOF" en dur après `{{4}}`.
**Code actuel** : envoie `formatAmount(target)` = `"50 000 XOF"` (avec XOF intégré via Intl).
**Correctif** : envoyer juste `"50 000"` (sans XOF).
**Bouton** : à vérifier que le template Meta a bien un bouton URL dynamique avec 1 paramètre.

## Corrections à appliquer

| Fichier | Changement |
|---|---|
| `supabase/functions/birthday-wishes/index.ts` (ligne 479) | Retirer `page.slug` des body params : `[recipient.firstName, celebratedFirstName, String(daysUntil)]` |
| `supabase/functions/notify-admins-fund-created/index.ts` | `formatAmount` : retourner uniquement le nombre formaté sans " XOF" (laisser le template Meta ajouter " XOF") |

## Plan de validation

1. Appliquer les 2 correctifs ci-dessus.
2. Redéployer les Edge Functions `birthday-wishes` et `notify-admins-fund-created`.
3. **Test Template A** : invoquer manuellement `birthday-wishes` (mode dry-run / forcé sur un profil test) et vérifier `whatsapp_template_logs` → status `sent`.
4. **Test Template B** : depuis l'UI, ajouter une photo sur la page d'anniversaire d'un autre utilisateur (compte de test). Vérifier réception WhatsApp + log.
5. **Test Template C** : créer une cagnotte de test depuis CollectiveCheckout. Vérifier que les admins (super_admin ou assignés CI) reçoivent le message + log.
6. Si Template C échoue avec `(#132000)` ou erreur bouton, ajuster selon le nombre réel de params définis dans Meta Business Manager (capture utile).

## Résultat attendu

- 100% des envois Template A passent en `status='sent'`.
- Templates B et C produisent des messages au format propre, sans doublon de devise ni paramètre manquant.

