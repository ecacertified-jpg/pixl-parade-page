

# Plan d'Implémentation - Stratégie SEO Landing Pages

## Vue d'Ensemble

Ce plan implémente 3 stratégies d'acquisition SEO majeures :
1. **Landing Pages par Occasion** (8 pages) - Acquisition clients B2C
2. **Landing Pages Vendeurs par Secteur** (6 pages) - Recrutement B2B
3. **Pages Saisonnières 2026** (5 pages) - Timing événements

**Architecture choisie** : Système data-driven comme les City Pages existantes (extensible, maintenable, Schema.org automatique).

---

## 1. Landing Pages par Occasion (Acquisition B2C)

### Pages à Créer

| URL | Occasion | Cible SEO |
|-----|----------|-----------|
| `/cagnotte-anniversaire` | Anniversaire | "cagnotte anniversaire", "pot commun anniversaire" |
| `/cagnotte-mariage` | Mariage | "cagnotte mariage", "liste mariage Afrique" |
| `/cagnotte-naissance` | Naissance/Baptême | "cagnotte naissance", "baby shower Afrique" |
| `/cagnotte-diplome` | Diplôme/Bac | "cagnotte baccalauréat", "cadeau réussite examen" |
| `/cagnotte-promotion` | Promotion/Départ | "pot de départ", "cadeau collègue promotion" |
| `/cagnotte-retraite` | Retraite | "cagnotte retraite", "cadeau départ retraite" |
| `/cagnotte-fete-meres` | Fête des Mères | "cadeau Fête des Mères", "cagnotte maman" |
| `/cagnotte-fete-peres` | Fête des Pères | "cadeau Fête des Pères", "cagnotte papa" |

### Structure de Données

**Fichier** : `src/data/occasion-pages.ts`

```typescript
export interface OccasionPageData {
  slug: string;                    // URL
  occasion: string;                // Nom occasion
  emoji: string;                   // Emoji principal
  heroTitle: string;               // H1 optimisé SEO
  heroSubtitle: string;            // Accroche
  description: string;             // Description complète
  metaDescription: string;         // Meta (160 chars)
  keywords: string[];              // Mots-clés SEO (15+)
  benefits: {                      // Avantages
    icon: string;
    title: string;
    description: string;
  }[];
  giftIdeas: string[];             // Idées cadeaux suggérées
  testimonials: {                  // Témoignages localisés
    name: string;
    text: string;
    city: string;
  }[];
  faqs: {                          // FAQ localisée
    question: string;
    answer: string;
  }[];
  relatedOccasions: string[];      // Liens croisés
  stats: {                         // Statistiques
    fundCreated: string;
    avgAmount: string;
    contributors: string;
  };
}
```

### Composant Page

**Fichier** : `src/pages/OccasionPage.tsx`

Sections :
- **Hero** : Titre H1 + CTA "Créer ma cagnotte gratuite" → `/auth`
- **Comment ça marche** : 3 étapes avec icônes
- **Avantages** : 4-6 bénéfices spécifiques à l'occasion
- **Idées cadeaux** : Suggestions avec liens vers Shop filtré
- **Témoignages** : 3 témoignages localisés
- **FAQ** : 4-5 questions avec Schema.org FAQPage
- **CTA Final** : Double CTA → Inscription + Boutique

### Schema.org

Chaque page génère automatiquement :
- `FAQPageSchema` avec questions localisées
- `HowToSchema` : "Comment créer une cagnotte {occasion}"
- `BreadcrumbListSchema` : Accueil → Cagnottes → {Occasion}
- `WebPageSchema` avec `mainEntity` et `audience`

---

## 2. Landing Pages Vendeurs par Secteur (B2B)

### Pages à Créer

| URL | Secteur | Cible |
|-----|---------|-------|
| `/devenir-vendeur/patisserie` | Pâtisserie/Gâteaux | Pâtissiers, boulangers |
| `/devenir-vendeur/fleuriste` | Fleurs | Fleuristes |
| `/devenir-vendeur/mode` | Mode/Wax | Stylistes, couturiers |
| `/devenir-vendeur/bijoux` | Bijoux | Bijoutiers, créateurs |
| `/devenir-vendeur/spa` | Bien-être/Spa | Spas, masseurs |
| `/devenir-vendeur/traiteur` | Traiteur/Événements | Traiteurs, décorateurs |

### Structure de Données

**Fichier** : `src/data/vendor-sector-pages.ts`

