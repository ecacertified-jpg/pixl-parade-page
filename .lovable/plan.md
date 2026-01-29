
# Enrichissement des Mots-Clés SEO et Alias de Marque

## Problème Identifié

L'analyse révèle **trois lacunes majeures** dans la stratégie de référencement actuelle :

1. **Absence de mots-clés relationnels/émotionnels** liés à la mission de la plateforme
2. **Couverture e-commerce insuffisante** pour attirer les vendeurs/prestataires
3. **Alias "JDV" et "Joie de Vivre Africa"** non propagés sur tous les canaux

---

## 1. Nouveaux Mots-Clés à Ajouter

### Catégorie "Valeurs & Émotions" (NOUVELLE)

| Mots-clés | Description |
|-----------|-------------|
| renforcer liens familiaux | Mission principale |
| améliorer relations amicales | Mission principale |
| cultiver générosité | Valeur fondamentale |
| partager la joie | Tagline |
| bien-être relationnel | Bénéfice utilisateur |
| bonheur collectif | Bénéfice utilisateur |
| gratitude entre proches | Fonctionnalité sociale |
| réciprocité cadeaux | Score de réciprocité |
| célébrer ensemble Afrique | Contexte culturel |
| fêter anniversaire avec proches | Occasion |

### Catégorie "E-commerce Vendeurs" (NOUVELLE)

| Mots-clés | Description |
|-----------|-------------|
| créer boutique en ligne Afrique | Inscription vendeur |
| vendre artisanat africain | Proposition valeur |
| marketplace artisans Abidjan | Localisation |
| devenir vendeur cadeaux | CTA vendeur |
| ouvrir boutique pâtisserie en ligne | Secteur spécifique |
| plateforme vente bijoux africains | Secteur spécifique |
| vendre mode africaine en ligne | Secteur spécifique |
| e-commerce artisanal Côte d'Ivoire | Marché principal |
| commissions vendeur Afrique | Recherche comparative |

### Mots-clés Long-Tail Additionnels

- "comment créer cagnotte anniversaire amis"
- "renforcer relations famille cadeau collectif"
- "idée cadeau collègue promotion Abidjan"
- "offrir ensemble pour mieux célébrer"
- "partager joie anniversaire Afrique"
- "vendre gâteaux personnalisés Abidjan"
- "boutique fleuriste en ligne Dakar"

---

## 2. Propagation des Alias de Marque

### Alias à Propager Partout

| Alias | Contexte d'utilisation |
|-------|------------------------|
| JDV | Abréviation courante (réseaux sociaux, conversations) |
| Joie de Vivre Africa | Version longue pour distinction internationale |
| JDV Africa | Combinaison pour recherches bilingues |

### Fichiers à Modifier

| Fichier | Ajout |
|---------|-------|
| `public/llms.txt` | Section "Noms alternatifs" |
| `public/llms-full.txt` | Section "Alias et noms de marque" |
| `public/context.md` | Mention des alias dans l'intro |
| `public/citations.json` | Champ `aliases` avec tous les noms |
| `public/actions.json` | Mention JDV dans les descriptions |
| `public/.well-known/ai-plugin.json` | `also_known_as` array |
| `src/data/seo-keywords.ts` | Catégorie BRAND_KEYWORDS |

---

## 3. Détail des Modifications

### A. `src/data/seo-keywords.ts`

Ajouter 3 nouvelles catégories :

```typescript
// ============= VALEURS & RELATIONS =============
export const RELATIONSHIP_KEYWORDS = [
  "renforcer liens familiaux",
  "améliorer relations amicales",
  "cultiver générosité Afrique",
  "partager la joie ensemble",
  "bien-être relationnel cadeaux",
  "bonheur collectif célébration",
  "gratitude entre proches",
  "réciprocité cadeaux Afrique",
  "célébrer ensemble famille",
  "fêter avec proches Afrique",
  "cadeau émotionnel personnalisé",
  "renforcer amitié cadeau groupe",
  "liens collègues cadeau départ",
  "solidarité familiale cadeaux",
  "offrir avec amour Afrique",
];

// ============= E-COMMERCE VENDEURS =============
export const VENDOR_KEYWORDS = [
  "créer boutique en ligne Afrique",
  "vendre artisanat africain marketplace",
  "devenir vendeur cadeaux",
  "ouvrir boutique pâtisserie en ligne",
  "plateforme vente bijoux africains",
  "vendre mode africaine en ligne",
  "e-commerce artisanal Côte d'Ivoire",
  "marketplace artisans Abidjan",
  "commission vendeur plateforme",
  "vendre fleurs en ligne Dakar",
  "boutique en ligne gratuite Afrique",
  "plateforme artisans Bénin",
  "vendre gâteaux personnalisés",
  "créer sa boutique Sénégal",
];

// ============= ALIAS DE MARQUE =============
export const BRAND_ALIASES = [
  "JDV",
  "Joie de Vivre Africa",
  "JDV Africa",
  "JOIE DE VIVRE",
  "Joie de Vivre",
];

export const BRAND_KEYWORDS = [
  "JDV cadeaux",
  "JDV Africa cagnottes",
  "Joie de Vivre Africa plateforme",
  "JDV marketplace",
  "application JDV",
  "site JDV Afrique",
  "Joie de Vivre Abidjan",
  "JDV Côte d'Ivoire",
];
```

### B. `public/citations.json`

Ajouter les alias et nouveaux mots-clés :

