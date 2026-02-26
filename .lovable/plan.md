

## Validation stricte des numeros de telephone avant envoi WhatsApp

### Probleme

La validation actuelle dans `sendWhatsApp` et `sendWhatsAppTemplate` est trop permissive : elle accepte tout numero de 8+ chiffres. Des numeros mal formates (ex: codes pays incomplets, numeros trop courts/longs pour leur prefixe) passent la validation et provoquent des erreurs `(#100) Invalid parameter` de l'API WhatsApp.

### Solution

Ajouter une fonction `validatePhoneForWhatsApp()` dans `sms-sender.ts` qui effectue des verifications strictes, puis l'utiliser dans `sendWhatsApp` et `sendWhatsAppTemplate` avant l'appel API.

### Fichier modifie : `supabase/functions/_shared/sms-sender.ts`

**1. Nouvelle fonction `validatePhoneForWhatsApp(phone: string): { valid: boolean; reason?: string }`**

Regles de validation apres formatage E.164 (sans le `+`) :
- Longueur minimale : 10 chiffres, maximale : 15 chiffres (norme E.164)
- Ne doit pas contenir de caracteres non-numeriques
- Validation par prefixe pays connu (Afrique de l'Ouest) :
  - `225` (Cote d'Ivoire) : total 13 chiffres (225 + 10 chiffres)
  - `221` (Senegal) : total 12 chiffres (221 + 9 chiffres)
  - `229` (Benin) : total 13 chiffres (229 + 10 chiffres)
  - `228` (Togo) : total 11 chiffres (228 + 8 chiffres)
  - `223` (Mali) : total 11 chiffres (223 + 8 chiffres)
  - `226` (Burkina) : total 11 chiffres (226 + 8 chiffres)
  - `227` (Niger) : total 11 chiffres (227 + 8 chiffres)
- Pour les prefixes non reconnus : accepter si entre 10 et 15 chiffres (fallback generique E.164)

**2. Integration dans `sendWhatsApp` et `sendWhatsAppTemplate`**

Remplacer la validation actuelle (`formattedPhone.length < 8`) par un appel a `validatePhoneForWhatsApp`. En cas d'echec, retourner une erreur avec le motif precis dans les logs :

```text
[WhatsApp] Skipping invalid phone "07123" -> reason: "CI number must be 13 digits, got 8"
```

**3. Log ameliore**

Quand la validation echoue, loguer le numero original (masque partiellement) ET la raison precise du rejet pour faciliter le debug.

### Impact

- Aucune modification frontend
- Tous les edge functions qui appellent `sendWhatsApp`/`sendWhatsAppTemplate` beneficient automatiquement de la validation renforcee
- Les numeros invalides sont filtres AVANT l'appel API, evitant les erreurs (#100) et les couts inutiles

