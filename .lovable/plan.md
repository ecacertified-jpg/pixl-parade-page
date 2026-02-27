

## Tableau de bord des templates WhatsApp par template et par pays

### Objectif

Creer un dashboard admin dedie au suivi des taux de succes des envois WhatsApp ventiles par **nom de template** et par **pays** (prefixe telephonique), avec KPIs globaux, graphiques et tableaux detailles.

### Architecture

Le dashboard existant (`/admin/messaging-delivery`) agrege les donnees de `birthday_contact_alerts` uniquement. Il ne connait pas le nom du template utilise. La solution necessite :

1. Une nouvelle table de logs dediee aux templates WhatsApp
2. Un enregistrement automatique dans `sendWhatsAppTemplate`
3. Une RPC d'agregation pour le dashboard
4. Un hook + page frontend

---

### 1. Migration SQL

**Nouvelle table `whatsapp_template_logs`**

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid PK | Identifiant |
| template_name | text NOT NULL | Nom du template (ex: `joiedevivre_otp`) |
| recipient_phone | text NOT NULL | Numero formate E.164 |
| country_prefix | text | Prefixe extrait (ex: `+225`) |
| language_code | text | Code langue (ex: `fr`) |
| status | text | `sent` ou `failed` |
| error_message | text | Message d'erreur si echec |
| body_params | jsonb | Parametres body envoyes |
| button_params | jsonb | Parametres button envoyes |
| created_at | timestamptz | Date d'envoi |

- Index sur `(template_name, created_at)` et `(country_prefix, created_at)`
- RLS active avec politique admin-only (SELECT)
- Pas de politique INSERT via RLS : les insertions se font depuis les Edge Functions avec le service role

**Nouvelle RPC `get_whatsapp_template_stats(days_back integer)`**

Retourne un JSON avec :
- **kpis** : total envoyes, total echoues, taux global, nombre de templates distincts
- **by_template** : pour chaque template -> total, sent, failed, success_rate
- **by_country** : pour chaque prefixe -> total, sent, failed, success_rate
- **by_template_country** : croisement template x pays -> total, sent, failed, success_rate
- **daily** : tendance quotidienne par template (total sent/failed par jour)
- **top_errors** : top 10 erreurs avec template_name, occurrences, derniere occurrence

---

### 2. Modification Edge Function : `supabase/functions/_shared/sms-sender.ts`

Dans `sendWhatsAppTemplate`, apres l'appel API Meta (que ce soit succes ou echec), inserer une ligne dans `whatsapp_template_logs` :

```text
await supabaseAdmin.from('whatsapp_template_logs').insert({
  template_name,
  recipient_phone: maskedPhone,     // 6 premiers chiffres + ***
  country_prefix: extractPrefix(),  // +225, +221, etc.
  language_code,
  status: success ? 'sent' : 'failed',
  error_message: errorMsg || null,
  body_params: bodyParameters,
  button_params: buttonParameters,
});
```

- Le numero est masque pour la securite (6 premiers + ***)
- L'insertion est en `fire-and-forget` (pas de await bloquant le flux principal) pour ne pas ralentir l'envoi
- Extraction du prefixe pays via les 3-4 premiers chiffres du numero formate

---

### 3. Nouveau hook : `src/hooks/useWhatsAppTemplateStats.ts`

- Appelle la RPC `get_whatsapp_template_stats` avec le parametre `days_back`
- Meme pattern que `useMessagingDeliveryStats` (useQuery, staleTime 60s, refetchInterval 60s)
- Types exportes pour les differentes sections de stats

---

### 4. Nouvelle page : `src/pages/Admin/WhatsAppTemplateDashboard.tsx`

Structure de la page :
- **Header** : titre "Templates WhatsApp" + selecteur de periode + bouton Rafraichir
- **4 KPI cards** : Total envoyes, Taux global, Templates actifs, Echecs
- **AreaChart** : tendance quotidienne des envois (sent vs failed) empilees
- **Tableau "Par template"** : nom, total, envoyes, echoues, taux de succes avec barre de progression coloree
- **Tableau "Par pays"** : prefixe, nom du pays, total, envoyes, echoues, taux de succes
- **Tableau croise "Template x Pays"** : vue detaillee du croisement
- **Tableau "Top erreurs"** : message d'erreur, template concerne, occurrences, derniere date

---

### 5. Integration dans l'admin

- **AdminLayout.tsx** : ajouter un lien `{ title: 'Templates WA', href: '/admin/whatsapp-templates', icon: MessageSquare }`
- **App.tsx** : ajouter la route `/admin/whatsapp-templates` avec `AdminRoute` et import lazy du composant

---

### Fichiers crees / modifies

| Fichier | Action |
|---------|--------|
| Migration SQL (nouvelle table + RPC) | Creer |
| `supabase/functions/_shared/sms-sender.ts` | Modifier (ajout log insert) |
| `src/hooks/useWhatsAppTemplateStats.ts` | Creer |
| `src/pages/Admin/WhatsAppTemplateDashboard.tsx` | Creer |
| `src/components/AdminLayout.tsx` | Modifier (ajout nav item) |
| `src/App.tsx` | Modifier (ajout route) |

### Remarques

- Les donnees commenceront a s'accumuler des le deploiement (pas de retroactivite sur les anciens envois)
- Le masquage du numero dans les logs preserves la confidentialite tout en permettant l'identification du prefixe pays
- L'insertion est non-bloquante pour ne pas impacter les performances d'envoi

