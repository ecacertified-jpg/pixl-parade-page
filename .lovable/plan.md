

# Stratégie de Contenu Réseaux Sociaux - JOIE DE VIVRE

## Objectif

Créer un système centralisé de templates de posts et hashtags pour faciliter le partage cohérent sur les réseaux sociaux par les utilisateurs, vendeurs et l'équipe marketing.

---

## Analyse de l'Existant

### Points forts actuels
- `seo-keywords.ts` : Base centralisée de mots-clés (core, occasions, villes, produits, paiements)
- Composants de partage : `ProductShareMenu`, `BusinessShareMenu`, `ShareFundModal`
- Messages pré-configurés dans `QuickBusinessShareMenu` (6 suggestions)
- Templates de cartes : `ProductShareCard`, `CollectiveFundShareCard`
- Tracking des partages avec analytics Google

### Lacunes identifiées
| Élément | Problème |
|---------|----------|
| **Hashtags** | Aucune base centralisée de hashtags |
| **Templates posts** | Pas de templates variés par occasion/plateforme |
| **Calendrier contenu** | Pas de suggestions par événement du calendrier |
| **Emojis standardisés** | Utilisation inconsistante |
| **Appels à l'action** | CTAs génériques, pas adaptés par plateforme |
| **Vendeurs** | Templates limités (6), pas par catégorie produit |

---

## Plan d'Implémentation

### 1. Créer `src/data/social-media-content.ts`

Fichier central contenant :

**1.1 Base de Hashtags par catégorie**
```typescript
export const HASHTAGS = {
  // Hashtags de marque (toujours inclus)
  brand: ['#JoieDeVivre', '#JDVAfrica', '#CadeauxCollaboratifs'],
  
  // Par plateforme
  instagram: ['#CadeauxAbidjan', '#ArtisanatAfricain', '#MadeInAfrica'],
  twitter: ['#GiftPooling', '#AfricaGifts'],
  facebook: ['#CadeauxGroupe', '#FêteAfrique'],
  tiktok: ['#AfricanGifts', '#CadeauTikTok', '#GiftTok'],
  linkedin: ['#FintechAfrica', '#Ecommerce', '#StartupCI'],
  
  // Par occasion
  birthday: ['#AnniversaireAfrique', '#CagnotteAnniversaire', '#SurpriseParty'],
  wedding: ['#MariageAfricain', '#CagnotteMariage', '#ListeDeMariage'],
  baby: ['#BabyShowerAfrique', '#CagnotteNaissance'],
  graduation: ['#Diplomé', '#RéussiteExamen', '#FiertéAfricaine'],
  promotion: ['#Promotion', '#RéussitePro', '#PotDeDépart'],
  tabaski: ['#Tabaski', '#AidElKebir', '#FêteDesProches'],
  
  // Par ville
  abidjan: ['#Abidjan', '#CIV', '#TeamCI', '#Babi'],
  cotonou: ['#Cotonou', '#Benin', '#BeninTourism'],
  dakar: ['#Dakar', '#Senegal', '#Teranga'],
  
  // Par catégorie produit
  mode: ['#ModeAfricaine', '#WaxPrint', '#AfricanFashion'],
  bijoux: ['#BijouxAfricains', '#Handmade', '#AfricanJewelry'],
  gastronomie: ['#FoodAbidjan', '#GâteauPersonnalisé', '#TraiteurCI'],
}
```

**1.2 Templates de Posts par Type**
```typescript
export const POST_TEMPLATES = {
  // Templates pour produits (vendeurs)
  product: {
    nouveau: {
      text: "🆕 Nouveau produit disponible !\n\n{product_name}\n💰 {price} {currency}\n\n📍 Livraison à {city}\n💳 Paiement {payment}\n\n👉 {url}",
      emoji: "🆕",
    },
    promotion: {
      text: "🔥 Offre spéciale !\n\n{product_name}\n💰 {price} {currency}\n\n⏰ Offre limitée\n📍 {city}\n\n👉 {url}",
      emoji: "🔥",
    },
    bestseller: {
      text: "⭐ Notre best-seller !\n\n{product_name}\n💰 {price} {currency}\n\n❤️ Adoré par nos clients\n📍 {city}\n\n👉 {url}",
      emoji: "⭐",
    },
    // ... autres templates
  },
  
  // Templates pour cagnottes
  fund: {
    creation: {
      text: "🎁 J'organise une cagnotte pour {beneficiary} !\n\n{occasion_emoji} {occasion}\n🎯 Objectif : {target} {currency}\n\n💝 Chaque contribution compte !\n\n👉 Participez ici : {url}",
      emoji: "🎁",
    },
    milestone: {
      text: "🎉 Déjà {percent}% de notre objectif atteint !\n\n🎁 Cagnotte pour {beneficiary}\n💰 {current}/{target} {currency}\n\n🙏 Merci à tous les contributeurs !\n\n👉 {url}",
      emoji: "🎉",
    },
    lastChance: {
      text: "⏰ Derniers jours pour contribuer !\n\n🎁 Cagnotte pour {beneficiary}\n📅 Fin : {deadline}\n💰 Il manque {remaining} {currency}\n\n👉 {url}",
      emoji: "⏰",
    },
  },
  
  // Templates par occasion
  occasions: {
    birthday: {
      text: "🎂 L'anniversaire de {name} approche !\n\nCréons ensemble une belle surprise 🎁\n\n💝 Chaque contribution compte\n📅 Le {date}\n\n👉 {url}",
      hashtags: ['birthday', 'brand'],
    },
    wedding: {
      text: "💒 {names} se marient !\n\nContribuez à leur liste de mariage ✨\n\n🎁 Offrons-leur un cadeau inoubliable\n📅 {date}\n\n👉 {url}",
      hashtags: ['wedding', 'brand'],
    },
    // ... autres occasions
  },
}
```

