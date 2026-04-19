

## Diagnostic — Template `joiedevivre_admin_fund_created`

**Statut actuel** : aucun log dans `whatsapp_template_logs` → le template **n'a jamais été déclenché**. Il faut un test live.

### Vérification structurelle (code vs Meta)

| Élément | Meta (screenshots) | Code (`notify-admins-fund-created/index.ts:198-204`) | Match |
|---|---|---|---|
| Body | 5 variables `{{1}}` à `{{5}}` | `[countryLabel, creatorName, beneficiaryName, formattedAmount, occasionLabel]` (5) | ✅ |
| Bouton URL dynamique | 1 param `{{1}}` (suffixe URL) | `[fund_id]` (1) | ✅ |
| Devise | `Objectif : {{4}} XOF` (statique dans le texte) | `formattedAmount` = nombre seul (ex: `"50 000"`) | ✅ pas de double XOF |

Le `"50 000 XOF XOF"` visible sur le screenshot Meta est juste l'exemple saisi par toi dans le formulaire de test Meta, pas un défaut du code.

### Cibles disponibles

10 admins actifs avec téléphones valides (super_admins CI/BJ + moderators CI/BJ). Le filtrage par pays fonctionne : super_admins reçoivent toujours, moderators uniquement si `creator_country` est dans leur `assigned_countries`.

## Plan de test

1. **Sélectionner une cagnotte récente** via `read_query` pour obtenir un `fund_id` réel (créateur en CI ou BJ pour cibler des admins existants).
2. **Purger le log anti-doublon** pour ce fund_id afin de garantir l'envoi : `DELETE FROM admin_fund_notif_log WHERE fund_id = '<id>'` → nécessite migration (mode default).
3. **Invoquer `notify-admins-fund-created`** via `curl_edge_functions` avec `{ "fund_id": "<id>" }`.
4. **Vérifier les logs Edge Function** : recherche de `[admin-fund-created] sent=N failed=0`.
5. **Vérifier `whatsapp_template_logs`** : nouvelles lignes avec `status='sent'`, `body_params` à 5 éléments, `button_params` à 1 élément.

### Critères de succès

- ✅ `sent ≥ 1`, `failed = 0`
- ✅ Aucune erreur `(#132000)` (mismatch params)
- ✅ Bouton URL final = `https://joiedevivre-africa.com/admin/funds/<fund_id>`
- ✅ Notifications in-app créées dans `admin_notifications`

### Si échec

- `(#132000)` body → recompter params dans Meta vs code
- `(#132000)` bouton → vérifier que le template a bien 1 URL dynamique configurée
- `failed=N, sent=0` mais pas de #132000 → vérifier `WHATSAPP_PERMANENT_TOKEN` et que les téléphones cibles sont opt-in WhatsApp

