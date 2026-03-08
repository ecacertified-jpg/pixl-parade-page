
# Template HSM joiedevivre_birthday_no_fund_alert

## Implémenté ✅

**Fichier** : `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Remplacement de l'envoi en texte libre (`sendWhatsApp`) par le template HSM `joiedevivre_birthday_no_fund_alert` via `sendWhatsAppTemplate` :
1. 3 paramètres body : prénom bénéficiaire (`{{1}}`), dayLabel (`{{2}}`), 'JOIE DE VIVRE' (`{{3}}`)
2. Header image via `BIRTHDAY_NO_FUND_ALERT_IMAGE_URL` (fallback Supabase Storage `assets/birthday-no-fund-alert.jpg`)
3. SMS fallback conservé tel quel
4. Déduplication inchangée via `birthday_contact_alerts` avec `alert_type: 'friend_birthday_alert_no_fund'`
