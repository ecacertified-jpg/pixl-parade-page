## Objectif

Transformer l'onboarding business actuel (modal générique + checklist) en une expérience **immersive, incitative et gamifiée** qui pousse fortement le prestataire à :
1. Configurer le profil de sa boutique (logo, description, horaires, livraison, paiement)
2. Ajouter ses premiers produits (≥3 recommandés)
3. Activer les notifications et partager sa boutique

L'approche combine **bénéfices chiffrés / preuve sociale** + **gamification (paliers, badges, déblocage)**, déclenchée à deux endroits : un **parcours plein-page dédié** (`/business/setup`) et une **checklist enrichie** sticky dans le dashboard business.

---

## UX — Le parcours

### Nouvelle route : `/business/setup`

Wizard plein-page immersif (gradient, animations Framer Motion, confettis aux paliers), accessible :
- Automatiquement à la création d'une boutique (redirection après `AddBusinessModal`)
- Depuis un CTA "Reprendre la configuration" sur la checklist du dashboard
- Depuis le `BusinessSelector` quand la boutique est < 100% configurée

**Structure (6 étapes) :**

```text
┌────────────────────────────────────────────────────────┐
│  [Étape 2/6]  ████████░░░░░░░░  35%   [Bronze 🥉]      │
├────────────────────────────────────────────────────────┤
│                                                        │
│   [Icône animée]                                       │
│   Habillez votre boutique                              │
│                                                        │
│   Les boutiques avec logo + description reçoivent      │
│   3,2× plus de vues 👀                                 │
│                                                        │
│   ✓ Logo visible          [À ajouter]                  │
│   ○ Description (>50 car) [À rédiger]                  │
│                                                        │
│   [ Configurer maintenant → ]   [ Plus tard ]          │
│                                                        │
│   💡 +12 prestataires de votre ville sont déjà actifs  │
└────────────────────────────────────────────────────────┘
```

1. **Bienvenue** — confettis, présentation de la promesse ("Votre boutique en 5 min, +X clients potentiels près de vous")
2. **Identité boutique** — logo + description + catégorie (CTA → `BusinessProfileSettings` ou modal inline)
3. **Premier produit** — ouvre `AddProductModal`. Encourage à en ajouter ≥3 avec un compteur visible
4. **Livraison** — zones + frais (CTA → `BusinessProfileSettings`)
5. **Paiement** — Mobile Money / Wave (CTA → `BusinessProfileSettings`)
6. **Lancement** — activation notifications + partage boutique + récap des bénéfices débloqués

### Mécaniques incitatives par étape

Sur chaque étape :
- **Bénéfice chiffré** : "Les boutiques avec logo reçoivent 3× plus de vues", "Ajouter 3 produits multiplie par 5 vos chances de vente"
- **Preuve sociale dynamique** : "X prestataires actifs dans [ville]", "Y clients à la recherche de [catégorie] cette semaine" (lue depuis `business_accounts` + `products` filtrés par pays/ville/catégorie)
- **Aperçu live** : mini-prévisualisation de la fiche boutique publique qui s'enrichit au fur et à mesure
- **Bouton "Plus tard"** discret (pas bloquant) mais avec micro-rappel des bénéfices manqués

### Gamification — paliers

3 niveaux visuels (déjà présents dans le design system : violet primary, accent, success) :

| Palier | Conditions | Récompense affichée |
|---|---|---|
| 🥉 Bronze | Profil + 1 produit | Badge "Boutique Bronze" sur la fiche publique |
| 🥈 Argent | + Livraison + Paiement + 3 produits | Badge "Argent" + mise en avant `/shop` |
| 🥇 Or | + Notifications + Partage + 5 produits | Badge "Or" + boost de visibilité (tri prioritaire) |

Le badge gagné est célébré (confettis + toast), affiché sur la `BusinessCard` publique, et persisté dans la DB.

### Checklist dashboard enrichie

