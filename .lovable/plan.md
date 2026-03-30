

# Plan : Tester l'envoi du template `joiedevivre_fund_completed`

## Analyse du template Meta (captures)

- **Header** : Image (obligatoire)
- **Body** : 4 variables — `{{1}}` prenom, `{{2}}` titre cagnotte, `{{3}}` beneficiaire, `{{4}}` montant
- **Bouton CTA** : "Voir la cagnotte" — URL dynamique `https://joiedevivre-africa.com/f/{{1}}`

## Verification du code existant

Le code dans `notify-fund-ready/index.ts` (ligne 221-228) envoie deja correctement :
- `body_params`: `[recipientName, fundTitle, beneficiaryName, fundAmount]` (4 params)
- `button_params`: `[fund_id]` (suffixe dynamique pour `/f/`)
- `header_image_url`: `https://joiedevivre-africa.com/og-image.png`

Aucune correction necessaire — le code est conforme au template Meta.

## Action : Test via `test-whatsapp-send`

Envoyer un test au numero verifie `+2250708895257` (Francoise) avec :
- `template`: `joiedevivre_fund_completed`
- `body_params`: `["Françoise", "Anniversaire de Koffi", "Koffi Kouassi", "50000"]`
- `button_params`: `["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]`
- `header_image_url`: `https://joiedevivre-africa.com/og-image.png`

Puis verifier dans `whatsapp_template_logs` que l'entree est logguee avec `status = 'sent'`.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Aucun | Test d'envoi uniquement via `curl_edge_functions` |

