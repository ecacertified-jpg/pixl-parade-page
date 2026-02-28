

## Notification WhatsApp de progression des contributions a chaque nouvelle contribution

### Objectif

A chaque fois qu'un ami contribue a une cagnotte, envoyer un message WhatsApp :
- **Aux contributeurs existants** : les informer de la progression (ex: "La cagnotte a atteint 75% !")
- **Aux amis qui n'ont pas encore contribue** : les informer ET les encourager a contribuer avant la date limite

Le tout contextualise avec le nombre de jours restants avant l'anniversaire du beneficiaire.

### Proposition de templates WhatsApp Meta

**Template 1 : `joiedevivre_contribution_update`** (pour les contributeurs existants)

```text
Bonjour {{1}} ! 🎉

Bonne nouvelle : {{2}} vient de contribuer a la cagnotte pour {{3}}.
La cagnotte a atteint {{4}}% de l'objectif ({{5}} XOF).

Plus que {{6}} jours avant le jour J ! 🎂

[Voir la cagnotte] -> /f/{{1}}  (bouton CTA)
```

Parametres body : prenom destinataire, prenom contributeur, prenom beneficiaire, pourcentage, montant actuel, jours restants
Bouton CTA : fund_id

**Template 2 : `joiedevivre_contribution_nudge`** (pour ceux qui n'ont pas encore contribue)

```text
Salut {{1}} ! 👋

{{2}} vient de contribuer a la cagnotte pour {{3}}.
On en est a {{4}}% ! Il reste {{5}} jours pour atteindre l'objectif.

Ta contribution ferait vraiment plaisir a {{3}} ! 💜

[Contribuer maintenant] -> /f/{{1}}  (bouton CTA)
```

Parametres body : prenom destinataire, prenom contributeur, prenom beneficiaire, pourcentage, jours restants
Bouton CTA : fund_id

### Architecture technique

**1. Nouvelle Edge Function : `supabase/functions/notify-contribution-progress/index.ts`**

Declenchee a chaque nouvelle contribution (via trigger DB sur `fund_contributions`). Logique :

1. Recevoir `fund_id`, `contributor_id`, `amount` en body
2. Recuperer les infos du fund (titre, montant, objectif, deadline, beneficiaire, share_token)
3. Calculer le pourcentage de progression et les jours restants avant deadline/anniversaire
4. Recuperer le nom du contributeur
5. Recuperer le nom du beneficiaire (via `contacts` ou `profiles`)
6. Lister tous les contributeurs distincts (sauf le nouveau contributeur) -> envoyer `joiedevivre_contribution_update`
7. Lister les amis du createur (via `contact_relationships`) qui n'ont pas contribue -> envoyer `joiedevivre_contribution_nudge`
8. Deduplication : ne pas envoyer si une notification du meme type a ete envoyee pour ce fund dans les dernieres 24h (eviter le spam si plusieurs contributions rapprochees)
9. Creer des notifications in-app pour chaque destinataire

**2. Migration SQL : ajouter un appel `pg_net.http_post` dans un nouveau trigger**

Creer un trigger `AFTER INSERT ON fund_contributions` qui appelle la nouvelle Edge Function via `net.http_post`, en transmettant `fund_id`, `contributor_id` et `amount`.

**3. Fichier `supabase/config.toml`** : enregistrer la nouvelle fonction avec `verify_jwt = false`

### Logique de deduplication (anti-spam)

Pour eviter de spammer les amis si plusieurs contributions arrivent dans un court laps de temps :
- Verifier dans `scheduled_notifications` si une notification `contribution_progress_update` ou `contribution_nudge` existe deja pour ce `fund_id` dans les dernieres 4 heures
- Si oui, ne pas renvoyer (la progression sera vue au prochain passage)
- Ce delai de 4h est un bon compromis entre reactivite et respect de l'utilisateur

### Logique des jours restants

- Si le beneficiaire a une date d'anniversaire (via `contacts.birthday`), calculer les jours jusqu'a l'anniversaire
- Sinon, utiliser la `deadline_date` du fund
- Si ni l'un ni l'autre : omettre le contexte temporel du message

### Flux complet

```text
Contribution inseree dans fund_contributions
      |
      v
Trigger DB (AFTER INSERT)
      |
      v
net.http_post -> notify-contribution-progress
      |
      v
Edge Function :
  1. Fetch fund info + calcul progression
  2. Fetch contributeur name
  3. Fetch beneficiaire name
  4. Check deduplication (4h)
  5. Si OK :
     a. Contributeurs existants -> WhatsApp joiedevivre_contribution_update
     b. Amis non-contributeurs -> WhatsApp joiedevivre_contribution_nudge
     c. Notifications in-app pour tous
```

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contribution-progress/index.ts` | Creer |
| `supabase/config.toml` | Ajouter la config de la nouvelle fonction |
| Migration SQL | Creer le trigger sur `fund_contributions` |

### Notes importantes

- Les templates WhatsApp doivent etre crees et approuves sur Meta Business Manager avant de fonctionner
- Le cron existant `check-fund-contribution-reminders` reste en place comme filet de securite pour les rappels planifies
- Cette nouvelle fonctionnalite est en temps reel (a chaque contribution) vs le cron qui est planifie (dates fixes)

