
# Amélioration des Mots-Clés et Meta Tags SEO

## Analyse de l'Existant

### Points forts actuels
- Composant `SEOHead.tsx` bien structuré avec support complet (OG, Twitter, AI tags)
- Configuration centralisée `SEO_CONFIGS` pour les pages principales
- Tags AI/LLM (ai-content-type, ai-summary, ai-keywords)
- Support multi-pages : landing, shop, about, faq, funds, product, business

### Lacunes identifiées

| Zone | Problème |
|------|----------|
| Keywords Landing | Manque termes : "financement participatif", "crowdfunding cadeau", "cotisation groupe" |
| Keywords Shop | Manque : "panier cadeau", "livraison Abidjan", "commande en ligne Afrique" |
| Keywords Produit | Génériques, pas de catégorie dynamique |
| Keywords Cagnotte | Pas de termes "pot commun", "collecte argent", "financer cadeau" |
| Long-tail | Aucune phrase clé longue ("où acheter cadeau anniversaire Abidjan") |
| Villes secondaires | Keywords insuffisants pour Bouaké, Yamoussoukro, Porto-Novo |
| Occasions | Pas de keywords spécifiques Tabaski, Pâques, Fête des Pères |
| Concurrence | Termes génériques vs. différenciateurs ("sans commission", "100% mobile") |

---

## Plan d'Implémentation

### 1. Enrichir `SEO_CONFIGS` dans `SEOHead.tsx`

Ajouter des mots-clés manquants à chaque configuration existante.

**Landing Page (actuel → enrichi) :**
```typescript
// AVANT
keywords: "cadeaux Abidjan, cagnotte anniversaire Côte d'Ivoire, cadeau groupe Afrique..."

// APRÈS
keywords: "cadeaux Abidjan, cagnotte anniversaire Côte d'Ivoire, cadeau groupe Afrique, pot commun en ligne, cotisation cadeau collectif, financement participatif cadeau, crowdfunding anniversaire Afrique, collecte argent mariage, offrir ensemble cadeau, cagnotte sans frais, Orange Money cadeaux"
```

**Shop/Marketplace (enrichi) :**
```typescript
keywords: "boutique cadeaux Abidjan, artisanat Côte d'Ivoire, bijoux africains, cadeaux locaux Afrique, mode ivoirienne, panier cadeau en ligne, livraison express Abidjan, commande cadeau WhatsApp, achat Mobile Money, artisans vérifiés, cadeaux personnalisés Afrique"
```

**Cagnottes Publiques (enrichi) :**
```typescript
keywords: "cagnotte collective, cadeau groupe, anniversaire, mariage, contribution, pot commun Afrique, collecte cadeau en ligne, financer ensemble, cotisation groupe cadeau, cagnotte participative"
```

### 2. Créer un fichier de keywords centralisé

**Fichier :** `src/data/seo-keywords.ts`

Centraliser tous les mots-clés par catégorie pour faciliter la maintenance et l'utilisation dynamique.

```typescript
export const SEO_KEYWORDS = {
  // Termes principaux
  core: [
    "cadeaux collaboratifs",
    "cagnotte collective",
    "pot commun en ligne",
    "cadeau groupe",
  ],
  
  // Par type d'occasion
  occasions: {
    birthday: ["cagnotte anniversaire", "cadeau anniversaire groupe", "surprise anniversaire"],
    wedding: ["cagnotte mariage", "cadeau mariage collectif", "liste de mariage Afrique"],
    baby: ["cagnotte naissance", "cadeau bébé groupe", "baby shower Afrique"],
    graduation: ["cagnotte diplôme", "cadeau réussite examen"],
    promotion: ["cagnotte promotion", "cadeau collègue", "pot de départ"],
    religious: ["cagnotte Tabaski", "cadeau Noël collectif", "Pâques Afrique"],
  },
  
  // Par ville
  cities: {
    abidjan: ["cadeaux Abidjan", "livraison Cocody", "artisans Yopougon", "boutique Plateau"],
    cotonou: ["cadeaux Cotonou", "artisanat Dantokpa", "livraison Bénin"],
    dakar: ["cadeaux Dakar", "artisanat sénégalais", "teranga cadeaux"],
    bouake: ["cadeaux Bouaké", "artisanat baoulé", "région Gbêkê"],
  },
  
  // Par catégorie produit
  products: {
    mode: ["mode africaine", "boubou wax", "pagne tissé", "vêtements traditionnels"],
    bijoux: ["bijoux africains", "or artisanal", "perles africaines", "collier fait-main"],
    gastronomie: ["gâteau personnalisé Abidjan", "panier gourmand Afrique", "chocolat artisanal"],
    fleurs: ["fleuriste Abidjan", "bouquet livraison", "compositions florales"],
  },
  
  // Paiements (différenciateur)
  payment: [
    "Orange Money cadeaux",
    "MTN Mobile Money",
    "Wave paiement",
    "paiement mobile Afrique",
    "sans carte bancaire",
  ],
  
  // Long-tail (questions utilisateurs)
  longTail: [
    "où acheter cadeau anniversaire Abidjan",
    "comment créer cagnotte en ligne Afrique",
    "meilleur site cadeau collectif Côte d'Ivoire",
    "offrir cadeau groupe sans frais",
    "artisans locaux cadeaux personnalisés",
  ],
};

// Helper pour générer une chaîne de keywords
export function buildKeywords(categories: (keyof typeof SEO_KEYWORDS)[]): string {
  return categories
    .flatMap(cat => Array.isArray(SEO_KEYWORDS[cat]) 
      ? SEO_KEYWORDS[cat] 
      : Object.values(SEO_KEYWORDS[cat]).flat())
    .slice(0, 20) // Limite pour éviter le keyword stuffing
    .join(", ");
}
```

