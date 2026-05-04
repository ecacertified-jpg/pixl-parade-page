## Objectif

Réutiliser la modale "Comment veux-tu partager ?" (`BirthdayPageShareButton`) à l'étape 7 "Partager ma page" de l'onboarding, et y ajouter le mode SMS dans la vue "Réseaux sociaux".

## Changements

### 1. `src/components/BirthdayPageShareButton.tsx`
- Ajouter une option **SMS** dans `shareOptions` (vue "Réseaux sociaux") :
  - Icône `MessageSquare` (lucide), couleur neutre.
  - Action : `window.location.href = sms:?body=...` avec `shareText + pageUrl` encodés.
- Ajouter une prop optionnelle `onShared?: (method: string) => void` appelée après chaque partage réussi (whatsapp, facebook, twitter, linkedin, telegram, email, sms, copy, native), pour que le parent puisse compter les partages.

### 2. `src/components/OnboardingExperience.tsx` (étape 7, sous-étape 3 "Partager")
- Remplacer la rangée actuelle de 3 boutons (WhatsApp / SMS / Copier) par un seul bouton large **"Partager ma page"** (gradient primary→accent, icône `Share2`).
- Au clic : ouvrir `BirthdayPageShareButton` (état local `showShareSheet`).
- Passer `onShared={(method) => incrementShareCount(method)}` afin de continuer à incrémenter `shareCount` (la sous-étape se valide toujours à 3 partages).
- Garder firstName / pageUrl / age cohérents avec ceux déjà calculés dans le composant.

### 3. Aucune autre modification
- Le bouton "Création (+)" du menu bas et la page d'anniversaire publique utilisent déjà `BirthdayPageShareButton` — ils bénéficieront automatiquement de l'option SMS ajoutée.
- Pas de changement DB, pas de nouvelle dépendance.

## Résultat utilisateur

À l'étape "Partager ma page" de l'onboarding, l'utilisateur clique sur "Partager ma page" → la modale "Comment veux-tu partager ?" s'ouvre (Groupes WhatsApp ou Réseaux sociaux). La grille "Réseaux sociaux" inclut désormais SMS aux côtés de WhatsApp, Facebook, X, LinkedIn, Telegram, Email et Copier le lien. Chaque partage incrémente le compteur 0/3 → 3/3.