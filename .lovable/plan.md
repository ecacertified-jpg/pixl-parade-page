

## Notification WhatsApp de progression des contributions a chaque nouvelle contribution

### Objectif

A chaque fois qu'un ami contribue a une cagnotte, envoyer un message WhatsApp :
- **Aux contributeurs existants** : les informer de la progression
- **Aux amis qui n'ont pas encore contribue** : les informer ET les encourager a contribuer

Le tout contextualise avec le nombre de jours restants avant l'anniversaire du beneficiaire.

### Proposition de templates WhatsApp Meta

**Template 1 : `joiedevivre_contribution_update`** (pour les contributeurs existants)

```text
Bonjour {{1}} !

Bonne nouvelle : {{2}} vient de contribuer a la cagnotte pour {{3}}.
La cagnotte a atteint {{4}}% de l'objectif ({{5}} XOF).

Plus que {{6}} jours avant le jour J !

[Voir la cagnotte] -> /f/{{1}}  (bouton CTA dynamique avec fund_id)
```

Parametres body : prenom destinataire, prenom contributeur, prenom beneficiaire, pourcentage, montant actuel, jours restants
Bouton CTA : fund_id

**Template 2 : `joiedevivre_contribution_nudge`** (pour ceux qui n'ont pas encore contribue)

```text
Salut {{1}} !

{{2}} vient de contribuer a la cagnotte pour {{3}}.
On en est a {{4}}% ! Il reste {{5}} jours pour atteindre l'objectif.

Ta contribution ferait vraiment plaisir a {{3}} !

[Contribuer maintenant] -> /f/{{1}}  (bouton CTA dynamique avec fund_id)
```

Parametres body : prenom destinataire, prenom contributeur, prenom beneficiaire, pourcentage, jours restants
Bouton CTA : fund_id

### Architecture technique

**1. Nouvelle Edge Function : `supabase/functions/notify-contribution-progress/index.ts`**

Declenchee a chaque nouvelle contribution via trigger DB. Logique :

1. Recevoir `fund_id`, `contributor_id` en body
2. Recuperer les infos du fund (montant, objectif, deadline, beneficiaire, creator_id)
3. Calculer le pourcentage de progression
4. Calculer les jours restants : d'abord via `contacts.birthday` du beneficiaire, sinon `deadline_date` du fund
5. Recuperer le nom du contributeur (via `profiles`)
6. Recuperer le nom du beneficiaire (via `contacts` ou `profiles`)
7. Verifier la deduplication (4h) dans `scheduled_notifications`
8. Si OK :
   - Lister les contributeurs distincts (sauf le nouveau) via `fund_contributions` -> recuperer leurs phones via `profiles` -> envoyer `joiedevivre_contribution_update`
   - Lister les amis du createur (via `contact_relationships` avec `can_see_funds=true`) qui n'ont pas contribue -> recuperer leurs phones -> envoyer `joiedevivre_contribution_nudge`
   - Creer des notifications in-app

**2. Migration SQL**

Ajouter un trigger `AFTER INSERT ON fund_contributions` qui appelle la nouvelle Edge Function via `net.http_post` en transmettant `fund_id` et `contributor_id`. Pattern identique a `notify-fund-ready`.

**3. Configuration `supabase/config.toml`**

Ajouter :
```toml
[functions.notify-contribution-progress]
verify_jwt = false
```

### Logique de deduplication (anti-spam)

- Verifier dans `scheduled_notifications` si une notification `contribution_progress_update` existe pour ce `fund_id` dans les dernieres 4 heures
- Si oui, ne pas renvoyer
- Ce delai de 4h evite le spam si plusieurs contributions arrivent rapidement

### Calcul des jours restants

1. Recuperer `beneficiary_contact_id` du fund
2. Si contact avec `birthday` : calculer les jours jusqu'au prochain anniversaire (en tenant compte de l'annee)
3. Sinon : utiliser `deadline_date` du fund
4. Si ni l'un ni l'autre : utiliser "bientot" comme texte par defaut

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
  1. Fetch fund + calcul progression/jours
  2. Fetch contributeur + beneficiaire names
  3. Check deduplication (4h)
  4. Si OK :
     a. Contributeurs existants -> WhatsApp joiedevivre_contribution_update
     b. Amis non-contributeurs -> WhatsApp joiedevivre_contribution_nudge
     c. Notifications in-app pour tous
```

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contribution-progress/index.ts` | Creer - Edge Function principale |
| `supabase/config.toml` | Ajouter la config de la nouvelle fonction |
| Migration SQL | Creer le trigger `AFTER INSERT ON fund_contributions` avec `net.http_post` |

### Notes importantes

- Les templates `joiedevivre_contribution_update` et `joiedevivre_contribution_nudge` doivent etre crees et approuves sur Meta Business Manager avant de fonctionner
- Les deux templates utilisent un bouton CTA dynamique pointant vers `/f/{fund_id}` (meme pattern que `joiedevivre_group_contribution`)
- Le cron existant `check-fund-contribution-reminders` reste en place comme filet de securite
- La deduplication de 4h est geree via la table `scheduled_notifications` pour eviter les doublons avec le cron

