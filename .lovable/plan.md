
# Auto-prioriser WhatsApp OTP dans les pays sans SMS

## Probleme actuel

Quand un utilisateur au Benin (+229), Togo (+228), Mali (+223) ou Burkina Faso (+226) s'inscrit par telephone, il doit :

1. Remplir le formulaire et cliquer "Continuer"
2. Voir apparaitre le selecteur de methode OTP
3. Constater que SMS est grise / indisponible
4. Cliquer manuellement sur WhatsApp
5. Attendre l'envoi

C'est une friction inutile puisque SMS est marque `unavailable` pour ces pays -- le seul choix possible est WhatsApp.

## Solution

### Comportement cible par pays

```text
+------------------+------------------+-------------------------------+
| Pays             | smsReliability   | Comportement                  |
+------------------+------------------+-------------------------------+
| CI (+225)        | unreliable       | Afficher selecteur (2 choix)  |
|                  | smsActuallyReliable=true                          |
+------------------+------------------+-------------------------------+
| SN (+221)        | unreliable       | Afficher selecteur (2 choix)  |
+------------------+------------------+-------------------------------+
| BJ, TG, ML, BF   | unavailable      | Auto-WhatsApp, PAS de         |
|                  |                  | selecteur, envoi direct       |
+------------------+------------------+-------------------------------+
```

### Modifications

#### 1. `useWhatsAppFallback` (OtpMethodSelector.tsx)

Ajouter un nouveau booleen `autoWhatsApp` au retour du hook :
- `true` quand `smsReliability === 'unavailable'` (BJ, TG, ML, BF)
- `false` sinon

Ajuster `showFallback` pour ne retourner `true` que quand le selecteur doit etre affiche (SMS disponible mais pas fiable). Quand SMS est `unavailable`, `showFallback = false` car on n'affiche pas le selecteur.

#### 2. `OtpMethodSelector` (OtpMethodSelector.tsx)

Quand SMS est `unavailable`, ne plus afficher le composant du tout (retourner `null`), car WhatsApp sera envoye automatiquement. Le composant ne s'affiche que quand l'utilisateur a un vrai choix a faire.

#### 3. `Auth.tsx` - Flow client

Dans `sendOtpSignIn` et `handleSignUpSubmit` :
- Si `autoWhatsApp` est `true`, definir `otpMethod` a `'whatsapp'` automatiquement et envoyer directement (pas de `setPendingFormData`, pas d'affichage du selecteur).
- Si `showFallback` est `true` et `otpMethod` est `null`, afficher le selecteur (comportement actuel pour CI/SN).
- Sinon (SMS fiable), envoyer par SMS directement.

Meme logique pour le resend.

#### 4. `BusinessAuth.tsx` - Flow business

Meme adaptation dans `sendOtpSignIn` et `sendOtpSignUp` :
- Si `autoWhatsApp`, envoyer directement par WhatsApp sans passer par le selecteur.

#### 5. Petit indicateur UX (optionnel mais recommande)

Quand `autoWhatsApp` est actif, afficher un petit bandeau informatif sous le champ telephone :
"Votre code sera envoye via WhatsApp" avec l'icone WhatsApp, pour que l'utilisateur sache a quoi s'attendre avant de soumettre.

## Fichiers impactes

- `src/components/auth/OtpMethodSelector.tsx` : hook `useWhatsAppFallback` + composant
- `src/pages/Auth.tsx` : logique d'envoi OTP (signin + signup)
- `src/pages/BusinessAuth.tsx` : logique d'envoi OTP (signin + signup)

## Resultat attendu

- BJ/TG/ML/BF : clic sur "Continuer" -> envoi WhatsApp immediat, zero etape supplementaire
- CI/SN : comportement inchange, selecteur affiche pour laisser le choix
- Pas de regression pour les pays avec SMS fiable
