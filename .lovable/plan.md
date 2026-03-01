

# Propositions d'amelioration pour la detection de doublons

Apres analyse du code existant, voici 3 axes d'amelioration concrets, classes par priorite.

---

## 1. Filtres par occasion dans le SearchExistingFundsModal

Actuellement la recherche se fait uniquement par texte libre. Ajouter des filtres rapides par type d'occasion (anniversaire, mariage, promotion, etc.) permettrait de trouver plus facilement une cagnotte existante.

**Changements** :
- `src/components/SearchExistingFundsModal.tsx` : Ajouter une rangee de chips/badges cliquables sous le champ de recherche (Anniversaire, Mariage, Promotion, Autre). Cliquer sur un chip filtre les resultats par `occasion`. Cumulable avec la recherche texte.
- `src/hooks/useSearchPublicFunds.ts` : Ajouter un parametre `occasion?: string` a `searchFunds()`. Si fourni, ajouter `.eq('occasion', occasion)` aux requetes Supabase.

---

## 2. Afficher la deadline et le temps restant

Les cartes de resultats n'affichent pas la date limite de la cagnotte. Un utilisateur a besoin de savoir combien de temps il reste avant de decider de contribuer.

**Changements** :
- `src/components/SearchExistingFundsModal.tsx` : Sous la barre de progression, afficher "X jours restants" ou "Expire le DD/MM" si `deadline_date` est present. Utiliser `date-fns` (`formatDistanceToNow` ou `differenceInDays`).
- `src/components/ExistingFundsAlert.tsx` : Meme ajout pour les alertes de doublons dans le CollaborativeGiftModal.
- `src/hooks/useExistingFundsForBeneficiary.ts` : Ajouter `deadlineDate` au type `ExistingFund` et le remplir depuis `deadline_date`.

---

## 3. Exclure les cagnottes creees par l'utilisateur courant de la recherche

Actuellement, si l'utilisateur a deja cree une cagnotte pour "Marie Belle", elle apparait dans ses propres resultats de recherche. Il serait plus pertinent de la distinguer visuellement ou de l'exclure.

**Changements** :
- `src/hooks/useSearchPublicFunds.ts` : Accepter un `currentUserId?: string` en parametre. Ajouter `.neq('creator_id', currentUserId)` aux requetes, ou alternativement marquer les fonds propres avec un flag `isOwn: true`.
- `src/components/SearchExistingFundsModal.tsx` : Passer le `user.id` au hook. Les cagnottes propres apparaissent avec un badge "Votre cagnotte" et le bouton change en "Voir" au lieu de "Contribuer".

---

## Resume des fichiers concernes

| Fichier | Ameliorations |
|---------|---------------|
| `src/hooks/useSearchPublicFunds.ts` | Filtre occasion, exclusion createur courant |
| `src/components/SearchExistingFundsModal.tsx` | Chips occasion, deadline, badge "Votre cagnotte" |
| `src/components/ExistingFundsAlert.tsx` | Affichage deadline |
| `src/hooks/useExistingFundsForBeneficiary.ts` | Ajout deadlineDate au type |

Aucune migration SQL necessaire.

