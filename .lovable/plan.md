

# Plan : Simplifier l'onboarding en 5 etapes et guider progressivement vers la page d'anniversaire

## Analyse

L'etape 5 ("Ma page") de l'onboarding est prematuree : la page d'anniversaire n'a de valeur que si l'utilisateur a des amis, une wishlist, et eventuellement une cagnotte. Or ces elements se construisent apres l'onboarding. De plus, la page est deja auto-creee lors de la creation d'une cagnotte self-fund, et une banniere dans l'onglet "Cercle d'amis" guide deja vers le partage.

## Nouveau flux onboarding (5 etapes)

```text
0. Accueil     → Bienvenue avec confettis
1. Anniversaire → Date de naissance
2. Gouts       → Categories de cadeaux preferees
3. Souhaits    → Parcourir et ajouter des favoris
4. Amis        → Inviter des proches (finale avec celebration)
```

L'etape "Amis" devient la derniere etape et se termine par un bouton celebratoire "ACCEDER A MON TABLEAU DE BORD" (avec confettis) apres au moins une interaction de partage — exactement comme l'actuelle etape 5 mais sans la page d'anniversaire.

## Guidage progressif post-onboarding

La page d'anniversaire est decouverte naturellement via :
1. **Banniere "Cercle d'amis"** (existante) → lien + boutons Copier/Partager
2. **Creation de cagnotte self-fund** (existante) → auto-creation de la birthday page
3. **Onglet "Anniv."** (existant) → visualisation des pages crees

Aucun nouveau composant necessaire — le parcours progressif est deja en place.

## Modifications

### Fichier : `src/components/OnboardingExperience.tsx`

1. **Reduire `TOTAL_STEPS` de 6 a 5**
2. **Supprimer tout le bloc step 5** (lignes 809-898 : birthday page preview, partage, creation en DB)
3. **Supprimer les states inutiles** : `birthdayPageSlug`, `linkCopied`, `hasShared` et les handlers `handleCopyLink`, `handleShareBirthdayPage`
4. **Supprimer le useEffect de creation de birthday page** (lignes 310-345)
5. **Mettre a jour le tableau des noms d'etapes** : retirer "Ma page" → `['Accueil', 'Anniversaire', 'Goûts', 'Souhaits', 'Amis']`
6. **Ajouter la celebration finale a l'etape 4 (Amis)** : apres un partage (`invitationsSentCount > 0`), afficher le bouton vert pulsant "ACCEDER A MON TABLEAU DE BORD" avec confettis, exactement comme l'ancien step 5
7. **Le bouton "Continuer" de la derniere etape** → appelle `onComplete` avec confettis de celebration

Le resultat : un onboarding plus court, plus fluide, sans etape prematuree, qui guide l'utilisateur vers son tableau de bord ou il decouvrira naturellement la page d'anniversaire.

