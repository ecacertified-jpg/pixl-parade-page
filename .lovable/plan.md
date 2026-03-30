

# Plan : Tester le template `joiedevivre_fund_beneficiary_invite` et verifier le logging

## Analyse du template Meta (captures)

- **Header** : Aucun
- **Body** : 4 variables -- `{{1}}` = beneficiary name, `{{2}}` = creator name, `{{3}}` = product name, `{{4}}` = target amount
- **Footer** : JOIE DE VIVRE
- **Bouton CTA** : "Voir ma surprise" -- URL **dynamique** `https://joiedevivre-africa.com/f/{{1}}` (suffixe = fund_id)

## Correspondance code (lignes 253-258)

Le code envoie deja correctement :
- `body_params`: `[beneficiaryDisplayName, creatorName, product_name, formattedTarget]`
- `button_params`: `[fund_id]`
- Logging centralise : present (lignes 268-282)

## Etapes

### 1. Envoyer le template via `test-whatsapp-send`

Appeler la fonction Edge avec :
- `template_name`: `joiedevivre_fund_beneficiary_invite`
- `to`: numero verifie depuis la base
- `body_params`: `["Francoise", "Aminata", "Gateau d'anniversaire", "35 000"]`
- `button_params`: `["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]`
- `lang`: `fr`

### 2. Verifier `whatsapp_template_logs`

Requeter les logs recents pour confirmer que le template est correctement enregistre avec les bons parametres.

## Outils utilises

| Outil | Action |
|-------|--------|
| `supabase--curl_edge_functions` | Envoyer le template de test |
| `supabase--read_query` | Verifier les logs dans `whatsapp_template_logs` |

