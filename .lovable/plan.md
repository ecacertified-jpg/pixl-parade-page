

## Diagnostic actuel — Template A

Les logs DB confirment que **le correctif appliqué hier fonctionne** :

| Date | Body params | Status |
|---|---|---|
| 2026-04-18 (avant fix) | `[Nowa, Esperando, 30, esperando-2026]` (4 params) | ❌ `failed` — `(#132000) Number of parameters does not match` |
| 2026-04-19 (après fix) | `[Laeticia, Zossou, 3]` (3 params) | ✅ `sent` |

Le cron quotidien `birthday-wishes` qui tourne à 00:01 UTC a déjà envoyé 3 invitations Template A avec succès aujourd'hui pour la page `zossou-2026` (J-3 anniversaire).

## Test d'invocation live

Pour valider de bout en bout je vais :

1. **Invoquer manuellement `birthday-wishes`** via `supabase--curl_edge_functions` (POST sans body, fonction publique).
2. **Vérifier les logs Edge Function** : recherche des marqueurs `[FriendInvite] ✅ Sent to ...`.
3. **Vérifier la DB** : nouveaux enregistrements dans `whatsapp_template_logs` pour `joiedevivre_birthday_page_invite` avec `status='sent'` et exactement 3 body params.
4. **Confirmer le format du bouton** : `button_params=[<slug>]` → URL finale `https://joiedevivre-africa.com/birthday/<slug>`.

### Critères de succès

- ✅ Au moins 1 nouvelle ligne `status='sent'` créée pendant le test (ou aucune si dédup déjà déclenchée — ce qui est aussi un succès).
- ✅ Aucune nouvelle erreur `(#132000)`.
- ✅ Format body : `[recipientFirstName, celebratedFirstName, daysUntil]` (3 éléments).
- ✅ Format bouton : `[slug]` (1 élément).

### Si problème détecté

- Si `(#132000)` réapparaît → vérifier que le redéploiement de `birthday-wishes` a bien pris en compte la version corrigée du fichier.
- Si erreur sur le bouton → vérifier dans Meta Business Manager que le template a bien 1 paramètre URL dynamique configuré.

