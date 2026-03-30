

# Plan : Validation stricte des numéros WhatsApp dans `test-whatsapp-send`

## Objectif

Ajouter une étape de validation et de pré-vérification du numéro de téléphone avant l'envoi du template, pour détecter les numéros invalides ou non-WhatsApp et retourner un diagnostic clair.

## Validations à ajouter

### 1. Validation de format (avant appel Meta)
- Nettoyer le numéro : supprimer espaces, tirets, parenthèses
- Vérifier qu'il commence par `+` ou un indicatif pays (1-3 chiffres)
- Vérifier la longueur totale (10-15 chiffres après nettoyage)
- Vérifier les indicatifs pays connus (225 = CI, 229 = BJ, 33 = FR, etc.)
- Pour les numéros CI (+225) : vérifier que la partie locale fait 10 chiffres (réforme 2021), alerter si 8 chiffres

### 2. Pré-vérification WhatsApp via Meta Contacts API
Avant d'envoyer le template, appeler l'endpoint Meta `contacts` pour vérifier si le numéro est enregistré sur WhatsApp :
```
POST https://graph.facebook.com/v18.0/{PHONE_ID}/contacts
{ "blocking": "wait", "contacts": ["+225..."] }
```
Cela retourne un `status: "valid"` ou `"invalid"` et le `wa_id` mappé.

### 3. Diagnostic enrichi dans la réponse
Retourner dans la réponse :
- `phone_validation` : résultat du nettoyage et format
- `whatsapp_check` : résultat de la pré-vérification (valid/invalid, wa_id mappé)
- `wa_id_mismatch` : alerte si le wa_id retourné diffère du numéro envoyé (problème connu CI)
- Si le numéro est invalide, ne pas envoyer le template et retourner le diagnostic directement

## Structure du code modifié

```text
1. Recevoir le payload
2. Nettoyer et valider le format du numéro
   → Si format invalide → retourner erreur 400 avec diagnostic
3. Appeler Meta Contacts API pour vérifier le numéro
   → Si "invalid" → retourner warning avec diagnostic (pas d'envoi)
   → Si wa_id ≠ input → ajouter warning de mismatch
4. Envoyer le template (logique existante inchangée)
5. Retourner résultat enrichi avec phone_validation + whatsapp_check
```

## Option skip_validation

Ajouter un paramètre optionnel `skip_validation: true` dans le payload pour forcer l'envoi sans pré-vérification (utile pour les tests de debug).

## Fichier concerné

| Fichier | Action |
|---------|--------|
| `supabase/functions/test-whatsapp-send/index.ts` | Ajouter validation format + pré-vérification Meta Contacts API |

