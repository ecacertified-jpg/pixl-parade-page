

## Partie 1 : Exemples d'URL pour Templates A et B

Le slug d'une page d'anniversaire suit le format `{prenom}-{annee}` (avec suffixe random en cas de collision). Le bouton CTA des templates utilise un paramètre dynamique `{{1}}` injecté dans la base URL `https://joiedevivre-africa.com/birthday/{{1}}`.

### Exemple Template A — `joiedevivre_birthday_page_invite`
Aminata invite ses amis à la page d'anniversaire de Koffi (J-7) :
- **Slug injecté** : `koffi-2026`
- **URL générée** : `https://joiedevivre-africa.com/birthday/koffi-2026`
- **Body envoyé à Aminata** :
  > Salut **Aminata** 👋  
  > L'anniversaire de **Koffi** approche : plus que **7 jour(s)** ! 🎂  
  > Sa page-souvenir est ouverte. Tu peux y ajouter 📸 une photo, 🎥 une vidéo, ✍️ un petit mot, ou 🎁 contribuer à sa cagnotte.  
  > Fais-lui une belle surprise dès maintenant 💜
- **Bouton** : "Ouvrir la page" → `https://joiedevivre-africa.com/birthday/koffi-2026`

### Exemple Template B — `joiedevivre_birthday_page_activity`
Fatou vient de poster une vidéo sur la page de Nacoulma :
- **Slug injecté** : `nacoulma-2026`
- **URL générée** : `https://joiedevivre-africa.com/birthday/nacoulma-2026`
- **Body envoyé à Nacoulma** :
  > 🎉 **Nacoulma**, **Fatou** vient de **ajouter une vidéo 🎥** sur ta page d'anniversaire !  
  > Va voir sa belle attention et remercie-le/la 💜
- **Bouton** : "Voir la page" → `https://joiedevivre-africa.com/birthday/nacoulma-2026`

---

## Partie 2 : Nouveau Template C — Notification Admin à la création d'une cagnotte

### Objectif
Dès qu'une cagnotte est créée, prévenir par WhatsApp **les admins assignés au pays du créateur** (ou tous les super_admins si pas de country_code) pour qu'ils puissent suivre la progression dans le dashboard.

### Template Meta — `joiedevivre_admin_fund_created`

- **Catégorie** : UTILITY — Langue : `fr`
- **Body** (6 paramètres) :
  > 🚨 Nouvelle cagnotte créée — **{{1}}**
  >
  > 👤 Initiateur : **{{2}}**  
  > 🎁 Bénéficiaire : **{{3}}**  
  > 🎯 Objectif : **{{4}} XOF**  
  > 📅 Occasion : **{{5}}**
  >
  > Suis sa progression depuis ton dashboard.
- **Footer** : `JOIE DE VIVRE — Admin`
- **Bouton CTA dynamique** (URL) : "Ouvrir le dashboard" → `https://joiedevivre-africa.com/admin/funds/{{1}}` (paramètre = `fund_id`)
- **Paramètres** :
  - `{{1}}` Pays (ex: "Côte d'Ivoire 🇨🇮")
  - `{{2}}` Prénom + nom de l'initiateur
  - `{{3}}` Prénom + nom du bénéficiaire (ou nom du contact non-inscrit)
  - `{{4}}` Montant cible formaté (ex: "50 000")
  - `{{5}}` Occasion (ex: "Anniversaire", "Mariage")
  - Bouton : `fund_id` UUID

### Exemple concret
Aminata (CI) crée une cagnotte de 50 000 XOF pour l'anniversaire de Koffi :
- **Body** :
  > 🚨 Nouvelle cagnotte créée — **Côte d'Ivoire 🇨🇮**  
  > 👤 Initiateur : **Aminata Diallo**  
  > 🎁 Bénéficiaire : **Koffi N'Guessan**  
  > 🎯 Objectif : **50 000 XOF**  
  > 📅 Occasion : **Anniversaire**  
  > Suis sa progression depuis ton dashboard.
- **Bouton** → `https://joiedevivre-africa.com/admin/funds/8f42b1c3-5d9e-4a7b-b2e1-9c3f4d5a6e7b`

### Implémentation code

**1. Nouvelle Edge Function `notify-admins-fund-created`**
- Reçoit `{ fund_id }`
- Charge la cagnotte (`collective_funds`) avec creator, beneficiary, target_amount, occasion
- Récupère le `country_code` du créateur via `profiles`
- Récupère les admins ciblés :
  ```sql
  SELECT au.user_id, p.first_name, p.phone, au.role, au.assigned_countries
  FROM admin_users au
  JOIN profiles p ON p.user_id = au.user_id
  WHERE au.is_active = true
    AND p.phone IS NOT NULL
    AND (
      au.role = 'super_admin'
      OR au.assigned_countries IS NULL
      OR au.assigned_countries = '{}'
      OR :creator_country = ANY(au.assigned_countries)
    )
  ```
- Pour chaque admin : `sendWhatsAppTemplate(admin.phone, 'joiedevivre_admin_fund_created', 'fr', [countryLabel, creatorName, beneficiaryName, formattedAmount, occasion], [fund_id])`
- Insertion `scheduled_notifications` in-app pour chaque admin
- Anti-spam : table `admin_fund_notif_log` (déduplication par `(fund_id, admin_user_id)`)

**2. Trigger côté client**
- Dans `src/pages/CollectiveCheckout.tsx`, après `collective_funds.insert` réussi, appeler :
  ```ts
  supabase.functions.invoke('notify-admins-fund-created', { body: { fund_id: fundData.id } });
  ```
- Fire-and-forget pour ne pas bloquer le flow utilisateur

**3. Migration SQL**
```sql
CREATE TABLE public.admin_fund_notif_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL,
  admin_user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'whatsapp',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fund_id, admin_user_id, channel)
);
ALTER TABLE public.admin_fund_notif_log ENABLE ROW LEVEL SECURITY;
-- Service-role only (aucune policy)
```

**4. Configuration**
- Déclarer `notify-admins-fund-created` dans `supabase/config.toml` avec `verify_jwt = true`
- Helper interne `getCountryLabel(code)` mappant `CI → "Côte d'Ivoire 🇨🇮"`, `BJ → "Bénin 🇧🇯"`, `SN → "Sénégal 🇸🇳"`, etc.

### Fichiers concernés

| Fichier | Changement |
|---|---|
| Migration SQL | Créer `admin_fund_notif_log` |
| `supabase/functions/notify-admins-fund-created/index.ts` | **Nouveau** — sélectionne admins par pays + envoie template C |
| `supabase/config.toml` | Déclarer la nouvelle fonction |
| `src/pages/CollectiveCheckout.tsx` | Invoquer après `collective_funds.insert` |
| `.lovable/memory/whatsapp-messaging-strategy.md` | Documenter le template C |

### Action utilisateur requise
Créer le template **`joiedevivre_admin_fund_created`** dans **Meta Business Manager** avec exactement les 6 paramètres ci-dessus + bouton URL dynamique. Approbation Meta : 24-48h.

