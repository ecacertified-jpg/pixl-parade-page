
## Tableau de bord Admin - Statistiques OTP WhatsApp

### Objectif
Creer une page d'administration dediee aux statistiques OTP WhatsApp, accessible depuis le menu lateral admin, pour visualiser le taux de succes, le temps moyen de verification et la repartition par pays.

### Architecture

**1. Page admin : `src/pages/Admin/WhatsAppOtpAnalytics.tsx`**
- Utilise `AdminLayout`, `AdminPageHeader`, et `AdminCountryRestrictionAlert` (meme pattern que IndexNowAnalytics)
- Filtre par periode (7j, 30j, 90j)
- Compatible avec le systeme de filtre par pays existant

**2. Hook de donnees : `src/hooks/useWhatsAppOtpStats.ts`**
- Requete la table `whatsapp_otp_codes` pour calculer :
  - Total d'OTP envoyes
  - Total verifies (verified_at IS NOT NULL)
  - Taux de succes (verifies / envoyes)
  - Temps moyen de verification (verified_at - created_at)
  - Tentatives moyennes avant succes
  - Repartition par prefixe telephonique (pays)
  - Evolution quotidienne sur la periode
- Utilise TanStack Query pour le cache

**3. Composant dashboard : `src/components/admin/WhatsAppOtpDashboard.tsx`**
- **KPI Cards** (4 cartes) :
  - Total OTP envoyes
  - Taux de verification (%)
  - Temps moyen de verification (secondes)
  - OTP expires (non verifies apres expiration)
- **Graphique AreaChart** : evolution quotidienne envois vs verifications (Recharts)
- **PieChart** : repartition par pays (CI, BJ, SN, TG, ML, BF)
- **Tableau detaille** : derniers OTP avec statut, temps de verification, pays

**4. Integration dans le systeme existant**

Fichiers a modifier :
- `src/App.tsx` : ajouter la route `/admin/whatsapp-otp`
- `src/components/AdminLayout.tsx` : ajouter l'entree menu "Stats WhatsApp OTP" avec l'icone `MessageSquare`

Fichiers a creer :
- `src/pages/Admin/WhatsAppOtpAnalytics.tsx`
- `src/hooks/useWhatsAppOtpStats.ts`
- `src/components/admin/WhatsAppOtpDashboard.tsx`

### Mapping pays par prefixe telephonique

| Prefixe | Pays | Drapeau |
|---------|------|---------|
| +225 | Cote d'Ivoire | CI |
| +229 | Benin | BJ |
| +221 | Senegal | SN |
| +228 | Togo | TG |
| +223 | Mali | ML |
| +226 | Burkina Faso | BF |

### Details techniques

- Pas de migration SQL necessaire : toutes les donnees existent deja dans `whatsapp_otp_codes`
- Le calcul du temps de verification utilise `verified_at - created_at` en secondes
- Le taux d'expiration se calcule via `expires_at < now() AND verified_at IS NULL`
- Le filtre pays utilise `substring(phone, 1, 4)` pour extraire le prefixe
- RLS : la table est accessible via service_role dans les Edge Functions ; cote client, on utilisera une RPC ou une politique de lecture admin
- Si la RLS bloque les requetes cote client, une fonction RPC `get_whatsapp_otp_stats` sera creee pour agreger les donnees cote serveur

### Securite
- Page accessible uniquement aux admins via `AdminRoute`
- Pas d'exposition des codes OTP dans le tableau (seulement statut et metadata)
