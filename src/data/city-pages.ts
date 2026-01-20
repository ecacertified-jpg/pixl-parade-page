/**
 * City Pages Data - Centralized SEO content for local landing pages
 * 
 * Each city has localized content for:
 * - SEO meta tags and keywords
 * - Local neighborhoods and payment methods
 * - Cultural context and occasions
 * - Testimonial placeholders
 */

export interface CityTestimonial {
  name: string;
  text: string;
  occasion: string;
  avatar?: string;
}

export interface CityPageData {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  population: string;
  nicknames: string[];
  coordinates: { lat: number; lng: number };
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  neighborhoods: string[];
  paymentMethods: { name: string; icon: string }[];
  currency: string;
  occasions: string[];
  localProducts: string[];
  testimonials: CityTestimonial[];
  stats: {
    businesses: string;
    gifts: string;
    users: string;
  };
  faqs: { question: string; answer: string }[];
}

export const CITY_PAGES: Record<string, CityPageData> = {
  abidjan: {
    slug: 'abidjan',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '5.6 millions',
    nicknames: ['La Perle des Lagunes', 'Babi'],
    coordinates: { lat: 5.3600, lng: -4.0083 },
    heroTitle: 'Cadeaux Collectifs à Abidjan',
    heroSubtitle: 'Célébrez les moments de joie avec vos proches à Cocody, Yopougon, Marcory et partout à Abidjan',
    description: 'JOIE DE VIVRE est la plateforme #1 de cadeaux collaboratifs à Abidjan. Créez des cagnottes pour anniversaires, mariages et promotions. Découvrez des artisans locaux et payez facilement avec Orange Money, MTN ou Wave.',
    metaDescription: 'Plateforme de cadeaux collectifs à Abidjan. Cagnottes anniversaires, boutiques artisanales à Cocody, Yopougon, Plateau. Paiement Orange Money, MTN, Wave.',
    keywords: [
      'cadeaux Abidjan',
      'cagnotte anniversaire Cocody',
      'cagnotte collective Côte d\'Ivoire',
      'artisanat ivoirien',
      'cadeau groupe Abidjan',
      'Orange Money cadeaux',
      'boutique cadeaux Yopougon',
      'cagnotte mariage Abidjan'
    ],
    neighborhoods: ['Cocody', 'Yopougon', 'Marcory', 'Plateau', 'Treichville', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Bingerville'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Naissances', 'Diplômes', 'Fête des Mères', 'Noël'],
    localProducts: ['Pagnes wax', 'Bijoux en or', 'Attiéké artisanal', 'Sculptures ébène', 'Masques Dan', 'Sacs en cuir'],
    testimonials: [
      { 
        name: 'Aminata K.', 
        text: 'Grâce à JOIE DE VIVRE, on a pu offrir un cadeau incroyable à notre collègue pour sa promotion ! Tout le bureau a participé via Orange Money.', 
        occasion: 'Promotion' 
      },
      { 
        name: 'Koffi T.', 
        text: 'La cagnotte a permis de surprendre ma femme pour nos 10 ans de mariage. Livraison parfaite à Cocody, elle était émue aux larmes.', 
        occasion: 'Anniversaire de mariage' 
      },
      { 
        name: 'Adjoua M.', 
        text: 'Pour l\'anniversaire de maman à Yopougon, mes frères et sœurs de France ont pu contribuer facilement. Merci JOIE DE VIVRE !', 
        occasion: 'Anniversaire' 
      },
    ],
    stats: {
      businesses: '50+',
      gifts: '1,200+',
      users: '3,000+'
    },
    faqs: [
      {
        question: 'Comment créer une cagnotte à Abidjan ?',
        answer: 'Inscrivez-vous gratuitement, créez votre cagnotte en 2 minutes, partagez le lien avec vos proches. Ils peuvent contribuer via Orange Money, MTN, Wave ou carte bancaire.'
      },
      {
        question: 'Quels moyens de paiement acceptez-vous à Abidjan ?',
        answer: 'Nous acceptons Orange Money, MTN Mobile Money, Wave, Moov Money et les cartes bancaires (Visa, Mastercard). Pas de frais cachés !'
      },
      {
        question: 'Livrez-vous dans tous les quartiers d\'Abidjan ?',
        answer: 'Oui ! Nos artisans partenaires livrent à Cocody, Yopougon, Marcory, Plateau, Treichville, Abobo, Adjamé, Koumassi, Port-Bouët et Bingerville.'
      },
      {
        question: 'Peut-on créer une cagnotte surprise ?',
        answer: 'Absolument ! Activez l\'option "Cagnotte surprise" et le bénéficiaire ne sera notifié qu\'à la date de révélation que vous aurez choisie.'
      }
    ]
  },
  
  cotonou: {
    slug: 'cotonou',
    city: 'Cotonou',
    country: 'Bénin',
    countryCode: 'BJ',
    population: '1.2 millions',
    nicknames: ['La Cité des Amazones', 'Kutonou'],
    coordinates: { lat: 6.3654, lng: 2.4183 },
    heroTitle: 'Cadeaux Collectifs à Cotonou',
    heroSubtitle: 'Célébrez ensemble à Akpakpa, Cadjèhoun, Fidjrossè et dans tout le Grand Cotonou',
    description: 'JOIE DE VIVRE arrive au Bénin ! Créez des cagnottes collectives pour tous vos événements. Artisans locaux du marché Dantokpa, paiement Mobile Money facile et sécurisé.',
    metaDescription: 'Plateforme de cadeaux collectifs à Cotonou, Bénin. Cagnottes anniversaires, artisans Dantokpa, livraison Akpakpa, Cadjèhoun. Paiement MTN, Moov, Wave.',
    keywords: [
      'cadeaux Cotonou',
      'cagnotte anniversaire Bénin',
      'artisanat béninois',
      'MTN Bénin',
      'cadeau groupe Cotonou',
      'marché Dantokpa',
      'cagnotte mariage Bénin',
      'boutique cadeaux Akpakpa'
    ],
    neighborhoods: ['Akpakpa', 'Cadjèhoun', 'Fidjrossè', 'Gbégamey', 'Haie Vive', 'Zongo', 'Ganhi', 'Sikècodji', 'Agla', 'Calavi'],
    paymentMethods: [
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Moov Money', icon: '🔵' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Flooz', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Baptêmes', 'Funérailles', 'Diplômes', 'Fête du Vodoun', 'Noël'],
    localProducts: ['Tissus Kenta', 'Bronze d\'Abomey', 'Poterie de Sè', 'Sculptures vodoun', 'Vannerie', 'Batik'],
    testimonials: [
      { 
        name: 'Prudence A.', 
        text: 'Enfin une plateforme qui comprend nos traditions ! La cagnotte pour le mariage de ma sœur était un succès. Toute la famille a pu participer.', 
        occasion: 'Mariage' 
      },
      { 
        name: 'Gérard H.', 
        text: 'J\'ai trouvé de magnifiques bronzes d\'Abomey pour l\'anniversaire de mon père. Livraison impeccable à Cadjèhoun.', 
        occasion: 'Anniversaire' 
      },
    ],
    stats: {
      businesses: '25+',
      gifts: '400+',
      users: '800+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible au Bénin ?',
        answer: 'Oui ! Nous sommes présents à Cotonou et dans le Grand Cotonou. Nos artisans partenaires du marché Dantokpa proposent des produits authentiques béninois.'
      },
      {
        question: 'Quels moyens de paiement à Cotonou ?',
        answer: 'Nous acceptons MTN Mobile Money, Moov Money, Wave et Flooz. Contribuez à une cagnotte en quelques clics depuis votre téléphone.'
      },
      {
        question: 'Livrez-vous à Abomey-Calavi ?',
        answer: 'Oui, nous livrons dans tout le Grand Cotonou : Akpakpa, Cadjèhoun, Fidjrossè, Calavi, et même Porto-Novo sur demande.'
      },
      {
        question: 'Proposez-vous des articles traditionnels béninois ?',
        answer: 'Absolument ! Bronzes d\'Abomey, tissus Kenta, poteries de Sè, sculptures vodoun... Découvrez l\'artisanat authentique du Bénin.'
      }
    ]
  },
  
  dakar: {
    slug: 'dakar',
    city: 'Dakar',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '3.9 millions',
    nicknames: ['La Porte de l\'Afrique', 'Ndakarou'],
    coordinates: { lat: 14.6928, lng: -17.4467 },
    heroTitle: 'Cadeaux Collectifs à Dakar',
    heroSubtitle: 'Teranga et générosité aux Almadies, Plateau, Médina et dans toute la presqu\'île',
    description: 'JOIE DE VIVRE célèbre la teranga sénégalaise ! Cagnottes collectives pour mariages, baptêmes et cérémonies. Artisans de Soumbédioune, paiement facile via Orange Money et Wave.',
    metaDescription: 'Plateforme de cadeaux collectifs à Dakar, Sénégal. Cagnottes mariages, baptêmes, artisanat Soumbédioune. Paiement Orange Money, Wave, Free Money.',
    keywords: [
      'cadeaux Dakar',
      'cagnotte mariage Sénégal',
      'teranga',
      'artisanat sénégalais',
      'Wave Sénégal',
      'cadeau groupe Dakar',
      'Soumbédioune artisans',
      'cagnotte baptême Dakar'
    ],
    neighborhoods: ['Plateau', 'Almadies', 'Médina', 'Parcelles Assainies', 'Mermoz', 'Yoff', 'Ngor', 'Ouakam', 'Fann', 'Grand Dakar'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Mariages', 'Baptêmes', 'Tabaski', 'Korité', 'Diplômes', 'Magal', 'Gamou'],
    localProducts: ['Thiouraye', 'Bijoux en or Cayor', 'Boubous brodés', 'Tableaux souwer', 'Paniers tressés', 'Djembés'],
    testimonials: [
      { 
        name: 'Fatou D.', 
        text: 'Pour le baptême de mon fils, toute la famille a contribué via JOIE DE VIVRE. La teranga version digitale ! Même mes cousins de France ont participé.', 
        occasion: 'Baptême' 
      },
      { 
        name: 'Moussa N.', 
        text: 'Les boubous brodés de Soumbédioune sont magnifiques. Ma femme était ravie de son cadeau d\'anniversaire. Merci pour la livraison express aux Almadies !', 
        occasion: 'Anniversaire' 
      },
      { 
        name: 'Aïssatou S.', 
        text: 'Pour notre mariage, la cagnotte nous a permis de recevoir des contributions de Dakar, Paris et New York. Une vraie bénédiction !', 
        occasion: 'Mariage' 
      },
    ],
    stats: {
      businesses: '35+',
      gifts: '800+',
      users: '1,500+'
    },
    faqs: [
      {
        question: 'Comment fonctionne JOIE DE VIVRE à Dakar ?',
        answer: 'Créez votre cagnotte gratuite, partagez-la avec votre famille et amis au Sénégal ou à l\'étranger. Ils contribuent via Wave, Orange Money ou Free Money. Simple comme la teranga !'
      },
      {
        question: 'Quels moyens de paiement au Sénégal ?',
        answer: 'Orange Money, Wave (très populaire !), Free Money et E-Money. Vos proches peuvent aussi payer par carte bancaire depuis l\'étranger.'
      },
      {
        question: 'Livrez-vous dans la banlieue dakaroise ?',
        answer: 'Oui ! Nous livrons au Plateau, Almadies, Médina, Parcelles Assainies, Pikine, Guédiawaye, Rufisque et Thiès sur demande.'
      },
      {
        question: 'Peut-on créer une cagnotte pour la Tabaski ou Korité ?',
        answer: 'Bien sûr ! Nos cagnottes sont parfaites pour toutes les fêtes religieuses. Créez une cagnotte "Tabaski" ou "Korité" et rassemblez les contributions de toute la famille.'
      }
    ]
  }
};

/**
 * Get all available city slugs
 */
export const getCitySlugs = (): string[] => Object.keys(CITY_PAGES);

/**
 * Check if a slug is a valid city page
 */
export const isValidCitySlug = (slug: string): boolean => slug in CITY_PAGES;

/**
 * Get city data by slug
 */
export const getCityData = (slug: string): CityPageData | null => CITY_PAGES[slug] || null;
