

## Corriger l'acces aux cagnottes partagees via WhatsApp

### Probleme identifie

Quand les amis de Francoise cliquent sur "Contribuer" dans le WhatsApp, ils arrivent sur `/f/851779a5-...` mais voient "Cagnotte introuvable" car :

1. **La cagnotte n'est PAS publique** : `is_public = false` dans la base de donnees
2. **Les politiques RLS bloquent l'acces** : Seuls les utilisateurs connectes (createur, contributeurs, amis) ou les cagnottes publiques (`is_public = true`) sont visibles. Les destinataires WhatsApp ne sont generalement pas connectes a l'app
3. **La page `FundPreview.tsx` utilise le client Supabase cote navigateur** (clef anon), donc soumise aux RLS

### Solution proposee

Deux corrections complementaires :

---

#### Correction 1 : Marquer automatiquement les cagnottes business comme publiques

Dans l'Edge Function `notify-business-fund-friends`, ajouter une mise a jour automatique de `is_public = true` sur la cagnotte avant d'envoyer les WhatsApp. Logique : si on partage le lien par WhatsApp a des non-inscrits, la cagnotte DOIT etre accessible publiquement.

Fichier : `supabase/functions/notify-business-fund-friends/index.ts`

```text
// Apres recuperation du fund_id, avant l'envoi des notifications :
await supabaseAdmin
  .from('collective_funds')
  .update({ is_public: true })
  .eq('id', fund_id);
```

---

#### Correction 2 : Corriger immediatement la cagnotte de Francoise

Mettre a jour la cagnotte existante `851779a5-7c92-41b0-b429-e5ecbc6f0eb7` pour qu'elle soit visible :

```text
UPDATE collective_funds 
SET is_public = true 
WHERE id = '851779a5-7c92-41b0-b429-e5ecbc6f0eb7';
```

Cela rendra la cagnotte immediatement accessible aux amis qui ont deja recu le lien WhatsApp.

---

### Fichiers modifies

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-business-fund-friends/index.ts` | Ajouter `is_public = true` automatique avant envoi WhatsApp |
| Base de donnees (SQL direct) | Corriger la cagnotte `851779a5` en `is_public = true` |

### Impact

- Les amis de Francoise pourront immediatement voir et contribuer a la cagnotte
- Toutes les futures cagnottes business partagees par WhatsApp seront automatiquement accessibles aux destinataires

