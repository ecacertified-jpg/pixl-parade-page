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
      'cagnotte mariage Abidjan',
      // Long-tail keywords
      'où acheter cadeau Abidjan livraison rapide',
      'meilleur site cagnotte Côte d\'Ivoire',
      'artisans locaux cadeaux uniques Abidjan',
      'pot commun anniversaire Abidjan',
      // Payment keywords
      'payer cadeau Orange Money',
      'achat sans carte bancaire Abidjan',
      'MTN Mobile Money cadeaux',
      // Occasion keywords
      'cadeau Fête des Mères Abidjan',
      'cagnotte Tabaski Côte d\'Ivoire',
      'cadeau promotion collègue',
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
      'boutique cadeaux Akpakpa',
      // Long-tail keywords
      'où acheter cadeau Cotonou livraison',
      'meilleur site cagnotte Bénin',
      'artisans Dantokpa cadeaux authentiques',
      'pot commun anniversaire Bénin',
      // Payment keywords
      'payer MTN Mobile Money cadeaux',
      'Moov Money Bénin',
      'Wave Cotonou paiement',
      // Occasion keywords
      'cagnotte Fête du Vodoun',
      'cadeau baptême Cotonou',
      'bronze Abomey cadeau',
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
      'cagnotte baptême Dakar',
      // Long-tail keywords
      'où acheter cadeau Dakar livraison',
      'meilleur site cagnotte Sénégal',
      'teranga cadeaux collectifs',
      'pot commun mariage Dakar',
      // Payment keywords
      'Wave paiement cadeaux Sénégal',
      'Orange Money Dakar',
      'Free Money cadeaux',
      // Occasion keywords
      'cagnotte Tabaski Sénégal',
      'cadeau Korité Dakar',
      'boubou brodé cadeau',
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
  },

  // ============= CÔTE D'IVOIRE - VILLES SECONDAIRES =============
  
  bouake: {
    slug: 'bouake',
    city: 'Bouaké',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '800,000',
    nicknames: ['La Ville Lumière', 'Gbêkê'],
    coordinates: { lat: 7.6906, lng: -5.0308 },
    heroTitle: 'Cadeaux Collectifs à Bouaké',
    heroSubtitle: 'Célébrez ensemble au Commerce, Dar-es-Salam, Koko et dans toute la région du Gbêkê',
    description: 'JOIE DE VIVRE est présent à Bouaké ! Créez des cagnottes collectives pour anniversaires, mariages et promotions. Découvrez l\'artisanat baoulé et payez facilement avec Orange Money ou MTN.',
    metaDescription: 'Plateforme de cadeaux collectifs à Bouaké, Côte d\'Ivoire. Cagnottes anniversaires, artisanat baoulé, livraison Commerce, Dar-es-Salam. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Bouaké',
      'cagnotte anniversaire Gbêkê',
      'artisanat baoulé',
      'cadeau groupe Bouaké',
      'Orange Money Bouaké',
      'cagnotte mariage Bouaké',
      'boutique cadeaux Commerce'
    ],
    neighborhoods: ['Commerce', 'Dar-es-Salam', 'Koko', 'Air France', 'Belleville', 'Zone', 'Ahougnansou', 'N\'Gattakro', 'Gonfreville', 'Kennedy'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Baptêmes', 'Fête du Dipri', 'Diplômes'],
    localProducts: ['Tissus baoulé', 'Poterie traditionnelle', 'Bijoux artisanaux', 'Pagnes tissés', 'Sculptures bois'],
    testimonials: [
      { 
        name: 'Yao K.', 
        text: 'Pour l\'anniversaire de ma mère au Commerce, toute la famille a contribué. JOIE DE VIVRE a rendu ça si simple !', 
        occasion: 'Anniversaire' 
      },
      { 
        name: 'Aya B.', 
        text: 'La cagnotte pour notre mariage traditionnel était parfaite. Même nos proches d\'Abidjan ont pu participer facilement.', 
        occasion: 'Mariage' 
      },
    ],
    stats: {
      businesses: '15+',
      gifts: '300+',
      users: '600+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE livre-t-il à Bouaké ?',
        answer: 'Oui ! Nous livrons dans tous les quartiers de Bouaké : Commerce, Dar-es-Salam, Koko, Air France, Belleville et la Zone industrielle.'
      },
      {
        question: 'Quels moyens de paiement à Bouaké ?',
        answer: 'Orange Money, MTN Mobile Money, Wave et Moov Money sont tous acceptés. Payez en quelques clics depuis votre téléphone.'
      },
      {
        question: 'Trouvez-vous des artisans locaux à Bouaké ?',
        answer: 'Absolument ! Nos partenaires proposent de l\'artisanat baoulé authentique : tissus traditionnels, poteries, bijoux et sculptures.'
      },
      {
        question: 'Peut-on créer une cagnotte pour la Fête du Dipri ?',
        answer: 'Bien sûr ! Créez une cagnotte pour toutes vos célébrations traditionnelles et rassemblez les contributions de vos proches.'
      }
    ]
  },

  yamoussoukro: {
    slug: 'yamoussoukro',
    city: 'Yamoussoukro',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '350,000',
    nicknames: ['La Capitale', 'Yakro'],
    coordinates: { lat: 6.8206, lng: -5.2767 },
    heroTitle: 'Cadeaux Collectifs à Yamoussoukro',
    heroSubtitle: 'Célébrez près de la Basilique, à Assabou, Kokrenou et dans toute la capitale politique',
    description: 'JOIE DE VIVRE est dans la capitale ! Créez des cagnottes collectives pour vos événements à Yamoussoukro. Artisanat local, souvenirs de la Basilique et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Yamoussoukro, capitale de Côte d\'Ivoire. Cagnottes anniversaires, artisanat local, Basilique. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Yamoussoukro',
      'cagnotte anniversaire capitale',
      'Basilique Yamoussoukro',
      'cadeau groupe Yakro',
      'artisanat Yamoussoukro',
      'cagnotte mariage capitale',
      'Orange Money Yamoussoukro'
    ],
    neighborhoods: ['Assabou', 'Kokrenou', 'Habitat', 'Morofé', 'N\'Gokro', 'Millionnaire', 'Dioulakro', 'Zambakro', '220 Logements'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Pèlerinages', 'Baptêmes', 'Diplômes'],
    localProducts: ['Souvenirs Basilique', 'Tissus baoulé', 'Miel local', 'Sculptures', 'Objets religieux'],
    testimonials: [
      { 
        name: 'Marie-Laure T.', 
        text: 'Pour le pèlerinage de maman à la Basilique, nous avons créé une cagnotte. Un cadeau spirituel et mémorable !', 
        occasion: 'Pèlerinage' 
      },
      { 
        name: 'Kouadio A.', 
        text: 'Anniversaire surprise réussi à Assabou ! Mes collègues ont tous contribué via l\'application.', 
        occasion: 'Anniversaire' 
      },
    ],
    stats: {
      businesses: '10+',
      gifts: '150+',
      users: '300+'
    },
    faqs: [
      {
        question: 'Livrez-vous à Yamoussoukro ?',
        answer: 'Oui ! Nous livrons dans tous les quartiers : Assabou, Kokrenou, Habitat, Morofé, N\'Gokro et les 220 Logements.'
      },
      {
        question: 'Proposez-vous des articles liés à la Basilique ?',
        answer: 'Nos artisans partenaires proposent des souvenirs et objets inspirés de la Basilique Notre-Dame de la Paix.'
      },
      {
        question: 'Comment payer à Yamoussoukro ?',
        answer: 'Orange Money, MTN Mobile Money, Wave et Moov Money. Tous les moyens de paiement mobile sont acceptés.'
      },
      {
        question: 'Peut-on organiser un cadeau de groupe pour un fonctionnaire ?',
        answer: 'Parfait pour les promotions et mutations ! Créez une cagnotte et invitez tous les collègues à contribuer.'
      }
    ]
  },

  'san-pedro': {
    slug: 'san-pedro',
    city: 'San-Pédro',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '250,000',
    nicknames: ['La Cité Balnéaire', 'San Pé'],
    coordinates: { lat: 4.7392, lng: -6.6363 },
    heroTitle: 'Cadeaux Collectifs à San-Pédro',
    heroSubtitle: 'Célébrez au Bardot, Lac, Zimbabwe et sur toute la côte sud-ouest ivoirienne',
    description: 'JOIE DE VIVRE arrive sur la côte ! Créez des cagnottes à San-Pédro pour vos célébrations. Port dynamique, artisanat côtier et paiement Mobile Money facile.',
    metaDescription: 'Plateforme de cadeaux collectifs à San-Pédro, Côte d\'Ivoire. Cagnottes anniversaires, artisanat côtier, port. Paiement Orange Money, MTN, Wave.',
    keywords: [
      'cadeaux San-Pédro',
      'cagnotte anniversaire San Pé',
      'port San-Pédro',
      'cadeau groupe côte ivoirienne',
      'artisanat côtier',
      'cagnotte mariage San-Pédro',
      'Orange Money San-Pédro'
    ],
    neighborhoods: ['Bardot', 'Lac', 'Zimbabwe', 'Sonouko', 'Séwéké', 'Bardo', 'Cité', 'Port', 'Balmer', 'Gabiadji'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Départs à la retraite', 'Baptêmes'],
    localProducts: ['Artisanat côtier', 'Fruits de mer séchés', 'Huile de coco', 'Bijoux coquillages', 'Sculptures bois flotté'],
    testimonials: [
      { 
        name: 'Jean-Marc L.', 
        text: 'Pour le départ à la retraite de notre chef au port, la cagnotte JOIE DE VIVRE était parfaite. Tout le monde a participé !', 
        occasion: 'Retraite' 
      },
      { 
        name: 'Christelle B.', 
        text: 'Mariage au bord de la mer à San-Pédro, cadeaux collectés de toute la Côte d\'Ivoire. Merci !', 
        occasion: 'Mariage' 
      },
    ],
    stats: {
      businesses: '12+',
      gifts: '200+',
      users: '400+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à San-Pédro ?',
        answer: 'Oui ! Nous sommes présents dans la cité balnéaire. Livraison au Bardot, Lac, Zimbabwe, Cité et tous les quartiers.'
      },
      {
        question: 'Quels produits locaux trouve-t-on à San-Pédro ?',
        answer: 'Artisanat côtier, bijoux en coquillages, sculptures en bois flotté, huile de coco artisanale et produits de la mer.'
      },
      {
        question: 'Comment payer depuis le port ?',
        answer: 'Orange Money, MTN et Wave fonctionnent parfaitement. Les marins peuvent contribuer aux cagnottes depuis leurs téléphones.'
      },
      {
        question: 'Livrez-vous dans les villages environnants ?',
        answer: 'Nous livrons principalement à San-Pédro ville. Pour les villages, contactez-nous pour vérifier la disponibilité.'
      }
    ]
  },

  daloa: {
    slug: 'daloa',
    city: 'Daloa',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '320,000',
    nicknames: ['La Cité des Antilopes', 'Capitale du Haut-Sassandra'],
    coordinates: { lat: 6.8774, lng: -6.4502 },
    heroTitle: 'Cadeaux Collectifs à Daloa',
    heroSubtitle: 'Célébrez à Tazibouo, Lobia, Orly et dans toute la région du Haut-Sassandra',
    description: 'JOIE DE VIVRE est au cœur de la zone cacaoyère ! Créez des cagnottes collectives à Daloa. Artisanat bété, tissus traditionnels et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Daloa, Côte d\'Ivoire. Cagnottes anniversaires, artisanat bété, région cacao. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Daloa',
      'cagnotte anniversaire Haut-Sassandra',
      'artisanat bété',
      'cadeau groupe Daloa',
      'région cacao Côte d\'Ivoire',
      'cagnotte mariage Daloa',
      'Orange Money Daloa'
    ],
    neighborhoods: ['Tazibouo', 'Lobia', 'Orly', 'Gbeuliville', 'Kennedy', 'Marais', 'Huberson', 'Abattoir', 'Commerce', 'Garage'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Récoltes', 'Baptêmes', 'Diplômes'],
    localProducts: ['Cacao artisanal', 'Tissus bété', 'Sculptures bois', 'Café local', 'Vannerie'],
    testimonials: [
      { 
        name: 'Serge G.', 
        text: 'Après une bonne récolte de cacao, on a fêté en famille grâce à JOIE DE VIVRE. Les cousins d\'Abidjan ont contribué !', 
        occasion: 'Célébration' 
      },
      { 
        name: 'Simone K.', 
        text: 'Pour les 60 ans de papa à Tazibouo, la cagnotte nous a permis d\'offrir un cadeau digne de lui.', 
        occasion: 'Anniversaire' 
      },
    ],
    stats: {
      businesses: '10+',
      gifts: '180+',
      users: '350+'
    },
    faqs: [
      {
        question: 'Livrez-vous dans toute la ville de Daloa ?',
        answer: 'Oui ! Nous livrons à Tazibouo, Lobia, Orly, Gbeuliville, Kennedy, Marais et tous les quartiers de Daloa.'
      },
      {
        question: 'Quels produits locaux sont disponibles ?',
        answer: 'Artisanat bété, cacao et café artisanaux, tissus traditionnels, sculptures en bois et vannerie locale.'
      },
      {
        question: 'Comment les planteurs peuvent-ils contribuer ?',
        answer: 'Via Orange Money ou MTN directement depuis leur téléphone. Pas besoin d\'aller en ville !'
      },
      {
        question: 'Peut-on créer une cagnotte pour la fête des récoltes ?',
        answer: 'Absolument ! Célébrez vos récoltes en famille avec une cagnotte collective. Invitez tous vos proches à participer.'
      }
    ]
  },

  korhogo: {
    slug: 'korhogo',
    city: 'Korhogo',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '250,000',
    nicknames: ['La Cité du Poro', 'Koro', 'Capitale du Nord'],
    coordinates: { lat: 9.4580, lng: -5.6297 },
    heroTitle: 'Cadeaux Collectifs à Korhogo',
    heroSubtitle: 'Célébrez à Sinistré, Dem, Cocody-Korhogo et dans tout le pays Sénoufo',
    description: 'JOIE DE VIVRE honore la tradition Sénoufo ! Créez des cagnottes à Korhogo pour vos célébrations. Toiles de Korhogo, masques traditionnels et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Korhogo, Côte d\'Ivoire. Cagnottes anniversaires, toiles de Korhogo, art Sénoufo. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Korhogo',
      'toiles de Korhogo',
      'art Sénoufo',
      'cagnotte anniversaire Nord',
      'masques traditionnels',
      'cagnotte mariage Korhogo',
      'Fête du Poro'
    ],
    neighborhoods: ['Sinistré', 'Dem', 'Cocody', 'Kassoumbarga', 'Natio', 'Koko', 'Soba', 'Haoussa', 'Banaforo', 'Résidentiel'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Promotions', 'Fête du Poro', 'Tabaski', 'Baptêmes'],
    localProducts: ['Toiles de Korhogo', 'Masques Sénoufo', 'Sculptures traditionnelles', 'Coton tissé', 'Bijoux en bronze'],
    testimonials: [
      { 
        name: 'Ousmane C.', 
        text: 'Pour la Tabaski, notre famille a utilisé JOIE DE VIVRE pour rassembler les contributions. Une vraie réussite !', 
        occasion: 'Tabaski' 
      },
      { 
        name: 'Mariam S.', 
        text: 'J\'ai offert une authentique toile de Korhogo à ma belle-mère. Elle était si fière de ce cadeau traditionnel.', 
        occasion: 'Anniversaire' 
      },
    ],
    stats: {
      businesses: '12+',
      gifts: '220+',
      users: '450+'
    },
    faqs: [
      {
        question: 'Trouvez-vous des toiles de Korhogo authentiques ?',
        answer: 'Oui ! Nos artisans partenaires créent des toiles de Korhogo traditionnelles, peintes à la main selon les techniques ancestrales Sénoufo.'
      },
      {
        question: 'Livrez-vous dans tout Korhogo ?',
        answer: 'Nous livrons à Sinistré, Dem, Cocody, Kassoumbarga, Natio et tous les quartiers. Même à Ferkessédougou sur demande.'
      },
      {
        question: 'Peut-on créer une cagnotte pour le Poro ?',
        answer: 'Absolument ! Célébrez les initiations et cérémonies traditionnelles avec une cagnotte collective familiale.'
      },
      {
        question: 'Comment payer dans le Nord ?',
        answer: 'Orange Money et MTN sont très répandus. Wave et Moov Money sont aussi acceptés pour toutes vos contributions.'
      }
    ]
  },

  // ============= BÉNIN - VILLES SECONDAIRES =============

  'porto-novo': {
    slug: 'porto-novo',
    city: 'Porto-Novo',
    country: 'Bénin',
    countryCode: 'BJ',
    population: '280,000',
    nicknames: ['Hogbonou', 'Adjacè', 'La Capitale'],
    coordinates: { lat: 6.4969, lng: 2.6289 },
    heroTitle: 'Cadeaux Collectifs à Porto-Novo',
    heroSubtitle: 'Célébrez à Ouando, Djègan-Daho, Tokpota et dans toute la capitale historique',
    description: 'JOIE DE VIVRE honore le patrimoine béninois ! Créez des cagnottes à Porto-Novo, capitale administrative. Artisanat vodoun, masques Gèlèdé et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Porto-Novo, capitale du Bénin. Cagnottes anniversaires, artisanat vodoun, Gèlèdé. Paiement MTN, Moov.',
    keywords: [
      'cadeaux Porto-Novo',
      'cagnotte anniversaire Bénin capitale',
      'artisanat vodoun',
      'masques Gèlèdé',
      'cadeau groupe Porto-Novo',
      'MTN Porto-Novo',
      'patrimoine béninois'
    ],
    neighborhoods: ['Ouando', 'Djègan-Daho', 'Tokpota', 'Attakè', 'Dowa', 'Houinmè', 'Lokpodji', 'Zèbou', 'Akonaboè'],
    paymentMethods: [
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Moov Money', icon: '🔵' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Flooz', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Fête du Vodoun', 'Zangbeto', 'Baptêmes', 'Funérailles'],
    localProducts: ['Masques Gèlèdé', 'Poterie Porto-Novo', 'Tissus royaux', 'Bronze d\'Abomey', 'Sculptures vodoun'],
    testimonials: [
      { 
        name: 'Hospice A.', 
        text: 'Pour la Fête du Vodoun, notre association culturelle a créé une cagnotte. Un succès pour préserver nos traditions !', 
        occasion: 'Fête traditionnelle' 
      },
      { 
        name: 'Béatrice K.', 
        text: 'Mariage traditionnel à Ouando, contributions de Cotonou, Lagos et Paris. JOIE DE VIVRE nous a connectés.', 
        occasion: 'Mariage' 
      },
    ],
    stats: {
      businesses: '8+',
      gifts: '120+',
      users: '250+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à Porto-Novo ?',
        answer: 'Oui ! La capitale administrative du Bénin est couverte. Livraison à Ouando, Djègan-Daho, Tokpota et tous les quartiers.'
      },
      {
        question: 'Proposez-vous de l\'artisanat vodoun ?',
        answer: 'Nos artisans partenaires créent des masques Gèlèdé, sculptures vodoun et objets traditionnels dans le respect des traditions.'
      },
      {
        question: 'Comment payer à Porto-Novo ?',
        answer: 'MTN Mobile Money, Moov Money, Wave et Flooz. Tous les moyens de paiement mobile béninois sont acceptés.'
      },
      {
        question: 'Peut-on organiser une cagnotte pour le Zangbeto ?',
        answer: 'Bien sûr ! Célébrez vos cérémonies traditionnelles avec une cagnotte collective. Vos proches du monde entier peuvent contribuer.'
      }
    ]
  },

  // ============= SÉNÉGAL - VILLES SECONDAIRES =============

  thies: {
    slug: 'thies',
    city: 'Thiès',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '400,000',
    nicknames: ['La Cité du Rail', 'Capitale du Cayor'],
    coordinates: { lat: 14.7886, lng: -16.9260 },
    heroTitle: 'Cadeaux Collectifs à Thiès',
    heroSubtitle: 'Célébrez à Nguinth, Diakhao, Grand Standing et dans toute la région de Thiès',
    description: 'JOIE DE VIVRE arrive à Thiès ! Créez des cagnottes collectives dans la cité du rail. Célèbres tapisseries de Thiès, artisanat wolof et paiement Wave/Orange Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Thiès, Sénégal. Cagnottes mariages, tapisseries de Thiès, artisanat. Paiement Orange Money, Wave.',
    keywords: [
      'cadeaux Thiès',
      'tapisseries de Thiès',
      'cagnotte anniversaire Thiès',
      'artisanat wolof',
      'Wave Thiès',
      'cagnotte mariage Thiès',
      'cité du rail Sénégal'
    ],
    neighborhoods: ['Nguinth', 'Diakhao', 'Grand Standing', 'Mbour 1', 'Mbour 2', 'Escale', 'Randoulène', 'Hersent', 'Cité Sones'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Mariages', 'Baptêmes', 'Tabaski', 'Korité', 'Magal', 'Diplômes'],
    localProducts: ['Tapisseries de Thiès', 'Bijoux wolof', 'Boubous brodés', 'Cuir tressé', 'Paniers colorés'],
    testimonials: [
      { 
        name: 'Abdoulaye F.', 
        text: 'Les tapisseries de Thiès sont magnifiques ! J\'en ai offert une à ma femme pour notre anniversaire de mariage.', 
        occasion: 'Anniversaire mariage' 
      },
      { 
        name: 'Ndeye M.', 
        text: 'Pour le baptême de mon neveu à Nguinth, la cagnotte a permis de rassembler toute la famille, même ceux de France.', 
        occasion: 'Baptême' 
      },
    ],
    stats: {
      businesses: '15+',
      gifts: '280+',
      users: '500+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE livre-t-il à Thiès ?',
        answer: 'Oui ! Nous livrons à Nguinth, Diakhao, Grand Standing, Mbour, Escale et tous les quartiers de Thiès.'
      },
      {
        question: 'Trouvez-vous les célèbres tapisseries de Thiès ?',
        answer: 'Absolument ! Nos artisans partenaires créent les authentiques tapisseries de Thiès, reconnues dans le monde entier.'
      },
      {
        question: 'Comment payer à Thiès ?',
        answer: 'Orange Money, Wave (très populaire !), Free Money et E-Money. Contribuez en quelques clics.'
      },
      {
        question: 'Peut-on organiser une cagnotte pour le Magal ?',
        answer: 'Bien sûr ! Créez une cagnotte pour le Magal, la Tabaski ou la Korité. Rassemblez les contributions de vos proches partout dans le monde.'
      }
    ]
  },

  // ============= CÔTE D'IVOIRE - NOUVELLES VILLES =============

  man: {
    slug: 'man',
    city: 'Man',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '200,000',
    nicknames: ['La Cité des 18 Montagnes', 'Man la Belle'],
    coordinates: { lat: 7.4125, lng: -7.5539 },
    heroTitle: 'Cadeaux Collectifs à Man',
    heroSubtitle: 'Célébrez à Libreville, Doyagouiné, Grand Gbapleu et au pied des montagnes Dan',
    description: 'JOIE DE VIVRE dans la région des 18 montagnes ! Créez des cagnottes à Man pour vos célébrations. Artisanat Dan, masques traditionnels et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Man, Côte d\'Ivoire. Cagnottes anniversaires, artisanat Dan, Dent de Man tourisme. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Man',
      'Dent de Man tourisme',
      'artisanat Dan',
      'cagnotte anniversaire 18 montagnes',
      'masques Dan',
      'cagnotte mariage Man',
      'région Ouest Côte d\'Ivoire'
    ],
    neighborhoods: ['Libreville', 'Doyagouiné', 'Grand Gbapleu', 'Commerce', 'Gbêpleu', 'Domoraud', 'Bleu', 'Djipoudrou', 'Kpangbassou'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Fête des Masques', 'Promotions', 'Baptêmes', 'Diplômes'],
    localProducts: ['Masques Dan', 'Sculptures traditionnelles', 'Tissus wê', 'Poterie montagneuse', 'Café des montagnes'],
    testimonials: [
      {
        name: 'Didier G.',
        text: 'Pour la Fête des Masques, notre famille a créé une cagnotte collective. Un succès qui honore nos traditions Dan !',
        occasion: 'Fête traditionnelle'
      },
      {
        name: 'Clarisse T.',
        text: 'Anniversaire surprise à Libreville ! Mes amis d\'Abidjan ont contribué facilement via l\'appli.',
        occasion: 'Anniversaire'
      },
    ],
    stats: {
      businesses: '8+',
      gifts: '100+',
      users: '200+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE livre-t-il à Man ?',
        answer: 'Oui ! Nous livrons à Libreville, Doyagouiné, Grand Gbapleu, Commerce et tous les quartiers de Man.'
      },
      {
        question: 'Proposez-vous des masques Dan authentiques ?',
        answer: 'Nos artisans partenaires créent des masques Dan traditionnels sculptés à la main, respectant les techniques ancestrales.'
      },
      {
        question: 'Peut-on créer une cagnotte pour la Fête des Masques ?',
        answer: 'Absolument ! Célébrez vos traditions Dan avec une cagnotte collective et rassemblez vos proches.'
      },
      {
        question: 'Comment payer depuis Man ?',
        answer: 'Orange Money, MTN, Wave et Moov Money fonctionnent parfaitement dans la région des 18 montagnes.'
      }
    ]
  },

  gagnoa: {
    slug: 'gagnoa',
    city: 'Gagnoa',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '180,000',
    nicknames: ['La Capitale du Gôh', 'Cité du Café'],
    coordinates: { lat: 6.1319, lng: -5.9503 },
    heroTitle: 'Cadeaux Collectifs à Gagnoa',
    heroSubtitle: 'Célébrez à Dioulabougou, Soleil, Garahio et dans toute la région cacaoyère du Gôh',
    description: 'JOIE DE VIVRE au cœur du pays bété ! Créez des cagnottes à Gagnoa pour vos célébrations. Artisanat bété, cacao artisanal et paiement Mobile Money facile.',
    metaDescription: 'Plateforme de cadeaux collectifs à Gagnoa, Côte d\'Ivoire. Cagnottes anniversaires, artisanat bété, région cacao. Paiement Orange Money, MTN.',
    keywords: [
      'cadeaux Gagnoa',
      'région Gôh',
      'artisanat bété',
      'cagnotte anniversaire Gagnoa',
      'zone cacaoyère',
      'cagnotte mariage Gagnoa',
      'café cacao Côte d\'Ivoire'
    ],
    neighborhoods: ['Dioulabougou', 'Soleil', 'Garahio', 'Kennedy', 'Résidentiel', 'Commerce', 'Nahi', 'Babré', 'Zébré'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Récoltes', 'Promotions', 'Baptêmes', 'Funérailles bété'],
    localProducts: ['Cacao artisanal', 'Café local', 'Tissus bété', 'Sculptures bois', 'Huile de palme'],
    testimonials: [
      {
        name: 'Patrice B.',
        text: 'Après la récolte du cacao, on a célébré en famille. La cagnotte JOIE DE VIVRE a rassemblé tous les cousins !',
        occasion: 'Célébration récolte'
      },
      {
        name: 'Yvonne Z.',
        text: 'Pour le mariage traditionnel bété à Dioulabougou, les contributions venaient de partout. Merci JOIE DE VIVRE !',
        occasion: 'Mariage'
      },
    ],
    stats: {
      businesses: '7+',
      gifts: '90+',
      users: '180+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à Gagnoa ?',
        answer: 'Oui ! Nous livrons à Dioulabougou, Soleil, Garahio, Kennedy et tous les quartiers de Gagnoa.'
      },
      {
        question: 'Proposez-vous des produits du terroir ?',
        answer: 'Nos partenaires proposent cacao artisanal, café local, huile de palme et artisanat bété authentique.'
      },
      {
        question: 'Comment les planteurs peuvent contribuer ?',
        answer: 'Via Orange Money ou MTN depuis leur téléphone. Simple et rapide, même sans aller en ville !'
      },
      {
        question: 'Peut-on organiser une cagnotte pour les funérailles ?',
        answer: 'Oui, les cagnottes sont parfaites pour accompagner les familles dans les moments de deuil et rassembler les contributions.'
      }
    ]
  },

  'grand-bassam': {
    slug: 'grand-bassam',
    city: 'Grand-Bassam',
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    population: '100,000',
    nicknames: ['Bassam', 'Première Capitale', 'Cité UNESCO'],
    coordinates: { lat: 5.2139, lng: -3.7486 },
    heroTitle: 'Cadeaux Collectifs à Grand-Bassam',
    heroSubtitle: 'Célébrez au Quartier France, Moossou, Azuretti et sur toute la côte classée UNESCO',
    description: 'JOIE DE VIVRE dans la première capitale ! Créez des cagnottes à Grand-Bassam. Patrimoine UNESCO, artisanat colonial, plages et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Grand-Bassam, patrimoine UNESCO Côte d\'Ivoire. Cagnottes anniversaires, Fête de l\'Abissa. Paiement Orange Money.',
    keywords: [
      'cadeaux Grand-Bassam',
      'patrimoine UNESCO Côte d\'Ivoire',
      'Fête de l\'Abissa',
      'artisanat Bassam',
      'cagnotte anniversaire Bassam',
      'quartier France colonial',
      'plages Bassam'
    ],
    neighborhoods: ['Quartier France', 'Moossou', 'Azuretti', 'Impérial', 'Ancien Bassam', 'Modeste', 'Phare', 'Jean Folly', 'Mondoukou'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Moov Money', icon: '🟣' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Fête de l\'Abissa', 'Pâques', 'Week-ends plage', 'Baptêmes'],
    localProducts: ['Artisanat colonial', 'Bijoux de plage', 'Sculptures bois', 'Tissus N\'zima', 'Pagnes traditionnels'],
    testimonials: [
      {
        name: 'Eric M.',
        text: 'Pour la Fête de l\'Abissa, notre communauté N\'zima a créé une cagnotte. Un succès culturel !',
        occasion: 'Fête de l\'Abissa'
      },
      {
        name: 'Sandrine A.',
        text: 'Week-end anniversaire surprise à Bassam ! La cagnotte a permis de louer une villa sur la plage.',
        occasion: 'Anniversaire'
      },
    ],
    stats: {
      businesses: '12+',
      gifts: '150+',
      users: '300+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE livre-t-il à Grand-Bassam ?',
        answer: 'Oui ! Nous livrons au Quartier France, Moossou, Azuretti, Impérial et tous les quartiers historiques.'
      },
      {
        question: 'Proposez-vous des produits liés au patrimoine UNESCO ?',
        answer: 'Nos artisans créent des objets inspirés de l\'architecture coloniale et de la culture N\'zima.'
      },
      {
        question: 'Peut-on organiser une cagnotte pour l\'Abissa ?',
        answer: 'Absolument ! La Fête de l\'Abissa est l\'occasion parfaite pour une cagnotte collective communautaire.'
      },
      {
        question: 'Livrez-vous le week-end pour les touristes ?',
        answer: 'Oui, livraisons disponibles 7j/7 pour les célébrations de week-end à la plage.'
      }
    ]
  },

  // ============= BÉNIN - NOUVELLES VILLES =============

  parakou: {
    slug: 'parakou',
    city: 'Parakou',
    country: 'Bénin',
    countryCode: 'BJ',
    population: '300,000',
    nicknames: ['La Cité des Kobourou', 'Capitale du Nord'],
    coordinates: { lat: 9.3500, lng: 2.6167 },
    heroTitle: 'Cadeaux Collectifs à Parakou',
    heroSubtitle: 'Célébrez à Zongo, Banikanni, Titirou et dans toute la capitale économique du Nord',
    description: 'JOIE DE VIVRE arrive dans le Nord-Bénin ! Créez des cagnottes à Parakou, hub commercial majeur. Artisanat bariba, marchés animés et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Parakou, 2ème ville du Bénin. Cagnottes anniversaires, artisanat bariba. Paiement MTN, Moov.',
    keywords: [
      'cadeaux Parakou',
      'cagnotte anniversaire Nord Bénin',
      'artisanat bariba',
      'deuxième ville Bénin',
      'Kobourou Parakou',
      'cagnotte mariage Parakou',
      'marché Arzèkè'
    ],
    neighborhoods: ['Zongo', 'Banikanni', 'Titirou', 'Thian', 'Kpébié', 'Ladji', 'Nima', 'Guéma', 'Albarika', 'Gah'],
    paymentMethods: [
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Moov Money', icon: '🔵' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Flooz', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Tabaski', 'Korité', 'Gaani', 'Baptêmes'],
    localProducts: ['Tissus bariba', 'Poterie du Nord', 'Bijoux traditionnels', 'Cuir travaillé', 'Calebasses décorées'],
    testimonials: [
      {
        name: 'Idrissou M.',
        text: 'Pour la Tabaski, notre famille dispersée entre Parakou et Cotonou a contribué ensemble. Merci JOIE DE VIVRE !',
        occasion: 'Tabaski'
      },
      {
        name: 'Ramatou B.',
        text: 'La Fête du Gaani célébrée avec une cagnotte collective ! Nos traditions bariba sont honorées.',
        occasion: 'Gaani'
      },
    ],
    stats: {
      businesses: '10+',
      gifts: '130+',
      users: '280+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à Parakou ?',
        answer: 'Oui ! Nous couvrons Zongo, Banikanni, Titirou, Thian et tous les quartiers de la 2ème ville du Bénin.'
      },
      {
        question: 'Quels moyens de paiement au Nord-Bénin ?',
        answer: 'MTN Mobile Money, Moov Money, Wave et Flooz. Tous les opérateurs sont acceptés.'
      },
      {
        question: 'Proposez-vous de l\'artisanat bariba ?',
        answer: 'Oui ! Tissus traditionnels, poteries, bijoux et cuir travaillé par les artisans du marché Arzèkè.'
      },
      {
        question: 'Peut-on créer une cagnotte pour le Gaani ?',
        answer: 'Absolument ! La fête du Gaani est parfaite pour rassembler les contributions de toute la communauté bariba.'
      }
    ]
  },

  abomey: {
    slug: 'abomey',
    city: 'Abomey',
    country: 'Bénin',
    countryCode: 'BJ',
    population: '100,000',
    nicknames: ['Capitale historique', 'Cité des Palais Royaux', 'Agbomè'],
    coordinates: { lat: 7.1828, lng: 1.9919 },
    heroTitle: 'Cadeaux Collectifs à Abomey',
    heroSubtitle: 'Célébrez près des Palais Royaux UNESCO, à Djimè, Zounzonmè et dans l\'ancienne capitale du Dahomey',
    description: 'JOIE DE VIVRE honore l\'histoire du Dahomey ! Créez des cagnottes à Abomey, patrimoine mondial. Bronzes célèbres, tissus applicués et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Abomey, Bénin. Bronzes UNESCO, Palais Royaux, cagnottes anniversaires. Paiement MTN, Moov.',
    keywords: [
      'cadeaux Abomey',
      'bronzes Abomey UNESCO',
      'Palais Royaux Dahomey',
      'artisanat royal Bénin',
      'cagnotte anniversaire Abomey',
      'tissus applicués',
      'patrimoine Abomey'
    ],
    neighborhoods: ['Djimè', 'Zounzonmè', 'Hounli', 'Agblomè', 'Adandokpodji', 'Vidolé', 'Lissèzoun', 'Gbècon'],
    paymentMethods: [
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Moov Money', icon: '🔵' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Flooz', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Anniversaires', 'Mariages', 'Fête des Rois', 'Funérailles royales', 'Baptêmes', 'Cérémonies ancestrales'],
    localProducts: ['Bronzes d\'Abomey', 'Tissus applicués', 'Sculptures royales', 'Tentures Aplawoué', 'Poterie traditionnelle'],
    testimonials: [
      {
        name: 'Codjo A.',
        text: 'Pour honorer nos ancêtres royaux, notre famille a créé une cagnotte pour les cérémonies. Un succès !',
        occasion: 'Cérémonie ancestrale'
      },
      {
        name: 'Victorine H.',
        text: 'J\'ai offert un authentique bronze d\'Abomey à mon père. Il était ému par ce cadeau chargé d\'histoire.',
        occasion: 'Anniversaire'
      },
    ],
    stats: {
      businesses: '8+',
      gifts: '80+',
      users: '160+'
    },
    faqs: [
      {
        question: 'Proposez-vous des bronzes d\'Abomey authentiques ?',
        answer: 'Oui ! Nos artisans perpétuent la tradition des bronzes royaux d\'Abomey, classés au patrimoine UNESCO.'
      },
      {
        question: 'JOIE DE VIVRE livre-t-il à Abomey ?',
        answer: 'Nous livrons à Djimè, Zounzonmè, Hounli et tous les quartiers près des Palais Royaux.'
      },
      {
        question: 'Peut-on créer une cagnotte pour les cérémonies royales ?',
        answer: 'Absolument ! Honorez vos traditions familiales et cérémonies ancestrales avec une cagnotte collective.'
      },
      {
        question: 'Quels autres artisanats trouvez-vous ?',
        answer: 'Tissus applicués (Aplawoué), sculptures royales, tentures historiques et poteries traditionnelles.'
      }
    ]
  },

  ouidah: {
    slug: 'ouidah',
    city: 'Ouidah',
    country: 'Bénin',
    countryCode: 'BJ',
    population: '90,000',
    nicknames: ['La Cité Sacrée', 'Capitale du Vodoun', 'Glexwé'],
    coordinates: { lat: 6.3667, lng: 2.0833 },
    heroTitle: 'Cadeaux Collectifs à Ouidah',
    heroSubtitle: 'Célébrez à Zomaï, Tovè, Fonsramè et dans la capitale spirituelle du Vodoun',
    description: 'JOIE DE VIVRE dans la cité sacrée ! Créez des cagnottes à Ouidah pour vos célébrations. Route des Esclaves, artisanat vodoun et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Ouidah, Bénin. Fête du Vodoun, Route des Esclaves, artisanat sacré. Paiement MTN, Moov.',
    keywords: [
      'cadeaux Ouidah',
      'Fête du Vodoun',
      'Route des Esclaves',
      'artisanat vodoun',
      'cagnotte anniversaire Ouidah',
      'tourisme spirituel Bénin',
      'Temple des Pythons'
    ],
    neighborhoods: ['Zomaï', 'Tovè', 'Fonsramè', 'Ahouandjigo', 'Savi', 'Djègbadji', 'Pahou', 'Avlékété'],
    paymentMethods: [
      { name: 'MTN Mobile Money', icon: '🟡' },
      { name: 'Moov Money', icon: '🔵' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Flooz', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Fête du Vodoun (10 janvier)', 'Anniversaires', 'Mariages', 'Cérémonies spirituelles', 'Retour aux sources'],
    localProducts: ['Objets vodoun', 'Statues sacrées', 'Tissus rituels', 'Perles spirituelles', 'Sculptures mémorielles'],
    testimonials: [
      {
        name: 'Sagbo P.',
        text: 'Pour la Fête du Vodoun du 10 janvier, notre confrérie a rassemblé les contributions via JOIE DE VIVRE. Spirituel et moderne !',
        occasion: 'Fête du Vodoun'
      },
      {
        name: 'Élisabeth D.',
        text: 'Retour aux sources organisé pour grand-mère. La cagnotte familiale a rendu ce moment inoubliable.',
        occasion: 'Retour aux sources'
      },
    ],
    stats: {
      businesses: '6+',
      gifts: '70+',
      users: '140+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE respecte-t-il les traditions vodoun ?',
        answer: 'Absolument ! Nos artisans partenaires créent des objets dans le respect total des traditions spirituelles de Ouidah.'
      },
      {
        question: 'Peut-on créer une cagnotte pour la Fête du Vodoun ?',
        answer: 'Oui ! Le 10 janvier est l\'occasion parfaite pour une cagnotte collective célébrant cette fête nationale.'
      },
      {
        question: 'Livrez-vous sur la Route des Esclaves ?',
        answer: 'Nous livrons à Zomaï, Tovè, Fonsramè et jusqu\'à la Porte du Non-Retour pour vos cérémonies.'
      },
      {
        question: 'Proposez-vous des objets pour le retour aux sources ?',
        answer: 'Nos partenaires proposent des objets symboliques pour les cérémonies de retour aux sources de la diaspora.'
      }
    ]
  },

  // ============= SÉNÉGAL - NOUVELLES VILLES =============

  'saint-louis': {
    slug: 'saint-louis',
    city: 'Saint-Louis',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '250,000',
    nicknames: ['Ndar', 'Venise africaine', 'Ancienne capitale'],
    coordinates: { lat: 16.0167, lng: -16.5000 },
    heroTitle: 'Cadeaux Collectifs à Saint-Louis',
    heroSubtitle: 'Célébrez à Sor, Guet Ndar, Langue de Barbarie et dans toute la Venise africaine',
    description: 'JOIE DE VIVRE dans l\'ancienne capitale ! Créez des cagnottes à Saint-Louis, patrimoine UNESCO. Festival de Jazz, artisanat Ndar et paiement Wave/Orange Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Saint-Louis, patrimoine UNESCO Sénégal. Cagnottes mariages, Festival Jazz, artisanat. Paiement Wave, Orange Money.',
    keywords: [
      'cadeaux Saint-Louis',
      'Ndar artisanat',
      'patrimoine UNESCO Sénégal',
      'Festival Jazz Saint-Louis',
      'cagnotte Venise africaine',
      'fleuve Sénégal',
      'cagnotte mariage Ndar'
    ],
    neighborhoods: ['Sor', 'Guet Ndar', 'Langue de Barbarie', 'Nord', 'Sud', 'Île', 'Eaux Claires', 'Ndiolofène', 'Diamaguène', 'Pikine'],
    paymentMethods: [
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Wave', icon: '🔵' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Mariages', 'Festival de Jazz', 'Baptêmes', 'Tabaski', 'Korité', 'Saint-Louis Jazz'],
    localProducts: ['Artisanat Ndar', 'Bijoux touaregs', 'Peintures coloniales', 'Tissus indigo', 'Vannerie du fleuve'],
    testimonials: [
      {
        name: 'Oumar S.',
        text: 'Pour le Festival de Jazz, notre groupe d\'amis a créé une cagnotte. Une expérience musicale inoubliable à Ndar !',
        occasion: 'Festival Jazz'
      },
      {
        name: 'Aïda N.',
        text: 'Mariage traditionnel à Guet Ndar avec vue sur le fleuve. Les contributions venaient du monde entier !',
        occasion: 'Mariage'
      },
    ],
    stats: {
      businesses: '12+',
      gifts: '180+',
      users: '350+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à Saint-Louis ?',
        answer: 'Oui ! Nous livrons à Sor, Guet Ndar, Langue de Barbarie, l\'Île et tous les quartiers de la Venise africaine.'
      },
      {
        question: 'Proposez-vous des produits liés au patrimoine UNESCO ?',
        answer: 'Nos artisans créent des objets inspirés de l\'architecture coloniale, peintures et artisanat traditionnel Ndar.'
      },
      {
        question: 'Peut-on organiser une cagnotte pour le Festival de Jazz ?',
        answer: 'Absolument ! Créez une cagnotte pour vivre le Saint-Louis Jazz en groupe. Parfait entre amis !'
      },
      {
        question: 'Livrez-vous à Langue de Barbarie ?',
        answer: 'Oui, nous livrons sur toute la presqu\'île, y compris les zones touristiques et hôtelières.'
      }
    ]
  },

  touba: {
    slug: 'touba',
    city: 'Touba',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '1,000,000+',
    nicknames: ['La Ville Sainte', 'Capitale du Mouridisme', 'Touba Mosquée'],
    coordinates: { lat: 14.8500, lng: -15.8833 },
    heroTitle: 'Cadeaux Collectifs à Touba',
    heroSubtitle: 'Célébrez le Magal, les mariages et moments de foi à Darou Khoudoss, Darou Miname et dans la Ville Sainte',
    description: 'JOIE DE VIVRE dans la capitale spirituelle ! Créez des cagnottes à Touba pour le Magal, mariages et baptêmes. Artisanat mouride et paiement Wave/Orange Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Touba, ville sainte du Sénégal. Cagnottes Magal, mariages religieux, artisanat mouride. Paiement Wave, Orange Money.',
    keywords: [
      'cadeaux Touba',
      'cagnotte Magal',
      'Mouridisme cadeaux',
      'Grande Mosquée Touba',
      'ville sainte Sénégal',
      'artisanat mouride',
      'cagnotte religieuse Touba'
    ],
    neighborhoods: ['Darou Khoudoss', 'Darou Miname', 'Gouye Mbind', 'Touba Mosquée', 'Ndamatou', 'Darou Marnane', 'Touba Belel', 'Guédé'],
    paymentMethods: [
      { name: 'Wave', icon: '🔵' },
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Grand Magal', 'Mariages', 'Baptêmes', 'Korité', 'Tabaski', 'Ziarra', 'Gamou'],
    localProducts: ['Chapelets artisanaux', 'Livres religieux', 'Tapis de prière', 'Encens et parfums', 'Boubous blancs brodés'],
    testimonials: [
      {
        name: 'Cheikh M.',
        text: 'Pour le Grand Magal, notre dahira a créé une cagnotte. Des contributions de Dakar, Paris, New York... Une bénédiction !',
        occasion: 'Magal'
      },
      {
        name: 'Sokhna F.',
        text: 'Mariage béni à Touba. La cagnotte JOIE DE VIVRE a rassemblé toute la communauté mouride.',
        occasion: 'Mariage'
      },
    ],
    stats: {
      businesses: '15+',
      gifts: '300+',
      users: '600+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE respecte-t-il les valeurs mourides ?',
        answer: 'Absolument ! Notre plateforme facilite les contributions communautaires dans le respect des enseignements de Cheikh Ahmadou Bamba.'
      },
      {
        question: 'Peut-on créer une cagnotte pour le Magal ?',
        answer: 'Oui ! Le Grand Magal est l\'occasion idéale pour une cagnotte collective. Rassemblez votre dahira et vos proches.'
      },
      {
        question: 'Quels produits religieux proposez-vous ?',
        answer: 'Chapelets artisanaux, livres religieux, tapis de prière, encens traditionnels et boubous blancs brodés.'
      },
      {
        question: 'Comment payer à Touba ?',
        answer: 'Wave est très populaire à Touba. Orange Money, Free Money et E-Money sont aussi acceptés.'
      }
    ]
  },

  kaolack: {
    slug: 'kaolack',
    city: 'Kaolack',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '200,000',
    nicknames: ['La Capitale du Saloum', 'Carrefour du Sénégal', 'Ndangane'],
    coordinates: { lat: 14.1500, lng: -16.0667 },
    heroTitle: 'Cadeaux Collectifs à Kaolack',
    heroSubtitle: 'Célébrez à Médina Baye, Léona, Ndangane et dans la capitale économique du Saloum',
    description: 'JOIE DE VIVRE au carrefour du Sénégal ! Créez des cagnottes à Kaolack, hub commercial majeur. Marché d\'arachides, artisanat sérère et paiement Mobile Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Kaolack, Sénégal. Cagnottes mariages, marché arachides, artisanat Saloum. Paiement Wave, Orange Money.',
    keywords: [
      'cadeaux Kaolack',
      'marché arachides Sénégal',
      'cagnotte anniversaire Saloum',
      'artisanat sérère',
      'carrefour commercial',
      'cagnotte mariage Kaolack',
      'Médina Baye'
    ],
    neighborhoods: ['Médina Baye', 'Léona', 'Ndangane', 'Bongré', 'Kahone', 'Sam', 'Dialègne', 'Touba Kaolack', 'Thiofack'],
    paymentMethods: [
      { name: 'Wave', icon: '🔵' },
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Mariages', 'Gamou Médina Baye', 'Baptêmes', 'Tabaski', 'Korité', 'Fêtes commerciales'],
    localProducts: ['Arachides décortiquées', 'Huile d\'arachide', 'Tissus sérères', 'Sel de mer', 'Vannerie Saloum'],
    testimonials: [
      {
        name: 'Ibrahima D.',
        text: 'Pour le Gamou à Médina Baye, notre famille a créé une cagnotte. Des contributions de tout le Sénégal !',
        occasion: 'Gamou'
      },
      {
        name: 'Coumba S.',
        text: 'Mariage traditionnel sérère à Ndangane. La cagnotte a rendu notre union encore plus belle.',
        occasion: 'Mariage'
      },
    ],
    stats: {
      businesses: '10+',
      gifts: '140+',
      users: '280+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible à Kaolack ?',
        answer: 'Oui ! Nous livrons à Médina Baye, Léona, Ndangane, Bongré et tous les quartiers du carrefour du Sénégal.'
      },
      {
        question: 'Peut-on créer une cagnotte pour le Gamou Médina Baye ?',
        answer: 'Absolument ! Le Gamou est parfait pour rassembler les contributions de la communauté Niassène.'
      },
      {
        question: 'Quels produits locaux proposez-vous ?',
        answer: 'Arachides de qualité, huile artisanale, tissus sérères, sel de mer et vannerie du Saloum.'
      },
      {
        question: 'Comment payer à Kaolack ?',
        answer: 'Wave est très répandu. Orange Money, Free Money et E-Money fonctionnent parfaitement aussi.'
      }
    ]
  },

  ziguinchor: {
    slug: 'ziguinchor',
    city: 'Ziguinchor',
    country: 'Sénégal',
    countryCode: 'SN',
    population: '250,000',
    nicknames: ['La Perle du Sud', 'Capitale de la Casamance', 'Ziggy'],
    coordinates: { lat: 12.5833, lng: -16.2719 },
    heroTitle: 'Cadeaux Collectifs à Ziguinchor',
    heroSubtitle: 'Célébrez à Boucotte, Kandé, Escale et dans toute la verdoyante Casamance',
    description: 'JOIE DE VIVRE en Casamance ! Créez des cagnottes à Ziguinchor pour vos célébrations. Artisanat diola, forêts vertes et paiement Wave/Orange Money.',
    metaDescription: 'Plateforme de cadeaux collectifs à Ziguinchor, Casamance, Sénégal. Cagnottes mariages, artisanat diola, nature. Paiement Wave, Orange Money.',
    keywords: [
      'cadeaux Ziguinchor',
      'artisanat diola',
      'Casamance Sénégal',
      'cagnotte anniversaire Ziggy',
      'forêts Casamance',
      'cagnotte mariage Ziguinchor',
      'culture diola'
    ],
    neighborhoods: ['Boucotte', 'Kandé', 'Escale', 'Peyrissac', 'Tilène', 'Colobane', 'Diabir', 'Lyndiane', 'Néma', 'Château d\'eau'],
    paymentMethods: [
      { name: 'Wave', icon: '🔵' },
      { name: 'Orange Money', icon: '🟠' },
      { name: 'Free Money', icon: '🔴' },
      { name: 'E-Money', icon: '🟢' }
    ],
    currency: 'XOF (Franc CFA)',
    occasions: ['Mariages diola', 'Bukut (initiation)', 'Baptêmes', 'Korité', 'Noël', 'Fêtes de récolte'],
    localProducts: ['Vin de palme', 'Sculptures diola', 'Vannerie Casamance', 'Huile de palme', 'Bijoux traditionnels'],
    testimonials: [
      {
        name: 'Adama D.',
        text: 'Pour le Bukut de mon fils, la cagnotte a rassemblé toute la communauté diola. Tradition et modernité !',
        occasion: 'Bukut'
      },
      {
        name: 'Marie-Pierre M.',
        text: 'Mariage en Casamance avec contributions de Dakar et de l\'étranger. JOIE DE VIVRE a tout simplifié.',
        occasion: 'Mariage'
      },
    ],
    stats: {
      businesses: '8+',
      gifts: '100+',
      users: '200+'
    },
    faqs: [
      {
        question: 'JOIE DE VIVRE est-il disponible en Casamance ?',
        answer: 'Oui ! Nous livrons à Boucotte, Kandé, Escale, Tilène et tous les quartiers de Ziguinchor.'
      },
      {
        question: 'Proposez-vous de l\'artisanat diola ?',
        answer: 'Nos artisans créent sculptures, vanneries, bijoux et objets traditionnels de la culture diola.'
      },
      {
        question: 'Peut-on créer une cagnotte pour le Bukut ?',
        answer: 'Absolument ! L\'initiation diola mérite une cagnotte collective pour honorer cette tradition.'
      },
      {
        question: 'Comment payer en Casamance ?',
        answer: 'Wave et Orange Money sont très répandus. Free Money et E-Money fonctionnent aussi.'
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
