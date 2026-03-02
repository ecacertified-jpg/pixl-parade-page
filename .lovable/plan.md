
# Ajouter les amis du beneficiaire aux notifications de progression

## Contexte

Quand une contribution est effectuee, l'Edge Function `notify-contribution-progress` envoie le template WhatsApp `joiedevivre_contribution_update` a trois audiences :
1. Les contributeurs existants
2. Les amis du **createur** de la cagnotte
3. Les amis du **contributeur**

Il manque une 4e audience : les **amis du beneficiaire** (ex: Francoise). Ces amis devraient aussi etre informes de la progression pour les encourager a contribuer.

## Modification

### `supabase/functions/notify-contribution-progress/index.ts`

Ajouter un **pass 9bis** (entre le pass 9 et le pass 10 actuel) pour notifier les amis du beneficiaire :

1. **Resoudre le `user_id` du beneficiaire** : a partir de `fund.beneficiary_contact_id`, lire le champ `linked_user_id` dans la table `contacts`. Si ce champ est renseigne, le beneficiaire est un utilisateur inscrit dont on peut chercher les amis.

2. **Chercher les amis du beneficiaire** via `contact_relationships` (meme logique que pour le createur et le contributeur) avec `can_see_funds = true`.

3. **Filtrer les doublons** : exclure les IDs deja notifies (contributeurs, amis du createur, le contributeur lui-meme) via le `Set allNotifiedIds` existant.

4. **Envoyer `joiedevivre_contribution_update`** avec les memes 6 parametres et la meme deduplication par numero de telephone (`sentPhones`).

5. **Logger le compteur** `nudgesBeneficiaryFriends` dans le log final et la reponse JSON.

## Flux apres modification

```text
Contribution inseree
       |
       v
  [Trigger DB] --> notify-contribution-progress
       |
       v
  1. Contributeurs existants  (WhatsApp)
  2. Amis du createur          (WhatsApp)
  3. Amis du beneficiaire      (WhatsApp)  <-- NOUVEAU
  4. Amis du contributeur      (WhatsApp)
  5. Notification in-app createur
```

## Comportement si le beneficiaire n'est pas inscrit

Si `linked_user_id` est `null` (beneficiaire non inscrit), le pass est simplement ignore -- aucune erreur, aucun envoi. Le reste du flux continue normalement.

## Aucune migration requise

Le champ `contacts.linked_user_id` existe deja. Seule la logique de l'Edge Function est modifiee.
