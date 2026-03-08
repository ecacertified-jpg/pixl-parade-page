
# Alerte anniversaire aux proches SANS cagnotte

## Implémenté ✅

**Fichier** : `supabase/functions/birthday-reminder-with-suggestions/index.ts`

Ajout d'un bloc `else if (!hasActiveFund && daysUntilBirthday <= 7)` qui :
1. Envoie un message texte libre WhatsApp (ou SMS fallback) aux proches
2. Message : "🎂 L'anniversaire de {nom} est {dans X jours / demain} ! Offrez-lui un cadeau mémorable sur joiedevivre-africa.com 🎁"
3. Déduplication via `birthday_contact_alerts` avec `alert_type: 'friend_birthday_alert_no_fund'`
4. Même logique de collecte des destinataires (contacts directs + reverse lookup)

## Note
Le texte libre WhatsApp ne fonctionne que dans la fenêtre de 24h. Un template HSM `joiedevivre_birthday_no_fund_alert` pourra être créé ultérieurement sur Meta pour les envois hors fenêtre.
