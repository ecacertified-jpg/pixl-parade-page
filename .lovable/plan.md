
## Objectif

Transformer le formulaire d'inscription multi-champs (Auth.tsx) en un parcours immersif et émotionnel intégré dans `PreAuthDiscovery.tsx`. L'utilisateur ne verra plus jamais un grand formulaire : il avancera étape par étape, et l'inscription se fera silencieusement à la dernière étape avec uniquement OTP téléphone (pré-rempli) **ou** Google.

## Nouvelle structure du parcours (10 écrans)

| # | Écran | Source | Type |
|---|-------|--------|------|
| 0 | "Imagine que tous tes proches se réunissent..." | conservé | Émotion |
| 1 | **"C'est quand ton anniversaire ?"** (NOUVEAU — remplace "C'est pour...") | `BirthdayPicker` du formulaire | Champ → `birthday` |
| 2 | "L'évènement, c'est..." | conservé | Quiz `timing` |
| 3 | "Ce qui te ferait le plus plaisir" | conservé | Quiz `desire` |
| 4 | **"À quel lieu veux-tu que la livraison de ton cadeau soit faite ?"** (NOUVEAU) | `AddressSelector` (pays + ville/commune + quartier) | Champ → `city` |
| 5 | **"Sur quel numéro de téléphone es-tu joignable ?"** (NOUVEAU) | sélecteur indicatif + `Input` téléphone | Champ → `phone` + `countryCode` |
| 6 | **"Quel prénom aimes-tu que tes proches t'appellent ?"** (NOUVEAU) | `Input` | Champ → `firstName` |
| 7 | "Combien de proches veux-tu réunir ?" | conservé | Quiz `guest_count` |
| 8 | Projection animée (messages + cagnotte) | conservé | Récap |
| 9 | **Inscription finale** : 2 boutons exclusifs | NOUVEAU | Action |

**Écran 9 — Action finale** (au lieu du bouton générique actuel) :
- **Bouton 1 — "Recevoir mon code de vérification"** → affiche le numéro pré-rempli (lecture seule, modifiable via lien "Modifier") puis appelle `sendOtpSignUp` avec toutes les données collectées (firstName, birthday, city, phone, countryCode). Bascule ensuite vers l'écran OTP existant.
- **Séparateur "ou"**
- **Bouton 2 — "S'inscrire avec Google"** → appelle `signInWithGoogle()`.
- Lien discret "Peut-être plus tard" pour fermer.

## Implémentation technique

### `src/components/PreAuthDiscovery.tsx`

1. **Étendre `DiscoveryAnswers`** avec les nouveaux champs :
   ```ts
   interface DiscoveryAnswers {
     birthday?: string;        // 'YYYY-MM-DD' (étape 1)
     timing?: string;
     desire?: string;
     city?: string;            // adresse complète (étape 4)
     phone?: string;           // 10 chiffres (étape 5)
     countryCode?: string;     // '+225' etc. (étape 5)
     firstName?: string;       // étape 6
     guest_count?: string;
   }
   ```
2. **Supprimer** la question `purpose` ("C'est pour..."). Ne pas re-router selon le type de page (cette logique du `localStorage 'bp_type_*'` peut rester — par défaut `self`).
3. **Restructurer le state machine** : passer de 7 à 10 étapes. Renuméroter les conditions (`step === 0` émotion, `step === 8` projection, `step === 9` action). Utiliser un tableau de descripteurs d'étape pour la navigation et la barre de progression (10 segments).
4. **Créer 4 nouveaux écrans de saisie** dans le même rendu, chacun avec :
   - Titre incitatif gros (Poppins) + sous-titre court (Nunito)
   - Un seul champ visible, large, centré
   - Bouton "Continuer" désactivé tant que la valeur n'est pas valide (validation Zod par étape)
   - Animation slide identique aux quiz
   - Micro-encouragement après saisie (ex. après ville : "Parfait, tes proches sauront où t'envoyer leur amour 💝")
5. **Réutiliser les composants existants** :
   - `BirthdayPicker` (étape 1)
   - `AddressSelector` avec `label="Lieu de livraison"`, `cityLabel="Ville / Commune"`, `neighborhoodLabel="Quartier (optionnel)"` (étape 4)
   - Sélecteur d'indicatif `+225/+221/...` issu de `getAllCountries()` + `Input` téléphone (étape 5)
   - `Input` simple (étape 6)
6. **Persister** les réponses dans `localStorage` (`jdv_discovery_answers`) à chaque étape (déjà fait pour les quiz — étendre).
7. **Étape 9** : recevoir 2 nouvelles props :
   ```ts
   onSubmitPhoneSignup: (data: { firstName, birthday, city, phone, countryCode }) => Promise<void>
   onSubmitGoogleSignup: () => Promise<void>
   ```

### `src/pages/Auth.tsx`

1. **Brancher les nouvelles props** sur `<PreAuthDiscovery />` (lignes ~1900-1910) :
   - `onSubmitPhoneSignup` → préremplit `signUpForm` avec les valeurs collectées puis appelle `sendOtpSignUp(values, false)`. Le flux OTP existant prend ensuite le relais (modal de vérification, `verifyOtp`, création du compte avec metadata `first_name/birthday/city/phone`).
   - `onSubmitGoogleSignup` → appelle `signInWithGoogle()` (avec les valeurs collectées stockées en localStorage `pendingSignupMetadata`, lues côté callback Google pour compléter le profil).
2. **Supprimer le formulaire long** de l'onglet "S'inscrire" (lignes ~1565-1805) : ne conserver que la version "expérience" (le `PreAuthDiscovery` plein écran). L'onglet "S'inscrire" devient un simple écran qui auto-lance le `PreAuthDiscovery`.
3. **Conserver intacts** :
   - L'onglet "Se connecter" (Google + téléphone OTP) — inchangé
   - Tous les schémas Zod (`signUpSchema`), `sendOtpSignUp`, `verifyOtp`, `signInWithGoogle`, la détection de doublons, le `DuplicateAccountModal`
   - Les composants `PhoneSignupProgress` et `EmailSignupProgress` (devenus inutiles → à supprimer pour nettoyer)
4. **Méthode email + mot de passe** : retirée du parcours d'inscription (l'utilisateur a 2 chemins : OTP téléphone ou Google, comme demandé). La connexion email reste possible côté "Se connecter" pour les comptes existants.

### Validations par étape (Zod inline)
- birthday : date < aujourd'hui, âge > 5 ans
- city : non vide
- phone : `/^[0-9]{10}$/`
- firstName : min 1, max 50, trim

### Encouragements micro (exemples)
- Après anniversaire : "On a noté ! On te préparera quelque chose de spécial 🎂"
- Après adresse : "Top, tes proches sauront où envoyer leurs cadeaux 📍"
- Après téléphone : "On gardera ça en sécurité 🔒"
- Après prénom : "Enchanté(e), {firstName} ! ✨"

## Fichiers modifiés

- `src/components/PreAuthDiscovery.tsx` — restructuration majeure (10 étapes, nouveaux champs, écran final dual)
- `src/pages/Auth.tsx` — suppression du long formulaire signup, branchement des callbacks, nettoyage `PhoneSignupProgress`/`EmailSignupProgress`/schémas email
- (Aucune migration DB, aucune nouvelle dépendance)

## Ce qui reste inchangé
- Backend OTP (WhatsApp/SMS), edge functions, RLS, Google OAuth
- Onglet "Se connecter"
- Détection de doublons et `DuplicateAccountModal`
- Tous les hooks et la suite du parcours post-inscription (onboarding interne)