### 3. Enrichir les Meta Tags des Pages Dynamiques

**ProductPreview.tsx - Keywords dynamiques par catégorie :**
```typescript
// AVANT
keywords={`${product.name}, cadeau Abidjan, ${product.vendor_name}, boutique Côte d'Ivoire, cadeaux Afrique`}

// APRÈS (avec catégorie)
keywords={`${product.name}, ${product.category || 'cadeau'} Abidjan, ${product.vendor_name}, artisanat ivoirien, idée cadeau ${product.category?.toLowerCase() || ''}, livraison Côte d'Ivoire, achat Mobile Money`}
```

**FundPreview.tsx - Keywords par occasion :**
```typescript
// AVANT
keywords={`cagnotte ${fund.occasion || 'collective'}, cadeau groupe, contribution en ligne`}

// APRÈS
keywords={`cagnotte ${fund.occasion || 'collective'}, pot commun ${fund.occasion || ''}, cotisation cadeau, financer ensemble, collecte argent ${fund.occasion || 'cadeau'}, offrir à plusieurs Afrique`}
```

### 4. Enrichir les Pages Villes (city-pages.ts)

Ajouter des mots-clés long-tail et différenciateurs pour chaque ville.

**Exemple Abidjan (enrichi) :**
```typescript
keywords: [
  // Existants
  'cadeaux Abidjan',
  'cagnotte anniversaire Cocody',
  // Nouveaux - Long-tail
  'où acheter cadeau Abidjan livraison rapide',
  'meilleur site cagnotte Côte d\'Ivoire',
  'artisans locaux cadeaux uniques Abidjan',
  // Nouveaux - Paiement
  'payer cadeau Orange Money',
  'achat sans carte bancaire Abidjan',
  // Nouveaux - Occasions locales
  'cadeau Fête des Mères Abidjan',
  'cagnotte Tabaski Côte d\'Ivoire',
]
```

### 5. Enrichir llms-full.txt avec Mots-Clés Supplémentaires

Ajouter une section "Termes de Recherche Alternatifs" pour les AI crawlers.

### 6. Enrichir context.md

Ajouter des phrases naturelles contenant les mots-clés pour le contexte conversationnel des LLMs.

### 7. Mettre à jour index.html

Enrichir les meta keywords statiques dans le `<head>` avec les nouveaux termes.

---

## Fichiers à Créer/Modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| Créer | `src/data/seo-keywords.ts` | Base centralisée de mots-clés |
| Modifier | `src/components/SEOHead.tsx` | Enrichir SEO_CONFIGS |
| Modifier | `src/pages/ProductPreview.tsx` | Keywords dynamiques par catégorie |
| Modifier | `src/pages/FundPreview.tsx` | Keywords par occasion |
| Modifier | `src/data/city-pages.ts` | Keywords long-tail par ville |
| Modifier | `public/llms-full.txt` | Section termes alternatifs |
| Modifier | `public/context.md` | Phrases naturelles SEO |
| Modifier | `index.html` | Meta keywords enrichis |

---

## Nouveaux Mots-Clés par Catégorie

### Termes Généraux (Core)
| Nouveau | Justification |
|---------|---------------|
| pot commun en ligne | Terme courant en Afrique francophone |
| cotisation cadeau | Usage local fréquent |
| financement participatif cadeau | Version française de "crowdfunding" |
| collecte argent mariage/anniversaire | Recherche directe |
| offrir ensemble | Intention collaborative |

### Occasions Spécifiques
| Occasion | Nouveaux Keywords |
|----------|-------------------|
| Tabaski | cagnotte Tabaski, cadeau Aïd, fête religieuse |
| Fête des Mères | cadeau maman Afrique, fête des mères Abidjan |
| Noël | cagnotte Noël, cadeau fin d'année collectif |
| Diplôme | cagnotte baccalauréat, cadeau réussite scolaire |

### Différenciateurs Concurrentiels
| Terme | Message |
|-------|---------|
| sans frais de création | Gratuit pour l'organisateur |
| paiement 100% mobile | Pas besoin de carte bancaire |
| artisans vérifiés | Qualité garantie |
| livraison express | Rapidité |

### Long-Tail (Questions)
| Question Type | Exemples |
|---------------|----------|
| "Où..." | où acheter cadeau anniversaire Abidjan |
| "Comment..." | comment créer cagnotte collective |
| "Meilleur..." | meilleur site cadeau groupe Afrique |
| "Quel..." | quel cadeau offrir collègue promotion |

---

## Impact Attendu

- **SEO Organique** : Meilleur classement sur requêtes long-tail
- **AI Search** : Contexte enrichi pour ChatGPT, Perplexity, Claude
- **Réseaux Sociaux** : Descriptions plus pertinentes lors du partage
- **Conversion** : Utilisateurs trouvent la plateforme via termes qu'ils utilisent réellement

---

## Estimation

- **Complexité** : Faible à moyenne
- **Fichiers créés** : 1
- **Fichiers modifiés** : 7
- **Nouveaux mots-clés** : 50+
