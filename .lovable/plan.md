

# Plan : Tester l'envoi du template `joiedevivre_birthday_friend_alert`

## Analyse du template Meta (captures)

- **Header** : Image (obligatoire)
- **Body** : 4 variables — `{{1}}` nom de la personne, `{{2}}` jours restants, `{{3}}` nom du createur de la cagnotte, `{{4}}` montant objectif
- **Bouton CTA** : "Contribuer" — URL dynamique `https://joiedevivre-africa.com/f/{{1}}`

## Verification du code existant

Le code dans `birthday-reminder-with-suggestions/index.ts` (lignes 375-387) envoie correctement :
- `body_params`: `[contact.name, daysUntilBirthday, creatorName, target_amount]` (4 params)
- `button_params`: `[activeFund.id]` (suffixe dynamique pour `/f/`)
- `header_image_url`: presente

**Probleme identifie** : Le template n'est **jamais logge** dans `whatsapp_template_logs` (0 entrees). Le logging se fait uniquement dans `birthday_contact_alerts`. Ce n'est pas un bug bloquant mais une lacune de tracabilite.

## Action : Test via `test-whatsapp-send`

Envoyer un test au numero verifie `+2250708895257` (Francoise) avec :
- `template`: `joiedevivre_birthday_friend_alert`
- `body_params`: `["Florentin", "4", "Françoise", "35000"]`
- `button_params`: `["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]`
- `header_image_url`: `https://joiedevivre-africa.com/og-image.png`

Puis verifier la reponse Meta pour confirmer le succes.

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| Aucun | Test d'envoi uniquement via `curl_edge_functions` |