```typescript
export interface VendorSectorPageData {
  slug: string;                    // URL segment
  sector: string;                  // Nom secteur
  emoji: string;                   // Emoji secteur
  heroTitle: string;               // H1 B2B
  heroSubtitle: string;            // Accroche vendeurs
  description: string;             // Description SEO
  metaDescription: string;         // Meta B2B
  keywords: string[];              // Keywords B2B
  benefits: {                      // Avantages pour vendeurs
    icon: string;
    title: string;
    description: string;
  }[];
  features: {                      // Fonctionnalités plateforme
    title: string;
    description: string;
  }[];
  successStories: {                // Témoignages vendeurs
    businessName: string;
    ownerName: string;
    quote: string;
    metric: string;                // "50+ commandes/mois"
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  pricing: {                       // Modèle tarifaire
    joinFee: string;
    commission: string;
    payoutDelay: string;
  };
  requirements: string[];          // Critères d'éligibilité
}
```

### Composant Page

**Fichier** : `src/pages/VendorSectorPage.tsx`

Sections :
- **Hero B2B** : "Vendez vos {produits} sur JOIE DE VIVRE" + CTA → `/business-auth`
- **Pourquoi nous rejoindre** : 4 avantages (visibilité, paiements, support, cagnottes)
- **Fonctionnalités** : Dashboard, notifications, stats
- **Témoignages vendeurs** : Success stories avec métriques
- **Tarification** : Transparence sur commissions
- **Critères** : Qui peut s'inscrire
- **FAQ secteur** : Questions spécifiques au métier
- **CTA Final** : "Créer ma boutique gratuite" → `/business-auth`

### Schema.org

- `LocalBusinessSchema` (type selon secteur)
- `FAQPageSchema`
- `HowToSchema` : "Comment devenir vendeur {secteur}"
- `BreadcrumbListSchema`

---

## 3. Pages Saisonnières 2026

### Pages à Créer

| URL | Événement | Date 2026 |
|-----|-----------|-----------|
| `/tabaski-2026` | Tabaski (Eid al-Adha) | ~7 juin 2026 |
| `/korite-2026` | Korité (Eid al-Fitr) | ~20 mars 2026 |
| `/fete-meres-2026` | Fête des Mères | 31 mai 2026 |
| `/noel-2026` | Noël | 25 décembre 2026 |
| `/rentree-scolaire-2026` | Rentrée Scolaire | Septembre 2026 |

### Structure de Données

**Fichier** : `src/data/seasonal-pages.ts`

```typescript
export interface SeasonalPageData {
  slug: string;                    // URL avec année
  event: string;                   // Nom événement
  year: number;                    // Année
  emoji: string;                   // Emoji
  date: string;                    // Date formatée
  dateISO: string;                 // Date ISO pour Schema
  isVariable: boolean;             // Date variable (religieux)
  heroTitle: string;               // H1 avec année
  heroSubtitle: string;            // Accroche saisonnière
  description: string;             // Description
  metaDescription: string;         // Meta avec année
  keywords: string[];              // Keywords saisonniers
  countdown: boolean;              // Afficher compte à rebours
  giftSuggestions: {               // Cadeaux suggérés
    category: string;
    description: string;
    link: string;
  }[];
  traditions: {                    // Contexte culturel
    title: string;
    description: string;
  }[];
  fundIdeas: {                     // Idées de cagnottes
    title: string;
    description: string;
  }[];
  testimonials: {
    name: string;
    text: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}
```

### Composant Page

**Fichier** : `src/pages/SeasonalPage.tsx`

Sections :
- **Hero saisonnier** : Titre avec année + compte à rebours (J-XX)
- **Contexte culturel** : Signification de la fête (important pour SEO)
- **Idées cagnottes** : Suggestions adaptées à l'événement
- **Cadeaux suggérés** : Liens vers Shop filtré par catégorie
- **Témoignages** : Histoires de célébrations passées
- **FAQ** : Questions spécifiques à l'événement
- **CTA** : "Préparez votre cagnotte {événement}"

### Schema.org

