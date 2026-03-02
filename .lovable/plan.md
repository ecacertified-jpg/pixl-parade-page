

# Ameliorer l'algorithme de suggestions avec proximite geographique et anniversaires proches

## Objectif
Enrichir le hook `useUserSuggestions` avec deux nouveaux criteres de scoring :
1. **Meme ville** : les utilisateurs dans la meme ville que l'utilisateur courant obtiennent un bonus de score
2. **Anniversaire proche** : les utilisateurs dont l'anniversaire est dans les 30 prochains jours obtiennent un bonus (plus l'anniversaire est proche, plus le score est eleve)

## Fichier modifie

### `src/hooks/useUserSuggestions.ts`

**Changements :**

1. **Importer `getDaysUntilBirthday`** depuis `@/lib/utils`

2. **Recuperer le profil de l'utilisateur courant** (ville et anniversaire) au debut de `fetchSuggestions` :
   ```ts
   const { data: myProfile } = await supabase
     .from('profiles')
     .select('city, birthday')
     .eq('user_id', user.id)
     .single();
   ```

3. **Ajouter `city` et `birthday` aux champs recuperes** dans la requete profiles des candidats (ligne 117) :
   ```ts
   .select('user_id, first_name, last_name, avatar_url, bio, country_code, city, birthday')
   ```

4. **Elargir la decouverte de candidats** : en plus des amis d'amis / occasions / reactions, ajouter une requete pour les utilisateurs de la meme ville (si l'utilisateur a renseigne sa ville) :
   ```ts
   if (myProfile?.city) {
     const { data: sameCityUsers } = await supabase
       .from('profiles')
       .select('user_id')
       .eq('city', myProfile.city)
       .not('user_id', 'in', `(${[user.id, ...followedUserIds].join(',')})`)
       .limit(20);
     // Ajouter leurs IDs au pool de candidats
   }
   ```

5. **Mettre a jour le scoring** pour inclure les nouveaux criteres :
   ```text
   Score actuel :
     mutual_follows * 3 + common_occasions * 2 + gifts * 1 + complete_profile * 1

   Nouveau score :
     mutual_follows * 3
   + common_occasions * 2
   + same_city * 2          (NOUVEAU)
   + upcoming_birthday * 3  (NOUVEAU - plus eleve car urgent/actionnable)
   + gifts * 1
   + complete_profile * 1
   ```
   - `same_city` : bonus de 2 points si le candidat est dans la meme ville
   - `upcoming_birthday` : bonus de 3 points si anniversaire dans les 14 jours, 2 points si dans les 30 jours

6. **Enrichir les raisons affichees** avec de nouveaux messages :
   - `"Habite a [ville] comme vous"` quand meme ville
   - `"Anniversaire dans X jours"` quand anniversaire proche
   - Combinaisons : `"Meme ville * Anniversaire bientot"`

7. **Mettre a jour l'interface `UserSuggestion`** pour ajouter les champs optionnels `city` et `days_until_birthday` (pour permettre un affichage futur dans le composant)

## Aucun autre fichier modifie
- Pas de changement de base de donnees (les colonnes `city` et `birthday` existent deja dans `profiles`)
- Pas de changement dans `UserSuggestionsSection.tsx` (les nouvelles donnees sont transparentes via le champ `reason`)
- L'utilitaire `getDaysUntilBirthday` existe deja dans `src/lib/utils.ts`

