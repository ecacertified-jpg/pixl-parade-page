# Refonte de l'onboarding post-inscription

## Constat actuel

Deux parcours coexistent et se chevauchent :

**`OnboardingExperience.tsx` (post-inscription)** — 6 étapes :
0. Accueil
1. **Anniversaire** ← déjà saisi dans `PreAuthDiscovery` (étape "Découvrez JDV en 30")
2. Goûts
3. Souhaits (≥3 favoris)
4. Amis (3 invitations)
5. "Ma page" (page + cagnotte + 3 partages, tout dans une seule étape dense)

**`BirthdayPageBuilderModal.tsx` (bouton + Créer)** — 6 étapes propres et bien découpées :
1. Liste de souhaits (≥3)
2. Type de page (moi / proche / autre)
3. Amis associés (BirthdayPageFriendsPicker)
4. Cagnotte (WishlistFundPickerModal)
5. Publier la page
6. Partager (≥3)

**Problèmes** :
- Étape "Anniversaire" redondante (déjà fait au pre-auth).
- Étape 5 du onboarding cumule 3 actions hétérogènes → friction.
- Pas d'étape "ajouter une première photo" alors que l'album est central pour l'engagement.
- Les 2 parcours ne sont pas synchronisés → un nouvel inscrit qui finit l'onboarding doit reprendre les mêmes actions dans le builder du bouton +.

## Objectif

Un onboarding unique qui réutilise EXACTEMENT les 6 étapes du `BirthdayPageBuilderModal`, en :
- supprimant la saisie de date (déjà capturée),
- ajoutant une étape **"Ma première photo"** entre "Publier" et "Partager",
- gardant le design immersif actuel (FloatingParticles, confetti, gradients, progress bar, copy joyeuse),
- rendant chaque étape plus incitative (preview vivante, micro-animations à la complétion, messages de progrès).

## Nouvelle séquence d'onboarding (7 étapes)

```text
0. Accueil festif         → "Bienvenue {prénom} ! Construisons ta page d'anniv ✨"
1. Mes goûts              → ≥1 catégorie (préremplit la liste)
2. Ma liste de souhaits   → ≥3 favoris (réutilise écran actuel, fusionné)
3. Type de page           → moi / proche / autre événement (NOUVEAU dans onboarding)
4. Mes amis associés      → BirthdayPageFriendsPicker (≥1 ami) + invitations optionnelles
5. Ma cagnotte            → WishlistFundPickerModal (skippable)
6. Ma première photo      → upload 1 média via bucket birthday-page-photos (NOUVEAU)
7. Publier & Partager     → bouton Publier + 3 partages WhatsApp/copy
```