- `EventSchema` : Événement avec date, lieu (Côte d'Ivoire/Afrique)
- `FAQPageSchema`
- `BreadcrumbListSchema`
- `ArticleSchema` (pour le contenu culturel)

---

## Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `src/data/occasion-pages.ts` | Données 8 occasions |
| `src/data/vendor-sector-pages.ts` | Données 6 secteurs vendeurs |
| `src/data/seasonal-pages.ts` | Données 5 événements 2026 |
| `src/pages/OccasionPage.tsx` | Composant pages occasion |
| `src/pages/VendorSectorPage.tsx` | Composant pages vendeur |
| `src/pages/SeasonalPage.tsx` | Composant pages saisonnières |

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/App.tsx` | Ajouter 3 nouvelles routes dynamiques |
| `src/data/seo-keywords.ts` | Ajouter `ACQUISITION_KEYWORDS` et `SEASONAL_KEYWORDS` |
| `src/components/SEOHead.tsx` | Ajouter configs pour nouvelles pages |
| `src/pages/Landing.tsx` | Liens vers nouvelles pages dans footer |

---

## Routes à Ajouter (App.tsx)

```typescript
// Occasion Pages (lazy loaded)
const OccasionPage = lazy(() => import("./pages/OccasionPage"));

// Vendor Sector Pages (lazy loaded)
const VendorSectorPage = lazy(() => import("./pages/VendorSectorPage"));

// Seasonal Pages (lazy loaded)
const SeasonalPage = lazy(() => import("./pages/SeasonalPage"));

// Routes
<Route path="/cagnotte-:occasionSlug" element={<OccasionPage />} />
<Route path="/devenir-vendeur/:sectorSlug" element={<VendorSectorPage />} />
<Route path="/:eventSlug-:year" element={<SeasonalPage />} />
```

---

## SEO Keywords à Ajouter

**Fichier** : `src/data/seo-keywords.ts`

```typescript
// ACQUISITION KEYWORDS (B2C)
export const ACQUISITION_KEYWORDS = {
  registration: [
    "créer compte gratuit",
    "inscription gratuite",
    "s'inscrire cagnotte",
    "créer cagnotte en ligne",
    "ouvrir compte cadeaux",
  ],
  trust: [
    "plateforme sécurisée",
    "paiement sécurisé Afrique",
    "site fiable cadeaux",
    "avis utilisateurs",
  ],
  comparison: [
    "meilleur site cagnotte Afrique",
    "alternative Leetchi Afrique",
    "cagnotte sans frais",
    "pot commun gratuit",
  ],
};

// VENDOR KEYWORDS (B2B)
export const VENDOR_KEYWORDS = {
  general: [
    "devenir vendeur",
    "vendre en ligne Afrique",
    "créer boutique en ligne",
    "marketplace artisans",
  ],
  patisserie: [
    "vendre gâteaux en ligne",
    "pâtissier Abidjan",
    "commandes gâteaux anniversaire",
  ],
  fleuriste: [
    "fleuriste en ligne Abidjan",
    "vendre bouquets livraison",
  ],
  // ... autres secteurs
};

// SEASONAL KEYWORDS
export const SEASONAL_KEYWORDS = {
  tabaski: [
    "Tabaski 2026",
    "cagnotte Aïd el-Kebir",
    "cadeau mouton Tabaski",
    "cagnotte Tabaski Côte d'Ivoire",
  ],
  korite: [
    "Korité 2026",
    "cagnotte Eid al-Fitr",
    "cadeau fin Ramadan",
  ],
  // ... autres événements
};
```

---

## Données Exemples

### Occasion : Anniversaire
```typescript
{
  slug: 'anniversaire',
  occasion: 'Anniversaire',
  emoji: '🎂',
  heroTitle: 'Cagnotte Anniversaire - Offrez Ensemble un Cadeau Inoubliable',
  heroSubtitle: 'Réunissez vos proches pour offrir LE cadeau parfait. Gratuit, simple, via Mobile Money.',
  metaDescription: 'Créez une cagnotte anniversaire gratuite. Collectez les contributions de famille et amis via Orange Money, MTN, Wave. Livraison cadeaux Abidjan.',
  keywords: [
    'cagnotte anniversaire',
    'pot commun anniversaire',
    'cadeau groupe anniversaire',
    'surprise anniversaire collectif',
    'créer cagnotte anniversaire gratuit',
    'collecte argent anniversaire',
    'cadeau anniversaire Abidjan',
    'fêter anniversaire ensemble',
    'contribution anniversaire en ligne',
    'cagnotte anniversaire Orange Money',
  ],
  benefits: [
    { icon: '💰', title: 'Gratuit', description: 'Aucun frais de création ni de commission' },
    { icon: '📱', title: 'Mobile Money', description: 'Orange, MTN, Wave - les moyens de paiement locaux' },
    { icon: '🎁', title: 'Boutique intégrée', description: 'Choisissez parmi 500+ artisans locaux' },
    { icon: '🔔', title: 'Rappels', description: 'Ne ratez plus jamais un anniversaire' },
  ],
  giftIdeas: ['Bijoux personnalisés', 'Gâteau sur mesure', 'Expérience spa', 'Tenue wax'],
  faqs: [
    { 
      question: 'Comment créer une cagnotte anniversaire ?', 
      answer: 'Inscrivez-vous gratuitement, cliquez sur "Créer une cagnotte", choisissez "Anniversaire" et personnalisez votre page. Partagez le lien par WhatsApp !' 
    },
    // ... 4 autres FAQs
  ],
}
```

### Vendeur : Pâtisserie
```typescript
{
  slug: 'patisserie',
  sector: 'Pâtisserie & Gâteaux',
  emoji: '🎂',
  heroTitle: 'Vendez vos Gâteaux sur JOIE DE VIVRE - Plateforme #1 Cadeaux Abidjan',
  heroSubtitle: 'Recevez des commandes de gâteaux d\'anniversaire, mariages et événements. Paiement sécurisé, livraison organisée.',
  benefits: [
    { icon: '📦', title: '50+ commandes/mois', description: 'Nos pâtissiers reçoivent en moyenne 50 commandes mensuelles' },
    { icon: '💳', title: 'Paiement garanti', description: 'Recevez l\'argent avant de préparer la commande' },
    { icon: '🚚', title: 'Livraison optionnelle', description: 'Livrez vous-même ou utilisez nos partenaires' },
    { icon: '📊', title: 'Dashboard pro', description: 'Gérez vos commandes, stocks et statistiques' },
  ],
  successStories: [
    { 
      businessName: 'Sweet Délices', 
      ownerName: 'Aminata', 
      quote: 'Depuis que je suis sur JDV, mes commandes ont triplé !', 
      metric: '150+ gâteaux/mois' 
    },
  ],
  requirements: [
    'Disposer d\'un local de production',
    'Avoir une carte nationale d\'identité valide',
    'Pouvoir livrer à Abidjan ou utiliser nos partenaires',
  ],
}
```

### Saisonnier : Tabaski 2026
```typescript
{
  slug: 'tabaski',
  event: 'Tabaski',
  year: 2026,
  emoji: '🐑',
  date: '7 juin 2026 (date estimée)',
  dateISO: '2026-06-07',
  isVariable: true,
  heroTitle: 'Tabaski 2026 - Préparez votre Cagnotte pour l\'Aïd el-Kebir',
  heroSubtitle: 'Réunissez votre famille pour offrir le mouton ou un cadeau collectif. Contribuez via Mobile Money.',
  countdown: true,
  traditions: [
    { 
      title: 'Une fête de partage', 
      description: 'La Tabaski célèbre le sacrifice et le partage. C\'est l\'occasion parfaite pour offrir ensemble à vos proches.' 
    },
  ],
  fundIdeas: [
    { title: 'Cagnotte Mouton', description: 'Contribuez ensemble pour offrir le mouton à la famille' },
    { title: 'Cagnotte Vêtements', description: 'Offrez de nouveaux habits aux enfants pour la fête' },
  ],
  giftSuggestions: [
    { category: 'Mode', description: 'Tenues traditionnelles et boubous', link: '/shop?category=mode-vetements' },
    { category: 'Bijoux', description: 'Bijoux en or pour les femmes', link: '/shop?category=bijoux-accessoires' },
  ],
}
```

---

## Maillage Interne

### Liens depuis les nouvelles pages

| Depuis | Vers |
|--------|------|
| `/cagnotte-anniversaire` | `/auth`, `/shop`, `/cagnottes`, autres occasions |
| `/devenir-vendeur/patisserie` | `/business-auth`, `/shop?category=gastronomie-delices` |
| `/tabaski-2026` | `/auth`, `/cagnotte-anniversaire`, `/shop` |

### Liens vers les nouvelles pages

| Depuis | Nouveaux liens |
|--------|----------------|
| Landing | Section "Occasions" avec liens vers 8 pages |
| Footer global | Liens "Occasions populaires" + "Devenir vendeur" |
| FAQ | Liens contextuels vers pages occasion |
| Blog/Articles | Liens saisonniers |

---

## Estimation Technique

| Élément | Quantité |
|---------|----------|
| **Fichiers créés** | 6 |
| **Fichiers modifiés** | 4 |
| **Nouvelles pages** | 19 (8 + 6 + 5) |
| **Nouvelles URLs SEO** | 19 |
| **Nouveaux mots-clés** | 100+ |
| **Schémas JSON-LD** | 19 FAQPage + 19 HowTo + 5 Event |

---

## Ordre d'Implémentation Recommandé

1. **Données** : Créer les 3 fichiers de données
2. **Composants** : Créer les 3 composants de page
3. **Routes** : Modifier App.tsx
4. **SEO** : Enrichir seo-keywords.ts
5. **Maillage** : Ajouter liens dans Landing et Footer