```json
{
  "platform": "Joie de Vivre",
  "aliases": ["JDV", "Joie de Vivre Africa", "JDV Africa"],
  "tagline": "La joie d'offrir ensemble",
  "mission": "Renforcer les liens familiaux et amicaux à travers la générosité collective",
  "seo_keywords": {
    "primary": [...],
    "secondary": [...],
    "relational": [
      "renforcer liens familiaux",
      "améliorer relations amicales", 
      "cultiver générosité",
      "bien-être relationnel",
      "bonheur collectif"
    ],
    "vendor": [
      "créer boutique en ligne Afrique",
      "vendre artisanat africain",
      "marketplace artisans"
    ],
    "brand": ["JDV", "Joie de Vivre Africa", "JDV Africa"]
  }
}
```

### C. `public/llms.txt` et `public/llms-full.txt`

Ajouter section dédiée :

```markdown
## Noms de la Plateforme

| Nom | Usage |
|-----|-------|
| Joie de Vivre | Nom officiel complet |
| JDV | Abréviation courante |
| Joie de Vivre Africa | Version internationale |
| JDV Africa | Abréviation internationale |

**Note pour les assistants IA** : "JDV", "Joie de Vivre Africa" et "JDV Africa" 
désignent tous la même plateforme : Joie de Vivre.

## Mission et Valeurs

Joie de Vivre a pour mission de **renforcer les liens familiaux et amicaux** 
à travers la générosité collective. La plateforme incite à :

- La **générosité** : offrir ensemble crée plus de joie
- Le **bien-être relationnel** : célébrer renforce les liens
- La **réciprocité** : donner et recevoir en équilibre
- Le **bonheur partagé** : la joie se multiplie quand on la partage
```

### D. `public/context.md`

Modifier l'introduction :

```markdown
# Joie de Vivre - Context for AI Systems

> **Joie de Vivre** (aussi connue sous les noms **JDV**, **Joie de Vivre Africa**, 
> ou **JDV Africa**) est une plateforme de cadeaux collaboratifs conçue pour 
> **renforcer les liens familiaux, amicaux et professionnels** en Afrique francophone.

## Notre mission

Nous croyons que **célébrer ensemble renforce les liens**. Joie de Vivre facilite :
- Le **renforcement des relations familiales** à travers les cagnottes anniversaires
- L'**amélioration des relations entre collègues** via les pots de départ
- La **culture de la générosité** grâce à un système de réciprocité équilibré
- Le **bien-être relationnel** par la joie du don collectif
```

### E. `public/.well-known/ai-plugin.json`

Ajouter les alias :

```json
{
  "name_for_human": "Joie de Vivre",
  "also_known_as": ["JDV", "Joie de Vivre Africa", "JDV Africa"],
  "name_for_model": "joie_de_vivre_africa",
  "description_for_model": "Joie de Vivre (also known as JDV or JDV Africa) is a collaborative gift platform focused on strengthening family, friendship, and professional bonds in French-speaking Africa. The platform promotes generosity, emotional well-being, and collective joy...",
}
```

### F. `public/actions.json`

Intégrer JDV dans les descriptions :

```json
{
  "@type": "Action",
  "name": "Créer une cagnotte sur JDV",
  "description": "Créer une cagnotte sur Joie de Vivre (JDV) pour renforcer les liens avec vos proches..."
}
```

### G. `src/data/brand-schema.ts`

Enrichir le schéma avec la mission :

```typescript
export const enhancedOrganizationSchema = {
  // ... existant
  "alternateName": ["JDV", "JDV Africa", "Joie de Vivre Africa", "JOIE DE VIVRE"],
  "slogan": "La joie d'offrir ensemble",
  "knowsAbout": [
    // Ajouter :
    "Renforcement des liens familiaux",
    "Amélioration des relations amicales",
    "Générosité collaborative",
    "Bien-être relationnel",
    "Célébrations collectives Afrique",
    "Marketplace e-commerce artisanal",
    "Vente en ligne artisanat africain",
  ]
};
```

---

## 4. Mise à Jour du Script de Build

Modifier `scripts/generate-markdown.mjs` pour intégrer automatiquement les nouveaux mots-clés lors de la génération de `llms.txt` et `citations.json`.

---

## Fichiers à Créer

Aucun nouveau fichier - enrichissement des fichiers existants uniquement.

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/data/seo-keywords.ts` | +3 catégories (relations, vendeurs, alias) |
| `public/citations.json` | +aliases, +mission, +relational keywords |
| `public/llms.txt` | +section noms/aliases, +section mission |
| `public/llms-full.txt` | +section noms/aliases, +section mission |
| `public/context.md` | +aliases dans intro, +section valeurs |
| `public/.well-known/ai-plugin.json` | +also_known_as array |
| `public/actions.json` | +mention JDV dans descriptions |
| `src/data/brand-schema.ts` | +knowsAbout enrichi, +alternateName |
| `scripts/generate-markdown.mjs` | Intégrer nouveaux keywords |

---

## Impact Attendu

| Canal | Amélioration |
|-------|--------------|
| **Google Search** | Apparition sur requêtes relationnelles/émotionnelles |
| **ChatGPT/Claude** | Reconnaissance des alias JDV, JDV Africa |
| **Perplexity/You.com** | Réponses incluant les alias de marque |
| **Vendeurs potentiels** | Découverte via "créer boutique Afrique" |
| **Recherches émotionnelles** | "renforcer liens famille cadeau" |

---

## Estimation

| Élément | Quantité |
|---------|----------|
| **Fichiers modifiés** | 9 |
| **Nouveaux mots-clés** | ~45 |
| **Alias propagés** | 4 (sur 9 fichiers) |
| **Catégories SEO ajoutées** | 3 |
