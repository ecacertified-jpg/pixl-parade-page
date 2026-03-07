

## Analyse : Relation entre les deux templates et alerte sans cagnotte

### 1. Les deux templates sont **indépendants**

| Template | Déclenché par | Quand | Objectif |
|----------|--------------|-------|----------|
| `joiedevivre_birthday_friend_alert` | `birthday-reminder-with-suggestions` (CRON 01h00 UTC) | Anniversaire à J-7 ou moins **ET** une cagnotte active existe | Alerter les proches qu'une cagnotte existe pour l'anniversaire, avec CTA vers `/f/{fund_id}` |
| `joiedevivre_group_contribution` | `notify-business-fund-friends` (déclenché manuellement à la création de la cagnotte) | Au lancement d'une cagnotte | Inviter les proches à contribuer à la cagnotte |

Ils ne sont **pas liés** entre eux. `group_contribution` est envoyé **une seule fois** à la création de la cagnotte. `birthday_friend_alert` est un **rappel quotidien** dans les 7 derniers jours, mais **uniquement s'il y a une cagnotte active**.

### 2. Probleme actuel : Pas d'alerte sans cagnotte

La condition à la **ligne 322** est explicite :

```
if (hasActiveFund && daysUntilBirthday <= 7)
```

**Si aucune cagnotte n'existe, les amis et contacts ne sont jamais alertés de l'anniversaire proche.** Seul l'utilisateur lui-même reçoit un rappel via `joiedevivre_birthday_reminder`.

### 3. Solution proposée : Nouveau template sans cagnotte

Ajouter un envoi d'alertes aux proches **même sans cagnotte**, avec un message adapté (sans lien vers une cagnotte).

**Fichier modifié** : `supabase/functions/birthday-reminder-with-suggestions/index.ts`

**Logique** :

```
if (daysUntilBirthday <= 7) {
  if (hasActiveFund) {
    // Existant : envoyer joiedevivre_birthday_friend_alert avec CTA cagnotte
  } else {
    // NOUVEAU : envoyer un message texte libre aux proches
    // "L'anniversaire de {nom} est dans {X} jours ! Offrez-lui un cadeau sur joiedevivre-africa.com"
  }
}
```

**Approche pour le cas sans cagnotte** :
- Utiliser `sendWhatsApp` (texte libre) ou `sendSms` comme fallback — pas besoin d'un nouveau template Meta pour commencer
- Ou créer un nouveau template Meta `joiedevivre_birthday_no_fund_alert` avec 2 paramètres (nom, jours) et un CTA vers la page cadeaux
- La déduplication et le recording dans `birthday_contact_alerts` restent identiques (avec `alert_type: 'friend_birthday_alert_no_fund'`)

**Option recommandée** : Commencer par un envoi en texte libre WhatsApp + SMS fallback (fonctionne immédiatement, pas besoin d'approbation Meta), puis créer le template HSM plus tard pour les envois hors fenêtre 24h.

### Fichiers à modifier
- `supabase/functions/birthday-reminder-with-suggestions/index.ts` — Dupliquer le bloc d'alerte amis pour le cas `!hasActiveFund`, en envoyant un message texte libre sans référence à une cagnotte