**1.3 Calendrier Marketing**
```typescript
export const MARKETING_CALENDAR = {
  // Événements récurrents Afrique de l'Ouest
  january: [
    { day: 1, event: "Nouvel An", template: "celebration", hashtags: ['brand'] },
  ],
  february: [
    { day: 14, event: "Saint-Valentin", template: "love", hashtags: ['#Love', '#Valentine'] },
  ],
  march: [
    { day: 8, event: "Journée de la Femme", template: "women", hashtags: ['#8Mars', '#WomenPower'] },
  ],
  may: [
    { day: null, event: "Fête des Mères", template: "mothersDay", hashtags: ['mothersDay', 'brand'] },
  ],
  june: [
    { day: null, event: "Fête des Pères", template: "fathersDay", hashtags: ['#FêteDesPères', '#Papa'] },
    { day: null, event: "Korité/Eid al-Fitr", template: "religious", hashtags: ['#Korité', '#EidMubarak'] },
  ],
  december: [
    { day: 25, event: "Noël", template: "christmas", hashtags: ['#Noël', '#Christmas'] },
    { day: 31, event: "Réveillon", template: "newYear", hashtags: ['#Réveillon', '#NewYear'] },
  ],
  // Tabaski - Date variable
  variable: [
    { event: "Tabaski/Eid al-Adha", template: "tabaski", hashtags: ['tabaski', 'brand'] },
    { event: "Rentrée Scolaire", template: "backToSchool", hashtags: ['#RentréeScolaire', '#École'] },
  ],
};
```

**1.4 Helper Functions**
```typescript
// Génère les hashtags pour un post
export function buildHashtags(
  categories: (keyof typeof HASHTAGS)[],
  limit = 10
): string {
  return categories
    .flatMap(cat => HASHTAGS[cat] || [])
    .slice(0, limit)
    .join(' ');
}

// Génère un post complet avec template
export function generatePost(
  templateType: keyof typeof POST_TEMPLATES,
  templateName: string,
  variables: Record<string, string>,
  platform: 'instagram' | 'facebook' | 'twitter' | 'whatsapp' = 'instagram'
): { text: string; hashtags: string } {
  // ... logique de génération
}

// Adapte un post par plateforme
export function adaptForPlatform(
  text: string,
  platform: string
): string {
  // Twitter: tronquer à 280 caractères
  // WhatsApp: format simple sans hashtags
  // Instagram: limite 30 hashtags
  // ...
}
```

### 2. Créer `src/components/SocialPostGenerator.tsx`

Composant UI pour générer des posts (accessible aux vendeurs et équipe marketing) :

```typescript
interface SocialPostGeneratorProps {
  type: 'product' | 'fund' | 'general';
  data: ProductData | FundData;
  onCopy: (text: string) => void;
}
```

**Fonctionnalités :**
- Sélection de template par catégorie
- Preview du post généré
- Sélection des hashtags à inclure
- Boutons de copie par plateforme
- Compteur de caractères (utile pour Twitter)

### 3. Modifier les Composants de Partage Existants

**3.1 `ProductShareMenu.tsx`**
- Intégrer les nouveaux templates de `social-media-content.ts`
- Ajouter bouton "Copier avec hashtags"
- Preview avec hashtags suggérés

**3.2 `QuickBusinessShareMenu.tsx`**
- Remplacer les 6 suggestions statiques par les templates dynamiques
- Ajouter sélection de hashtags par catégorie produit
- Suggestion intelligente basée sur la catégorie

**3.3 `ShareFundModal.tsx`**
- Intégrer les templates de cagnottes
- Hashtags automatiques par occasion

### 4. Enrichir les Hooks de Partage

