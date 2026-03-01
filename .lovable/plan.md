
# Indicateur visuel de statut de livraison WhatsApp OTP

## Contexte

Le tableau "Derniers OTP" affiche actuellement un statut de verification (Verifie / Expire / En attente) mais pas le statut de livraison WhatsApp (delivered / failed / pending). Les colonnes `delivery_status`, `delivery_error`, `delivered_at` et `failed_at` existent deja dans la table `whatsapp_otp_codes` grace a la migration precedente, mais la RPC `get_whatsapp_otp_stats` ne les retourne pas.

## Modifications

### 1. Mettre a jour la RPC `get_whatsapp_otp_stats`

Ajouter les champs `delivery_status` et `delivery_error` dans la sous-requete "recent OTPs" (lignes 96-117 de la migration) :

```sql
SELECT
  id, phone, created_at, verified_at, expires_at, attempts,
  -- statut de verification existant
  CASE ... END AS status,
  verification_seconds,
  -- nouveaux champs
  COALESCE(delivery_status, 'accepted') AS delivery_status,
  delivery_error
FROM whatsapp_otp_codes
```

### 2. Mettre a jour le type `OtpRecentEntry`

Dans `src/hooks/useWhatsAppOtpStats.ts`, ajouter :

```text
delivery_status: 'accepted' | 'sent' | 'delivered' | 'failed';
delivery_error: string | null;
```

### 3. Ajouter la colonne "Livraison" dans le tableau

Dans `src/components/admin/WhatsAppOtpDashboard.tsx` :

- Ajouter un `TableHead` "Livraison" entre "Statut" et "Temps"
- Ajouter un composant `DeliveryBadge` avec des indicateurs visuels :
  - **delivered** : badge vert avec icone check -- "Livre"
  - **failed** : badge rouge avec icone X -- "Echoue" + tooltip avec `delivery_error`
  - **sent** : badge bleu avec icone fleche -- "Envoye"
  - **accepted** : badge gris avec icone horloge -- "Accepte"
- Mettre a jour le `colSpan` de la ligne vide de 6 a 7

### Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| Nouvelle migration SQL | Mettre a jour la RPC pour inclure `delivery_status` et `delivery_error` |
| `src/hooks/useWhatsAppOtpStats.ts` | Ajouter les champs au type `OtpRecentEntry` |
| `src/components/admin/WhatsAppOtpDashboard.tsx` | Ajouter colonne "Livraison" avec badge colore |
