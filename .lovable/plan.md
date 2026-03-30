

# Plan : Tester l'envoi du template `joiedevivre_contribution_reminder`

## Analyse du template Meta (captures)

- **Header** : Aucun (pas d'image)
- **Body** : 4 variables — `{{1}}` destinataire, `{{2}}` titre cagnotte, `{{3}}` beneficiaire, `{{4}}` jours restants
- **Bouton CTA** : "Contribuer maintenant" — URL dynamique `https://joiedevivre-africa.com/c/{{1}}`

## Verification du code existant

Le code dans `check-fund-contribution-reminders/index.ts` (lignes 250-256) envoie correctement :
- `body_params`: `[targetName, fundTitle, beneficiaryName, daysRemaining]` (4 params)
- `button_params`: `[fund.share_token]` (suffixe dynamique pour `/c/`)
- Pas de header image (conforme au template)

Aucune correction necessaire.

## Action : Test via `test-whatsapp-send`

Envoyer un test au numero verifie `+2250708895257` (Francoise) avec :
- `template`: `joiedevivre_contribution_reminder`
- `body_params`: `["Françoise", "Anniversaire", "Koffi", "7"]`
- `button_params`: `["abc123def"]`
- Pas de `header_image_url`

Puis verifier dans `whatsapp_template_logs` que le template est bien logge.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Aucun | Test d'envoi uniquement via `curl_edge_functions` |

