

# Correction des notifications `contribution_update` -- Amis du contributeur

## Probleme identifie

La fonction `notify-contribution-progress` ne notifie actuellement que **2 audiences** :
1. Les contributeurs existants de la cagnotte
2. Les amis du **createur** de la cagnotte (via `contact_relationships`)

Elle **ignore les amis du contributeur**, ce qui explique pourquoi vous (Florentin, `3fc4a030`) n'avez pas recu de notification quand Francoise a contribue -- vous etes ami de Francoise dans l'app mais pas dans la table `contact_relationships` avec son user_id createur (`0b4eb0bb`).

### Verification en base
- Francoise (createur) `0b4eb0bb` a 2 amis : Amtey (`aae8fedd`) et Aboutou (`b8d0d4e4`)
- **Aucune relation** entre vous (`3fc4a030`) et Francoise (`0b4eb0bb`) dans `contact_relationships`
- Meme si cette relation existait, la logique actuelle ne notifie que les amis du createur, pas ceux du contributeur

## Plan de correction (2 volets)

### Volet 1 -- Correction de donnees : ajouter la relation manquante

Inserer une relation `contact_relationships` entre Florentin (`3fc4a030`) et Francoise (`0b4eb0bb`) avec `can_see_funds = true`. Cela corrige le cas immediat.

Verifier egalement pourquoi le systeme de liaison automatique (triggers sur les 8 derniers chiffres du telephone) n'a pas cree cette relation -- probablement parce que Francoise n'est pas dans les contacts de Florentin (ou inversement).

### Volet 2 -- Amelioration de la logique : notifier aussi les amis du contributeur

Modifier `supabase/functions/notify-contribution-progress/index.ts` pour ajouter une **3eme passe de notification** : les amis du contributeur (pas seulement ceux du createur).

#### Changements dans `notify-contribution-progress/index.ts`

Apres la section 9 actuelle (amis du createur), ajouter une section 10 :

```text
// 10. Get friends of the CONTRIBUTOR who haven't contributed
//     -> same logic as step 9 but using contributor_id instead of creator_id
```

Logique :
1. Requeter `contact_relationships` ou `user_a` ou `user_b` = `contributor_id` ET `can_see_funds = true`
2. Extraire les IDs amis, exclure ceux deja dans `uniqueContributorIds` et le contributeur lui-meme
3. Exclure les IDs deja traites dans la passe "amis du createur" (eviter les doublons)
4. Pour chaque ami avec un telephone, envoyer le template `joiedevivre_contribution_update` (meme template, memes 6 parametres)
5. Utiliser le meme `sentPhones` Set pour la deduplication par telephone

#### Contraintes respectees
- Deduplication 4h existante (inchangee -- une seule notification par fund dans la fenetre)
- Deduplication par telephone (`sentPhones` Set partage entre toutes les passes)
- Pas de notification au contributeur lui-meme (deja filtre)
- Pas de nouvelle table ni migration requise

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| `supabase/functions/notify-contribution-progress/index.ts` | Ajout de la passe "amis du contributeur" (section 10) |
| Base de donnees (`contact_relationships`) | Insertion de la relation Florentin-Francoise |

### Impact

- Les amis du contributeur verront desormais les mises a jour de progression
- Le volume de notifications augmente legerement mais reste controle par la deduplication 4h et par telephone
- Le log final indiquera 3 compteurs : `updates` (contributeurs), `nudges_creator_friends`, `nudges_contributor_friends`