Le composant existant `BusinessOnboardingChecklist` est refondu :
- En-tête avec **palier actuel + prochain palier** + récompense à débloquer
- Pour chaque étape : bénéfice chiffré court, durée estimée ("~1 min"), micro-CTA direct
- Bouton "Reprendre dans le mode immersif" → ouvre `/business/setup`
- Apparait sticky/contextualisée tant que palier Or non atteint (au lieu de "100% complété")

---

## Implémentation technique

### Base de données (migration)

Ajouter à `business_accounts` :
- `setup_tier text default 'none'` — `'none' | 'bronze' | 'silver' | 'gold'`
- `setup_completed_steps jsonb default '[]'` — historique pour ne pas re-célébrer
- `setup_completed_at timestamptz`

Fonction SQL `compute_business_setup_tier(business_id uuid)` qui calcule le palier en lisant `business_accounts` + count `products` + presence de `delivery_zones`/`payment_info`. Trigger `AFTER INSERT/UPDATE` sur `products` et `business_accounts` qui appelle cette fonction et met à jour `setup_tier`.

Pas de RLS supplémentaire requise (champs sur table existante, lecture publique limitée via vue `business_public_info` à étendre pour exposer `setup_tier`).

### Frontend

**Nouveaux fichiers :**
- `src/pages/BusinessSetup.tsx` — wizard plein-page avec étapes animées, badge progression, preuve sociale
- `src/components/business-setup/SetupStepShell.tsx` — layout commun (header progress, footer CTAs)
- `src/components/business-setup/SetupBenefitsBanner.tsx` — bénéfices chiffrés + preuve sociale dynamique
- `src/components/business-setup/SetupTierBadge.tsx` — badge Bronze/Argent/Or avec animations
- `src/components/business-setup/LivePreviewCard.tsx` — mini-aperçu fiche publique
- `src/hooks/useBusinessSetupTier.ts` — calcule palier courant + prochain + récompense
- `src/hooks/useBusinessSocialProof.ts` — fetch "X prestataires dans la ville", "Y demandes catégorie"

**Fichiers modifiés :**
- `src/hooks/useBusinessOnboarding.ts` — exposer `nextTier`, `currentTier`, `tierBenefits`, intégrer notion de partage et nombre de produits ≥3/≥5
- `src/components/BusinessOnboardingChecklist.tsx` — nouveau header palier + bénéfices chiffrés par ligne + CTA "Mode immersif"
- `src/components/BusinessOnboardingModal.tsx` — devient un déclencheur léger qui propose "Lancer le parcours guidé" (redirige vers `/business/setup`) ou la checklist rapide
- `src/components/AddBusinessModal.tsx` — après création, redirection automatique vers `/business/setup?new=true`
- `src/App.tsx` (ou fichier de routes) — ajouter route protégée `/business/setup`
- `src/components/BusinessCard.tsx` (et `VendorHeaderCard.tsx` si pertinent) — afficher le `setup_tier` Bronze/Argent/Or sur la fiche publique

**Animations / UX :**
- Framer Motion (déjà utilisé) pour transitions entre étapes
- `canvas-confetti` (déjà utilisé) pour célébrer chaque palier atteint
- Toasts `sonner` pour annoncer les badges débloqués

### Comportement côté client

- À la fin de chaque étape, on `refreshOnboarding()` puis on vérifie si un nouveau palier est atteint — si oui, on déclenche confettis + toast + persistance `setup_tier` (la DB le calculera aussi via trigger, le client est juste réactif)
- Le bouton "Plus tard" referme proprement le wizard et stocke un drapeau `setup_paused_at` en `localStorage` pour relancer la checklist sticky
- Les utilisateurs ayant déjà atteint Or ne voient plus rien (parité avec la logique actuelle `progress === 100`)

---

## Ce qui n'est PAS dans le scope

- Pas de paiement réel ni de logique fiscale liée aux paliers (les "récompenses" sont visuelles et de visibilité)
- Pas de modification du tri réel `/shop` dans cette première itération (badge affiché, mais boost de tri sera une étape suivante si validée)
- Pas de refonte du `BusinessProfileSettings` lui-même — on s'y rend pour les configurations détaillées
- Pas de traduction ni de support multi-langue au-delà du français existant
