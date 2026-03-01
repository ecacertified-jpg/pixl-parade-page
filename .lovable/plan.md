

# Bouton "Renvoyer OTP" dans le tableau admin

## Objectif

Ajouter une colonne "Actions" dans le tableau des derniers OTP avec un bouton "Renvoyer" permettant a l'admin de re-declencher l'envoi d'un OTP WhatsApp vers un numero qui n'a pas recu le message (statut failed, accepted, ou sent -- mais pas "verified").

## Approche

Creer une nouvelle Edge Function dediee `admin-resend-otp` qui :
- Verifie que l'appelant est admin
- Accepte un `phone` et genere un nouveau code OTP
- Envoie via WhatsApp (reutilise la meme logique que `send-whatsapp-otp`)
- Ne subit pas le rate-limit de 60s (action admin)

Cote frontend, ajouter un bouton avec icone dans chaque ligne du tableau, desactive pour les OTP deja verifies.

## Modifications

### 1. Nouvelle Edge Function `supabase/functions/admin-resend-otp/index.ts`

- Verifie le JWT et le role admin via `admin_users`
- Accepte `{ phone: string }` en body
- Genere un nouveau code OTP 6 chiffres
- Insere dans `whatsapp_otp_codes` avec `purpose: 'signin'`
- Envoie via l'API WhatsApp (template HSM puis fallback texte)
- Stocke le `whatsapp_message_id` et log dans `whatsapp_template_logs`
- Retourne `{ success: true }` ou une erreur

### 2. Mise a jour `supabase/config.toml`

Ajouter :
```toml
[functions.admin-resend-otp]
verify_jwt = false
```

(La verification admin se fait dans le code de la fonction)

### 3. Mise a jour `src/components/admin/WhatsAppOtpDashboard.tsx`

- Ajouter une colonne "Actions" en derniere position dans le `TableHeader`
- Pour chaque ligne, afficher un bouton icone `RotateCw` (ou `RefreshCw`) :
  - **Desactive** si `status === 'verified'`
  - **Avec etat de chargement** (spinner) pendant l'appel
  - Au clic : appelle `admin-resend-otp` via `fetch` direct avec le token de l'admin
  - Toast de succes ou d'erreur via `sonner`
- Mettre a jour `colSpan` de 7 a 8 pour la ligne vide
- Ajouter un state local `resendingId` pour tracker quel OTP est en cours de renvoi

### 4. Mise a jour `src/hooks/useWhatsAppOtpStats.ts`

Aucun changement au hook. On utilisera `queryClient.invalidateQueries` apres un renvoi reussi pour rafraichir les donnees.

## Details techniques

**Edge Function** -- logique cle :
```text
1. Extraire le JWT du header Authorization
2. Verifier le user dans admin_users (is_active = true)
3. Valider le numero de telephone
4. Generer un nouveau code OTP
5. Inserer dans whatsapp_otp_codes
6. Envoyer via API Meta WhatsApp
7. Mettre a jour le message_id et delivery_status
8. Retourner le resultat
```

**Bouton UI** -- conditions d'affichage :
- Visible pour tous les OTP
- Desactive si `status === 'verified'` (inutile de renvoyer)
- Tooltip "Renvoyer le code OTP" au survol
- Icone `RefreshCw` avec spinner pendant l'envoi

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/admin-resend-otp/index.ts` | Nouveau -- Edge Function de renvoi admin |
| `supabase/config.toml` | Ajout de la config pour `admin-resend-otp` |
| `src/components/admin/WhatsAppOtpDashboard.tsx` | Ajout colonne "Actions" + bouton "Renvoyer" |

