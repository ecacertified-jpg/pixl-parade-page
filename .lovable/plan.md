

## Préparer le template `joiedevivre_birthday_friend_alert` pour envoi fiable

### Problemes identifiés dans le code actuel (lignes 320-392 de `birthday-reminder-with-suggestions/index.ts`)

1. **`formatPhoneForTwilio` non importé** — utilisé ligne 360 mais absent des imports (ligne 3)
2. **Pas de header image** — le template Meta attend une image (visible sur le screenshot) mais `headerImageUrl` n'est jamais passé
3. **Pas de déduplication** — aucun enregistrement dans `birthday_contact_alerts`, donc les mêmes amis reçoivent le message chaque jour pendant 7 jours
4. **`contributorIds` calculé mais jamais utilisé** — les contributeurs existants de la cagnotte ne sont pas exclus ni notifiés séparément
5. **Pas de fallback SMS** — seuls les contacts WhatsApp sont notifiés, les autres sont ignorés silencieusement
6. **Pas de notification aux utilisateurs inscrits** — seuls les contacts (carnet d'adresses) sont ciblés, pas les utilisateurs de la plateforme qui ont le bénéficiaire dans leurs contacts

### Corrections prévues

#### 1. Ajouter `formatPhoneForTwilio` aux imports (ligne 3)

#### 2. Passer `headerImageUrl` au template
Utiliser une variable d'environnement `BIRTHDAY_FRIEND_ALERT_IMAGE_URL` avec fallback vers une image par défaut dans Supabase Storage.

#### 3. Déduplication via `birthday_contact_alerts`
Avant d'envoyer, vérifier si un alert `friend_birthday_alert` existe déjà pour ce `contact_id` + `contact_phone` + même période (today). Enregistrer chaque envoi après succès.

#### 4. Notifier aussi les utilisateurs inscrits
Chercher les profils qui ont le bénéficiaire dans leurs contacts (via la table `contacts` en reverse — trouver tous les `user_id` qui ont un contact avec le même téléphone ou nom que le bénéficiaire). Récupérer leurs téléphones depuis `profiles`.

#### 5. Fallback SMS pour les canaux non-WhatsApp
Si `getPreferredChannel` retourne `'sms'`, envoyer un SMS texte avec le même contenu.

#### 6. Nettoyer le code mort (`contributorIds`)

### Fichier modifié

| Fichier | Action |
|---------|--------|
| `supabase/functions/birthday-reminder-with-suggestions/index.ts` | Modifier — lignes 3 et 320-392 |