**4.1 `useProductShares.ts`**
```typescript
// Ajouter méthode pour générer le message complet
const getFullShareMessage = (
  template: string = 'nouveau',
  includeHashtags: boolean = true
) => {
  // Utilise social-media-content.ts
};
```

### 5. Créer Section Marketing dans Dashboard Admin

**Fichier** : `src/pages/Admin/MarketingContent.tsx`

Dashboard pour l'équipe marketing :
- Visualiser les templates disponibles
- Prévisualiser les posts par plateforme
- Calendrier des événements avec templates suggérés
- Statistiques des hashtags les plus performants

---

## Fichiers à Créer/Modifier

| Action | Fichier | Description |
|--------|---------|-------------|
| **Créer** | `src/data/social-media-content.ts` | Base centralisée hashtags + templates |
| **Créer** | `src/components/SocialPostGenerator.tsx` | Générateur de posts UI |
| Modifier | `src/components/ProductShareMenu.tsx` | Intégrer templates + hashtags |
| Modifier | `src/components/QuickBusinessShareMenu.tsx` | Templates par catégorie |
| Modifier | `src/components/ShareFundModal.tsx` | Templates par occasion |
| **Créer** | `src/hooks/useSocialPost.ts` | Hook pour générer posts |
| Optionnel | `src/pages/Admin/MarketingContent.tsx` | Dashboard marketing |

---

## Exemples de Contenus Générés

### Template Produit - Instagram
```
🆕 Nouveau produit disponible !

Collier en perles Akwaba ✨
💰 15 000 XOF

📍 Livraison Abidjan
💳 Paiement Orange Money, MTN

👉 joiedevivre-africa.com/p/123

#JoieDeVivre #JDVAfrica #BijouxAfricains #MadeInAfrica #Abidjan #CadeauxAbidjan
```

### Template Cagnotte - WhatsApp
```
🎂 L'anniversaire de Fatou approche !

Créons ensemble une belle surprise 🎁

💝 Chaque contribution compte
📅 Le 15 février

👉 joiedevivre-africa.com/f/abc123
```

### Template Mariage - Facebook
```
💒 Aminata & Koffi se marient !

Contribuez à leur liste de mariage ✨

🎁 Offrons-leur un cadeau inoubliable
📅 25 mars 2026

👉 joiedevivre-africa.com/f/wedding123

#JoieDeVivre #MariageAfricain #CagnotteMariage #Abidjan
```

---

## Hashtags Clés par Catégorie

### Marque (obligatoires)
- `#JoieDeVivre`
- `#JDVAfrica`
- `#CadeauxCollaboratifs`

### Occasions
| Occasion | Hashtags |
|----------|----------|
| Anniversaire | `#AnniversaireAfrique` `#Surprise` `#CagnotteAnniversaire` |
| Mariage | `#MariageAfricain` `#WeddingCI` `#ListeDeMariage` |
| Naissance | `#BabyShowerAfrique` `#NouveauNé` `#CagnotteNaissance` |
| Tabaski | `#Tabaski2026` `#AidElKebir` `#EidMubarak` |
| Fête des Mères | `#FêteDesMères` `#MamanJeTaime` `#MothersDay` |

### Villes
| Ville | Hashtags |
|-------|----------|
| Abidjan | `#Abidjan` `#TeamCI` `#Babi` `#CIV225` |
| Cotonou | `#Cotonou` `#Benin229` `#BeninTourism` |
| Dakar | `#Dakar` `#Senegal` `#Teranga` `#Kebetu` |

### Produits
| Catégorie | Hashtags |
|-----------|----------|
| Mode | `#ModeAfricaine` `#AfricanFashion` `#WaxPrint` `#Bazin` |
| Bijoux | `#BijouxAfricains` `#AfricanJewelry` `#Handmade` `#OrArtisanal` |
| Gastronomie | `#FoodAbidjan` `#PâtisserieCI` `#TraiteurAbidjan` |

### Plateformes Spécifiques
| Plateforme | Hashtags recommandés |
|------------|----------------------|
| TikTok | `#GiftTok` `#AfricaTikTok` `#FYP` `#PourtToi` |
| Instagram | `#InstaGift` `#AfricaGram` `#ExplorePage` |
| LinkedIn | `#FintechAfrica` `#StartupAfrique` `#EcommerceCI` |

---

## Impact Attendu

- **Cohérence de marque** : Messages uniformes sur toutes les plateformes
- **Gain de temps** : Vendeurs génèrent posts en 1 clic
- **SEO Social** : Hashtags optimisés pour la découvrabilité
- **Engagement** : Templates testés et optimisés par occasion
- **Marketing** : Calendrier prêt pour les événements clés

---

## Estimation

- **Complexité** : Moyenne
- **Fichiers créés** : 3 (data, composant, hook)
- **Fichiers modifiés** : 3 (menus de partage)
- **Nouveaux hashtags** : 60+
- **Nouveaux templates** : 20+

