

# Plan : Onboarding viral et experience utilisateur exceptionnelle

## Probleme actuel

L'onboarding existant est une modale statique en 3 etapes avec du texte descriptif. C'est fonctionnel mais ne cree aucune emotion forte, aucun engagement interactif, et aucun mecanisme viral. L'utilisateur peut tout "skipper" sans rien faire.

## Concept : Onboarding immersif en plein ecran

Remplacer la modale par une **experience plein ecran immersive** en 5 etapes avec des micro-interactions, des animations emotionnelles et un **mecanisme viral integre** (invitation + partage).

### Etapes de l'onboarding

| Etape | Titre | Experience | Action virale |
|-------|-------|-----------|---------------|
| 1. Bienvenue | "La joie de donner" | Animation plein ecran : confettis + coeurs flottants + message personnalise avec le prenom | - |
| 2. Mon anniversaire | "Quand est ton anniversaire ?" | Saisie interactive de la date avec compte a rebours anime (J-X avant ton prochain anniv !) | - |
| 3. Mon premier voeu | "Quel cadeau te ferait plaisir ?" | Selection rapide parmi des categories illustrees (tech, mode, voyage...) avec animation de selection | - |
| 4. Mon cercle | "Invite 3 proches" | Import contacts telephone ou saisie manuelle. Chaque ajout declenche une animation festive | **Partage WhatsApp/SMS automatique** |
| 5. Ma page virale | "Ta page anniversaire est prete !" | Preview de la page `/birthday/prenom-annee` avec bouton de partage multi-canal | **Partage immediat sur reseaux sociaux** |

### Mecanismes viraux integres

1. **Etape 4** : L'utilisateur invite ses proches directement pendant l'onboarding. Chaque invitation envoie un lien avec le code de parrainage.
2. **Etape 5** : L'utilisateur voit sa page anniversaire virale deja creee et peut la partager immediatement sur WhatsApp, Facebook, etc.
3. **Gamification** : Barre de progression "Profil complete a X%" qui motive la completion.
4. **Recompense** : Badge "Pionnier" attribue a la fin de l'onboarding complet.

## Implementation technique

### 1. Nouveau composant `OnboardingExperience.tsx`

Experience plein ecran (pas une modale) avec :
- Navigation par swipe horizontal (mobile) ou fleches
- Animations Framer Motion entre chaque etape
- Particules flottantes en fond (coeurs, etoiles, cadeaux)
- Barre de progression en haut avec etapes numerotees

### 2. Etape "Mon anniversaire" — Saisie interactive

- Si le profil a deja une date de naissance, pre-remplir et montrer le compte a rebours
- Sinon, picker de date anime avec preview du compte a rebours en temps reel
- Sauvegarde dans `profiles.birthday` via Supabase

### 3. Etape "Mon premier voeu" — Categories illustrees

- Grille de 6-8 categories avec icones animees (Lucide)
- Selection multiple possible
- Sauvegarde dans `profiles` ou table de preferences (si existante)
- Sert a personnaliser les suggestions de cadeaux futures

### 4. Etape "Mon cercle" — Invitation virale

- Reutilise la logique de `useDeviceContacts` et `useInvitations` existants
- 3 methodes : import contacts, saisie manuelle, partage lien
- Chaque ami ajoute = animation de celebration + compteur "+1"
- Bouton "Partager sur WhatsApp" avec message pre-rempli et lien de parrainage

### 5. Etape "Ma page virale" — Preview et partage

- Genere automatiquement le slug `prenom-annee` si pas deja fait
- Affiche un apercu miniature de la page anniversaire
- Boutons de partage multi-canal (WhatsApp, Facebook, Telegram, copier le lien)
- CTA final "Decouvrir mon espace" qui redirige vers le dashboard

### 6. Hook `useOnboarding.ts` — Mise a jour

- Passer de 3 a 5 etapes
- Sauvegarder les donnees collectees (birthday, preferences) a chaque etape
- Creer la page anniversaire virale a l'etape 5 si elle n'existe pas

### 7. Integration dans `Dashboard.tsx`

- Remplacer `<OnboardingModal>` par `<OnboardingExperience>`
- L'experience plein ecran se superpose au dashboard (z-50)
- Transition fluide vers le dashboard a la fin

## Fichiers concernes

| Fichier | Action |
|---------|--------|
| `src/components/OnboardingExperience.tsx` | Nouveau — experience plein ecran 5 etapes |
| `src/components/OnboardingModal.tsx` | Conserve comme fallback mais plus utilise |
| `src/hooks/useOnboarding.ts` | Mise a jour pour 5 etapes + sauvegarde donnees |
| `src/pages/Dashboard.tsx` | Remplacer OnboardingModal par OnboardingExperience |

## Boucle virale

```text
Nouvel utilisateur → Onboarding immersif
  → Etape 4 : Invite 3 amis via WhatsApp
    → Amis recoivent le lien → Telechargent/s'inscrivent
  → Etape 5 : Partage sa page anniversaire
    → Amis voient la page → Creent un compte pour ecrire un message
      → Decouvrent JDV → Creent leur propre page → Cycle continue
```

