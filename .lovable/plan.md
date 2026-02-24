
Objectif: rétablir une inscription téléphone fiable (surtout pour les pays hors CI) en corrigeant la cause serveur du blocage et en alignant le parcours Business avec le fallback WhatsApp déjà présent côté Client.

## Diagnostic confirmé (cause principale)

Le blocage montré sur la capture (“Database error saving new user”) est cohérent avec une incohérence SQL en production:

- La fonction trigger `create_default_contact_alert_preferences()` insère encore la colonne `alert_10_days`.
- Or la table `contact_alert_preferences` ne contient plus `alert_10_days` (elle a été remplacée par `alert_30_days`, `alert_21_days`, `alert_14_days`, `alert_7_days`).
- Cette fonction est appelée automatiquement après création d’un profil (`AFTER INSERT ON profiles`), donc toute création de nouvel utilisateur peut échouer avec une erreur base de données.
- Ce bug explique bien un échec “au clic” sur “Continuer - Vérifier mon numéro”, avant même la fin du flow OTP.

Contexte aggravant identifié:
- Sur `/business-auth`, le flow téléphone est SMS-only aujourd’hui.
- Pour le Bénin (`+229`), la config pays marque SMS comme `unavailable` (fallback WhatsApp recommandé), mais ce fallback n’est pas implémenté dans `BusinessAuth.tsx` contrairement à `Auth.tsx`.

## Plan d’implémentation proposé

### 1) Hotfix base de données (priorité critique)

Fichier à ajouter:
- `supabase/migrations/<timestamp>_fix_contact_alert_trigger_columns.sql`

Actions:
- Mettre à jour `create_default_contact_alert_preferences()` pour insérer les bonnes colonnes actuelles:
  - `alert_30_days`, `alert_21_days`, `alert_14_days`, `alert_7_days`, `alert_5_days`, `alert_3_days`, `alert_2_days`, `alert_1_day`, `alert_day_of`.
- Garder `ON CONFLICT (user_id) DO NOTHING`.
- Conserver les defaults cohérents avec le hook frontend (`useContactAlertPreferences`).
- Ajouter un backfill idempotent pour les profils existants sans préférences.

Résultat attendu:
- La création de nouveaux users ne casse plus sur trigger `profiles`.

### 2) Renforcer la résilience du trigger (anti-régression)

Dans la même migration:
- Encapsuler l’insert de préférences dans un bloc `EXCEPTION` local (avec `RAISE WARNING`) afin qu’une erreur non critique de préférences ne bloque jamais la création de compte.
- Conserver le trigger actif mais “non bloquant” pour ce sous-processus.

Pourquoi:
- L’inscription doit rester prioritaire; les préférences peuvent être backfillées ensuite.

### 3) Ajouter le fallback WhatsApp dans `BusinessAuth.tsx`

Fichier à modifier:
- `src/pages/BusinessAuth.tsx`

Actions:
- Importer et utiliser `OtpMethodSelector` + `useWhatsAppFallback` (même logique que `Auth.tsx`).
- Ajouter état `otpMethod` + éventuelle donnée pending.
- Refactor léger pour centraliser l’envoi OTP:
  - `sendSmsOtp(...)` (actuel `signInWithOtp`)
  - `sendWhatsAppOtp(...)` (appel Edge Function `send-whatsapp-otp`)
- Au submit (signin/signup), si pays fallback:
  - afficher sélecteur méthode;
  - forcer WhatsApp si SMS indisponible.
- Adapter la vérification OTP:
  - SMS -> `supabase.auth.verifyOtp` (comme aujourd’hui)
  - WhatsApp -> `verify-whatsapp-otp`, puis `supabase.auth.setSession(...)`
- Réutiliser la logique existante post-auth (création business account en signup, redirection en signin).
- Adapter “Renvoyer code” pour renvoyer via la méthode choisie (pas toujours SMS).

Résultat attendu:
- Un vendeur au Bénin/Togo/Mali/Burkina peut finaliser une inscription téléphone via WhatsApp sans dépendre du SMS.

### 4) Messages d’erreur plus utiles côté UI (Business + Client)

Fichiers à modifier:
- `src/pages/BusinessAuth.tsx`
- (optionnel mais recommandé) `src/pages/Auth.tsx`

Actions:
- Mapper les erreurs techniques Supabase en messages clairs:
  - `Database error saving new user` -> “Inscription temporairement indisponible, veuillez réessayer dans quelques instants.”
  - log technique en console pour debug.
- Afficher un CTA “Essayer via WhatsApp” quand SMS échoue dans les pays fallback.

### 5) Vérification fonctionnelle end-to-end

Tests à exécuter après implémentation:

1. **Test critique E2E (mobile)**
   - `/business-auth?tab=signup`
   - Pays `+229`
   - Méthode WhatsApp
   - Vérifier: plus d’erreur “Database error saving new user”, OTP reçu, compte créé.

2. Signup téléphone CI (`+225`) via SMS
   - Vérifier que le flow SMS existant continue de fonctionner.

3. Signup client `/auth` en pays fallback
   - Vérifier non-régression du flow WhatsApp existant.

4. Vérification DB post-signup
   - Nouveau `auth.users`
   - Nouveau `profiles`
   - Nouveau `contact_alert_preferences` avec colonnes modernes remplies.

5. Vérifier logs
   - Aucune erreur trigger liée à `alert_10_days`.

## Fichiers impactés (prévision)

- `supabase/migrations/<timestamp>_fix_contact_alert_trigger_columns.sql` (nouveau)
- `src/pages/BusinessAuth.tsx` (fallback WhatsApp + resend + verify branch)
- Optionnel:
  - `src/pages/Auth.tsx` (amélioration copy d’erreur)
  - `src/components/auth/OtpMethodSelector.tsx` (seulement si ajustement UX mineur nécessaire)

## Risques et mitigation

- Risque: casser le flow OTP Business actuel en refactor.
  - Mitigation: garder la branche SMS existante inchangée et ajouter la branche WhatsApp en parallèle.
- Risque: régression trigger DB.
  - Mitigation: migration idempotente + test de création user immédiat + vérif des colonnes.
- Risque: incohérence de session après vérif WhatsApp.
  - Mitigation: reprendre le pattern déjà stable de `Auth.tsx` (`setSession` depuis `verify-whatsapp-otp`).

## Critères d’acceptation

- Plus aucune erreur “Database error saving new user” lors des inscriptions téléphone.
- Inscription Business par téléphone réussie en `+229` via WhatsApp.
- Les nouveaux comptes créent bien `profiles` + `contact_alert_preferences`.
- Les flows existants email/SMS continuent de fonctionner sans régression.
