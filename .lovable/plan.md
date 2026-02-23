
# Ajouter une alerte email au monitoring OTP WhatsApp

## Objectif
Quand le taux de succes OTP descend sous le seuil critique, envoyer un email aux super admins en plus de la notification admin existante.

## Approche
Modifier la Edge Function `check-whatsapp-otp-health` pour :
1. Importer Resend et recuperer `RESEND_API_KEY` (deja configure dans les secrets Supabase)
2. Recuperer les emails des admins actifs (meme pattern que `notify-kpi-alerts`)
3. Envoyer un email critique avec les stats OTP quand l'alerte est declenchee

Le pattern existant dans `notify-kpi-alerts` sera reutilise : lecture des admins actifs, respect des preferences de notification, envoi via Resend depuis `noreply@joiedevivre-africa.com`.

## Modifications

### Fichier modifie : `supabase/functions/check-whatsapp-otp-health/index.ts`

Apres l'insertion dans `admin_notifications` (etape 6 actuelle), ajouter :

1. **Import Resend** en haut du fichier
2. **Recuperation des admins** : requete sur `admin_users` avec `is_active = true` et role `super_admin` ou `admin`, puis lecture de l'email via `auth.admin.getUserById` ou `email_override` depuis `admin_report_preferences`
3. **Construction de l'email HTML** : template professionnel avec fond rouge critique, stats OTP (taux actuel, seuil, nombre envoyes/verifies, periode), et bouton CTA vers `/admin/whatsapp-otp`
4. **Envoi via Resend** depuis `noreply@joiedevivre-africa.com` avec sujet `[CRITIQUE] Alerte OTP WhatsApp - Taux de succes bas`
5. **Log du resultat** et ajout de `email_sent: true/false` dans le rapport de retour

L'email ne sera envoye que lorsque l'alerte admin est creee (meme condition anti-spam et volume minimum). Si Resend echoue, l'erreur est loguee mais ne bloque pas la reponse (la notification admin reste creee).

## Details techniques

**Template email** :
- Header rouge (`#dc2626`) avec icone d'alerte
- Tableau avec : taux actuel, seuil configure, OTP envoyes, OTP verifies, periode
- Bouton CTA vers le dashboard WhatsApp OTP
- Footer avec mention de configuration des preferences

**Gestion d'erreur** : l'envoi email est dans un try/catch separe pour ne pas impacter la notification admin si Resend echoue.

**Pas de nouvelle migration SQL** ni de nouveau secret necessaire -- `RESEND_API_KEY` est deja configure.