Total : 8 écrans (0 à 7), affichés "x / 7 étapes" dans la progress bar (l'accueil ne compte pas).

> Note : les étapes "Type de page", "Amis associés", "Cagnotte" sont DÉPLACÉES de `BirthdayPageBuilderModal` vers l'onboarding. Le bouton + reste fonctionnel pour ceux qui n'ont pas terminé ou veulent reprendre, mais montre les étapes déjà cochées comme "Fait" via `useBirthdayPageBuilderStatus` (déjà en place).

## Détail des modifications

### `src/components/OnboardingExperience.tsx`
- Supprimer le bloc `currentStep === 1` (BirthdayPicker) et la logique `saveBirthday` — la date est posée par `PreAuthDiscovery`.
- `stepLabels` → `['Accueil','Goûts','Souhaits','Type','Amis','Cagnotte','Photo','Publier']`.
- `DYNAMIC_TOTAL_STEPS = 8`.
- Réindexer tous les `currentStep === N`.
- **Nouveau step "Type"** : 3 cartes (réutiliser `TYPE_OPTIONS` de `BirthdayPageBuilderModal`), appel `setPageType` du hook `useBirthdayPageBuilderStatus`.
- **Step "Amis"** : remplacer l'invitation par téléphone (gardée en option secondaire) par `BirthdayPageFriendsPicker` inline, + lien wa.me pour formulaire ami. Validation : ≥1 ami associé OU 3 invitations envoyées (status_completed) → on garde la valve actuelle pour ne pas bloquer.
- **Step "Cagnotte"** : ouvrir `WishlistFundPickerModal` directement, état `hasFund` déjà chargé. Bouton "Passer" (flag `bp_fund_skipped_${userId}`) → cohérent avec le builder.
- **NOUVEAU step "Photo"** :
  - Composant `<OnboardingFirstPhotoStep />` : input `<input type="file" accept="image/*,video/*">` qui :
    1. compresse via `compressImage` (1600px / 0.82),
    2. upload vers `birthday-page-photos/{user_id}/{uuid}.jpg`,
    3. insert dans `birthday_page_photos` avec le `page_id` (créer la page en brouillon `is_active=true, published_at=null` si elle n'existe pas encore).
  - Validation : `count(birthday_page_photos where page_id = X) >= 1`.
  - Confetti + toast "Première photo ajoutée 📸".
- **Step "Publier & Partager"** : fusion publish + share. Bouton **Publier ma page** (pose `published_at=now()`, `published_via_onboarding=true`) puis 3 boutons de partage (WhatsApp, copier lien, partager natif). Compteur live "Partages : 1/3 → 2/3 → 3/3 ✨".

### Bouton + (`BirthdayPageBuilderModal`)
- Aucun changement structurel : il reflète le même `useBirthdayPageBuilderStatus` et marquera automatiquement comme "Fait" tout ce que l'onboarding aura accompli.
- Ajouter une 7e étape **"Album : ajoute une photo"** dans `steps` du modal (clé `firstPhoto`) afin d'éviter qu'une étape de l'onboarding ne soit absente du builder. Mise à jour du hook `useBirthdayPageBuilderStatus` :
  - Nouveau check : `select count from birthday_page_photos where page_id = status.birthdayPageId`.
  - Ajouter `steps.firstPhoto: StepStatus` et porter `totalCount` à 7.
- L'ordre dans le builder reflète l'onboarding : wishlist → type → friends → fund → photo → publish → share.

### Anti-doublon entre les 2 parcours
- Tous les checks de complétion de l'onboarding lisent les MÊMES sources que le builder (favoris, `birthday_pages`, `collective_funds`, `birthday_page_photos`, `onboarding_shares`, `localStorage bp_type`, `birthday_page_friends`).
- Conséquence : un utilisateur qui ferme l'onboarding au milieu et ouvre le bouton + voit ses étapes déjà cochées, et inversement.

### Polish UX/visuel (design conservé, plus fluide)

- Garder `FloatingParticles`, gradients violet/rose, `Poppins/Nunito`.
- **Progression dopaminergique** : à chaque step validé, micro-confetti localisé + bouton "Continuer" qui devient "Suivant ✨" en gradient animé.
- **Preview vivante de la page** : à partir du step "Type", un mini aperçu sticky en haut (nom + icône type + compteur amis + ✓ photo + 🎁 cagnotte) montre la page se construire en temps réel — c'est l'incitation clé pour aller jusqu'au bout.
- **Skippable, jamais bloquant** : chaque étape a "Plus tard" sauf Goûts (≥1) et Souhaits (≥3) qui restent les pré-requis du parcours.
- **Reprise intelligente** : `firstIncompleteStep` calcule le 1er step non validé en lisant les mêmes sources, l'utilisateur n'a jamais à refaire.
- Texte des CTA orienté émotion : "Crée ton effet wow 🎂", "Tes amis n'attendent que ça ✨", "Plus que 2 partages pour des cadeaux !".

## Fichiers impactés

| Fichier | Action |
|---|---|
| `src/components/OnboardingExperience.tsx` | Refonte des steps : suppression step 1 (date), ajout Type / Amis-builder / Cagnotte / Photo, réindexation, fusion publish+share |
| `src/components/OnboardingFirstPhotoStep.tsx` | **Nouveau** — composant upload première photo (compression + storage + insert) |
| `src/components/BirthdayPageBuilderModal.tsx` | Ajout step "firstPhoto" dans le tableau `steps` |
| `src/hooks/useBirthdayPageBuilderStatus.ts` | Ajout check `firstPhoto` (count birthday_page_photos), `totalCount=7` |
| `src/components/PreAuthDiscovery.tsx` | Aucun changement (déjà capture la date) |

## Validation

- Aucune étape ne réapparaît : la date n'est demandée que dans `PreAuthDiscovery`, le type/amis/cagnotte ne sont demandés qu'une fois et leur état est partagé entre onboarding et bouton +.
- Un utilisateur qui boucle l'onboarding voit le builder du bouton + à 7/7 (toutes vertes).
- Un utilisateur qui passe par le bouton + avant l'onboarding voit l'onboarding s'ouvrir directement à la 1ère étape non faite.
