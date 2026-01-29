/**
 * Vendor Sector Landing Pages Data
 * B2B SEO pages for recruiting vendors by business type
 */

export interface VendorSectorPageData {
  slug: string;
  sector: string;
  emoji: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  benefits: {
    icon: string;
    title: string;
    description: string;
  }[];
  features: {
    icon: string;
    title: string;
    description: string;
  }[];
  successStories: {
    businessName: string;
    ownerName: string;
    quote: string;
    metric: string;
    city: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  pricing: {
    joinFee: string;
    commission: string;
    payoutDelay: string;
  };
  requirements: string[];
  targetCategories: string[];
}

export const VENDOR_SECTOR_PAGES: Record<string, VendorSectorPageData> = {
  patisserie: {
    slug: 'patisserie',
    sector: 'Pâtisserie & Gâteaux',
    emoji: '🎂',
    heroTitle: 'Vendez vos Gâteaux sur JOIE DE VIVRE - Plateforme #1 Cadeaux Abidjan',
    heroSubtitle: 'Recevez des commandes de gâteaux d\'anniversaire, mariages et événements. Paiement sécurisé avant préparation, livraison organisée.',
    description: 'Rejoignez la communauté de pâtissiers de JOIE DE VIVRE. Nos utilisateurs créent des cagnottes pour des occasions spéciales et cherchent des gâteaux sur mesure. Augmentez vos ventes avec des commandes qualifiées.',
    metaDescription: 'Devenez vendeur pâtisserie sur JOIE DE VIVRE. Recevez des commandes gâteaux anniversaire, mariage. Paiement garanti, dashboard pro. Abidjan, Côte d\'Ivoire.',
    keywords: [
      'vendre gâteaux en ligne',
      'pâtissier Abidjan',
      'commandes gâteaux anniversaire',
      'vendre pâtisserie marketplace',
      'gâteau mariage Abidjan',
      'pâtissier en ligne Côte d\'Ivoire',
      'inscription vendeur pâtisserie',
      'plateforme gâteaux Afrique',
      'devenir vendeur gâteaux',
      'commandes pâtisserie en ligne',
    ],
    benefits: [
      { icon: '📦', title: '50+ commandes/mois', description: 'Nos pâtissiers partenaires reçoivent en moyenne 50 commandes mensuelles de gâteaux personnalisés.' },
      { icon: '💳', title: 'Paiement garanti', description: 'Recevez l\'argent avant de préparer la commande. Zéro risque d\'impayé.' },
      { icon: '🎂', title: 'Commandes qualifiées', description: 'Nos clients ont déjà collecté l\'argent via leur cagnotte. Budget confirmé.' },
      { icon: '📊', title: 'Dashboard pro', description: 'Gérez vos commandes, stocks et statistiques depuis votre espace dédié.' },
      { icon: '🔔', title: 'Notifications', description: 'Soyez alerté immédiatement de chaque nouvelle commande.' },
      { icon: '🚚', title: 'Livraison flexible', description: 'Livrez vous-même ou utilisez nos partenaires logistiques.' },
    ],
    features: [
      { icon: '📸', title: 'Catalogue photos', description: 'Présentez vos créations avec des photos haute qualité.' },
      { icon: '💰', title: 'Prix personnalisés', description: 'Définissez vos tarifs selon les formats et personnalisations.' },
      { icon: '📅', title: 'Calendrier', description: 'Gérez votre disponibilité et délais de préparation.' },
      { icon: '⭐', title: 'Avis clients', description: 'Collectez des avis pour renforcer votre réputation.' },
      { icon: '📈', title: 'Statistiques', description: 'Suivez vos ventes, produits phares et revenus.' },
      { icon: '💬', title: 'Chat client', description: 'Échangez directement avec vos clients pour personnaliser.' },
    ],
    successStories: [
      {
        businessName: 'Sweet Délices',
        ownerName: 'Aminata',
        quote: 'Depuis que je suis sur JDV, mes commandes ont triplé ! Les clients arrivent avec le budget déjà prêt.',
        metric: '150+ gâteaux/mois',
        city: 'Abidjan',
      },
      {
        businessName: 'Pâtisserie du Bonheur',
        ownerName: 'Marie-Claire',
        quote: 'Je me suis lancée il y a 6 mois. Aujourd\'hui, je vis de ma passion grâce aux commandes JDV.',
        metric: '80 gâteaux/mois',
        city: 'Cocody',
      },
      {
        businessName: 'Cake Design by Fatou',
        ownerName: 'Fatou',
        quote: 'Les mariages représentent 60% de mes commandes. JOIE DE VIVRE m\'a fait connaître.',
        metric: '40+ mariages/an',
        city: 'Marcory',
      },
    ],
    faqs: [
      {
        question: 'Comment m\'inscrire comme pâtissier ?',
        answer: 'Cliquez sur "Créer ma boutique", remplissez le formulaire avec vos informations et photos de vos créations. Votre profil sera validé sous 48h.',
      },
      {
        question: 'Quels sont les frais ?',
        answer: 'L\'inscription est gratuite. Nous prélevons une commission de 8% sur chaque vente réalisée. Aucun abonnement mensuel.',
      },
      {
        question: 'Comment suis-je payé ?',
        answer: 'Les paiements sont virés sur votre compte Mobile Money (Orange, MTN, Wave) sous 24-48h après validation de la commande.',
      },
      {
        question: 'Dois-je avoir un local ?',
        answer: 'Un espace de production aux normes est nécessaire. Nous pouvons vous conseiller sur les certifications si besoin.',
      },
      {
        question: 'Puis-je refuser des commandes ?',
        answer: 'Oui, vous restez maître de vos commandes. Vous pouvez refuser si vous n\'êtes pas disponible ou si la demande ne correspond pas à votre offre.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Disposer d\'un espace de production propre et équipé',
      'Avoir une pièce d\'identité valide (CNI ou passeport)',
      'Pouvoir livrer à Abidjan ou utiliser nos partenaires logistiques',
      'Fournir des photos de vos créations',
      'Avoir un compte Mobile Money actif',
    ],
    targetCategories: ['gastronomie-delices'],
  },

  fleuriste: {
    slug: 'fleuriste',
    sector: 'Fleuriste & Bouquets',
    emoji: '💐',
    heroTitle: 'Vendez vos Bouquets sur JOIE DE VIVRE - Commandes Cadeaux Garanties',
    heroSubtitle: 'Recevez des commandes de bouquets pour anniversaires, Saint-Valentin, deuil et toutes les occasions. Livraison express organisée.',
    description: 'Rejoignez notre réseau de fleuristes partenaires. Nos utilisateurs offrent des fleurs pour toutes les occasions et cherchent des compositions originales livrées rapidement.',
    metaDescription: 'Devenez fleuriste partenaire JOIE DE VIVRE. Commandes bouquets anniversaire, mariage, livraison. Paiement garanti. Abidjan, Côte d\'Ivoire.',
    keywords: [
      'fleuriste en ligne Abidjan',
      'vendre bouquets livraison',
      'devenir fleuriste marketplace',
      'commandes fleurs Côte d\'Ivoire',
      'bouquets mariage Abidjan',
      'fleuriste partenaire',
      'vendre compositions florales',
      'livraison fleurs Abidjan',
    ],
    benefits: [
      { icon: '💐', title: 'Commandes régulières', description: 'Anniversaires, Saint-Valentin, Fête des Mères... les occasions ne manquent pas.' },
      { icon: '🚚', title: 'Livraison express', description: 'Nos partenaires livrent vos bouquets le jour même si besoin.' },
      { icon: '💳', title: 'Paiement d\'avance', description: 'Vous êtes payé avant de préparer la commande.' },
      { icon: '📸', title: 'Visibilité', description: 'Vos créations mises en avant auprès de milliers d\'acheteurs.' },
    ],
    features: [
      { icon: '🌸', title: 'Catalogue', description: 'Présentez vos compositions avec prix et options.' },
      { icon: '📅', title: 'Disponibilité', description: 'Gérez votre stock et délais en temps réel.' },
      { icon: '📦', title: 'Commandes groupées', description: 'Recevez des commandes pour mariages et événements.' },
      { icon: '⭐', title: 'Réputation', description: 'Les avis clients boostent votre visibilité.' },
    ],
    successStories: [
      {
        businessName: 'Fleurs d\'Afrique',
        ownerName: 'Adjoua',
        quote: 'La Saint-Valentin, j\'ai eu 80 commandes en 3 jours. JOIE DE VIVRE a transformé mon activité.',
        metric: '200+ bouquets/mois',
        city: 'Plateau',
      },
      {
        businessName: 'Rose & Co',
        ownerName: 'Brigitte',
        quote: 'Les commandes pour mariages arrivent naturellement. Je fournis maintenant 10 mariages par mois.',
        metric: '10 mariages/mois',
        city: 'Cocody',
      },
    ],
    faqs: [
      {
        question: 'Comment sont gérées les livraisons express ?',
        answer: 'Nous avons des partenaires livreurs. Vous préparez le bouquet, ils le récupèrent et livrent sous 2h dans Abidjan.',
      },
      {
        question: 'Puis-je proposer des compositions personnalisées ?',
        answer: 'Oui ! Vous pouvez échanger avec le client via notre chat pour créer la composition parfaite.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Disposer d\'un stock de fleurs fraîches régulier',
      'Pouvoir livrer ou accepter notre service de livraison',
      'Avoir un compte Mobile Money actif',
      'Fournir des photos de vos créations',
    ],
    targetCategories: ['fleurs-plantes'],
  },

  mode: {
    slug: 'mode',
    sector: 'Mode & Wax',
    emoji: '👗',
    heroTitle: 'Vendez votre Mode Africaine sur JOIE DE VIVRE - Stylistes & Couturiers',
    heroSubtitle: 'Créateurs de mode, couturiers, stylistes : vendez vos créations wax, boubous et tenues sur mesure à des clients prêts à acheter.',
    description: 'Rejoignez notre marketplace de mode africaine. Nos clients cherchent des tenues originales pour leurs célébrations. Vendez vos créations à une clientèle qualifiée.',
    metaDescription: 'Devenez vendeur mode JOIE DE VIVRE. Vendez wax, boubous, tenues africaines. Commandes événements, mariages. Abidjan, Côte d\'Ivoire.',
    keywords: [
      'vendre mode africaine',
      'styliste Abidjan marketplace',
      'vendre wax en ligne',
      'couturier partenaire',
      'boubou en ligne Côte d\'Ivoire',
      'tenue africaine vente',
      'mode wax Abidjan',
      'créateur africain vendre',
    ],
    benefits: [
      { icon: '👗', title: 'Clientèle cible', description: 'Des acheteurs cherchant des tenues pour mariages, baptêmes, cérémonies.' },
      { icon: '🎁', title: 'Cadeaux mode', description: 'Vos créations sont offertes en cadeau - clients au budget confirmé.' },
      { icon: '📐', title: 'Sur mesure', description: 'Proposez des créations personnalisées selon les mensurations.' },
      { icon: '🌍', title: 'Diaspora', description: 'Touchez les Africains de l\'étranger qui commandent pour leurs proches.' },
    ],
    features: [
      { icon: '📸', title: 'Lookbook', description: 'Présentez vos collections avec shooting pro.' },
      { icon: '📏', title: 'Guide tailles', description: 'Outil de prise de mesures intégré.' },
      { icon: '🎨', title: 'Personnalisation', description: 'Proposez tissus et options sur chaque modèle.' },
      { icon: '📦', title: 'Délais', description: 'Gérez vos délais de confection.' },
    ],
    successStories: [
      {
        businessName: 'Wax By Ama',
        ownerName: 'Aïssata',
        quote: 'Je vends 30 tenues par mois uniquement via JDV. Mes clientes reviennent pour chaque événement.',
        metric: '30 tenues/mois',
        city: 'Yopougon',
      },
      {
        businessName: 'Atelier Koné',
        ownerName: 'Mamadou',
        quote: 'Les commandes de boubous pour mariages arrivent 3 mois à l\'avance. Je peux planifier sereinement.',
        metric: '15 mariages/mois',
        city: 'Treichville',
      },
    ],
    faqs: [
      {
        question: 'Comment gérer les commandes sur mesure ?',
        answer: 'Notre chat intégré vous permet d\'échanger avec le client, récupérer ses mesures et valider le tissu avant de commencer.',
      },
      {
        question: 'Puis-je vendre du prêt-à-porter ?',
        answer: 'Oui ! Vous pouvez proposer à la fois des pièces prêtes et des créations sur mesure.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Être styliste, couturier ou créateur de mode',
      'Disposer d\'un atelier ou espace de création',
      'Fournir des photos de vos créations',
      'Avoir un compte Mobile Money actif',
    ],
    targetCategories: ['mode-vetements'],
  },

  bijoux: {
    slug: 'bijoux',
    sector: 'Bijoux & Accessoires',
    emoji: '💎',
    heroTitle: 'Vendez vos Bijoux sur JOIE DE VIVRE - Créateurs & Bijoutiers',
    heroSubtitle: 'Bijoutiers, créateurs d\'accessoires : vendez vos pièces uniques à des clients qui offrent des cadeaux premium.',
    description: 'Rejoignez notre marketplace bijoux. Nos clients collectent des fonds pour offrir des bijoux mémorables. Vendez vos créations à prix premium.',
    metaDescription: 'Devenez vendeur bijoux JOIE DE VIVRE. Vendez or, argent, perles africaines. Cadeaux premium, commandes garanties. Abidjan.',
    keywords: [
      'vendre bijoux Abidjan',
      'bijoutier marketplace',
      'créateur bijoux Côte d\'Ivoire',
      'vendre or argent en ligne',
      'bijoux africains vente',
      'accessoires artisanaux Afrique',
      'bijouterie en ligne Abidjan',
    ],
    benefits: [
      { icon: '💎', title: 'Clientèle premium', description: 'Des acheteurs avec budget grâce aux cagnottes collectives.' },
      { icon: '🎁', title: 'Cadeaux haut de gamme', description: 'Bijoux = cadeaux préférés pour anniversaires et mariages.' },
      { icon: '⭐', title: 'Valorisation', description: 'Vos pièces mises en avant comme cadeaux d\'exception.' },
      { icon: '📦', title: 'Écrin inclus', description: 'Packaging premium pour une expérience cadeau complète.' },
    ],
    features: [
      { icon: '📸', title: 'Photos pro', description: 'Présentez vos bijoux avec photos haute qualité.' },
      { icon: '📏', title: 'Guide tailles', description: 'Bagues, bracelets : aidez les clients à choisir.' },
      { icon: '✨', title: 'Personnalisation', description: 'Gravure, ajustements sur demande.' },
      { icon: '🔒', title: 'Certifications', description: 'Affichez vos garanties et poinçons.' },
    ],
    successStories: [
      {
        businessName: 'Or d\'Afrique',
        ownerName: 'Jean-Pierre',
        quote: 'Les cagnottes permettent à mes clients d\'acheter des pièces plus prestigieuses. Mon panier moyen a doublé.',
        metric: 'Panier moyen x2',
        city: 'Plateau',
      },
      {
        businessName: 'Perles de Mama',
        ownerName: 'Awa',
        quote: 'Mes colliers artisanaux se vendent parfaitement en cadeau. 90% de mes ventes viennent de JDV.',
        metric: '50 pièces/mois',
        city: 'Marcory',
      },
    ],
    faqs: [
      {
        question: 'Comment garantir l\'authenticité de l\'or ?',
        answer: 'Vous pouvez afficher vos certifications, poinçons et garanties sur votre profil pour rassurer les acheteurs.',
      },
      {
        question: 'Les bijoux personnalisés sont-ils possibles ?',
        answer: 'Oui ! Proposez la gravure, les ajustements de taille et les créations sur mesure via notre système.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Être bijoutier ou créateur d\'accessoires',
      'Fournir des photos de qualité de vos créations',
      'Proposer un packaging cadeau soigné',
      'Avoir un compte Mobile Money actif',
    ],
    targetCategories: ['bijoux-accessoires'],
  },

  spa: {
    slug: 'spa',
    sector: 'Bien-être & Spa',
    emoji: '🧖‍♀️',
    heroTitle: 'Vendez vos Soins Spa sur JOIE DE VIVRE - Expériences Bien-être',
    heroSubtitle: 'Spas, masseurs, esthéticiennes : proposez vos soins en cadeau. Bons cadeaux, forfaits et expériences détente.',
    description: 'Rejoignez notre marketplace bien-être. Les cadeaux expérientiels (spa, massage, soins) sont très demandés. Vendez vos prestations en bon cadeau.',
    metaDescription: 'Devenez partenaire spa JOIE DE VIVRE. Vendez massages, soins, bons cadeaux bien-être. Abidjan, Côte d\'Ivoire.',
    keywords: [
      'spa Abidjan partenaire',
      'vendre soins bien-être',
      'bon cadeau massage',
      'spa marketplace Afrique',
      'expérience détente cadeau',
      'esthéticienne en ligne',
      'massage cadeau Abidjan',
    ],
    benefits: [
      { icon: '🧖‍♀️', title: 'Cadeaux expérientiels', description: 'Les expériences sont les cadeaux les plus mémorables.' },
      { icon: '🎁', title: 'Bons cadeaux', description: 'Vendez des bons utilisables selon disponibilité.' },
      { icon: '👥', title: 'Nouvelles clientes', description: 'Touchez des personnes qui ne vous connaissaient pas.' },
      { icon: '💳', title: 'Paiement d\'avance', description: 'Le bon est payé avant utilisation.' },
    ],
    features: [
      { icon: '📋', title: 'Menu soins', description: 'Présentez tous vos soins avec durée et tarifs.' },
      { icon: '📅', title: 'Réservation', description: 'Le client réserve son créneau en ligne.' },
      { icon: '🎫', title: 'Bons valides', description: 'Gérez la validité et l\'utilisation des bons.' },
      { icon: '⭐', title: 'Avis', description: 'Collectez les retours clients.' },
    ],
    successStories: [
      {
        businessName: 'Zen Spa',
        ownerName: 'Christelle',
        quote: 'Les bons cadeaux représentent 40% de mon chiffre. Beaucoup de clientes reviennent ensuite régulièrement.',
        metric: '60 bons/mois',
        city: 'Zone 4',
      },
      {
        businessName: 'Détente by Aïcha',
        ownerName: 'Aïcha',
        quote: 'Je travaille seule et JDV m\'a permis de remplir mon planning 3 semaines à l\'avance.',
        metric: 'Planning plein',
        city: 'Cocody',
      },
    ],
    faqs: [
      {
        question: 'Comment fonctionnent les bons cadeaux ?',
        answer: 'Vous définissez vos prestations. Le client achète un bon qu\'il offre. Le bénéficiaire vous contacte pour réserver selon vos disponibilités.',
      },
      {
        question: 'Quelle est la validité des bons ?',
        answer: 'Vous définissez la durée de validité (généralement 6 mois à 1 an). Le système gère les rappels automatiquement.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Disposer d\'un espace de soins professionnel',
      'Avoir les certifications/formations nécessaires',
      'Fournir des photos de votre espace',
      'Avoir un compte Mobile Money actif',
    ],
    targetCategories: ['experiences-bien-etre'],
  },

  traiteur: {
    slug: 'traiteur',
    sector: 'Traiteur & Événements',
    emoji: '🍽️',
    heroTitle: 'Devenez Traiteur Partenaire JOIE DE VIVRE - Commandes Événements',
    heroSubtitle: 'Traiteurs, chefs à domicile, décorateurs : recevez des commandes pour anniversaires, mariages et célébrations.',
    description: 'Rejoignez notre réseau de traiteurs. Nos utilisateurs organisent des événements avec budget collecté. Proposez vos services et menus.',
    metaDescription: 'Devenez traiteur partenaire JOIE DE VIVRE. Commandes événements, mariages, anniversaires. Paiement garanti. Abidjan.',
    keywords: [
      'traiteur Abidjan partenaire',
      'chef événement marketplace',
      'commandes traiteur mariage',
      'traiteur anniversaire Abidjan',
      'service traiteur en ligne',
      'chef domicile Côte d\'Ivoire',
      'décoration événement',
    ],
    benefits: [
      { icon: '🍽️', title: 'Événements qualifiés', description: 'Des clients avec budget déjà collecté via cagnotte.' },
      { icon: '📅', title: 'Planification', description: 'Les événements sont connus à l\'avance.' },
      { icon: '💰', title: 'Gros budgets', description: 'Les cagnottes permettent des prestations premium.' },
      { icon: '🔁', title: 'Récurrence', description: 'Un client satisfait revient pour chaque événement.' },
    ],
    features: [
      { icon: '📋', title: 'Menus & Formules', description: 'Présentez vos offres avec options et tarifs.' },
      { icon: '👥', title: 'Devis personnalisé', description: 'Échangez avec le client pour adapter à ses besoins.' },
      { icon: '📸', title: 'Portfolio', description: 'Montrez vos réalisations passées.' },
      { icon: '⭐', title: 'Avis vérifiés', description: 'Les recommandations boostent votre crédibilité.' },
    ],
    successStories: [
      {
        businessName: 'Saveurs d\'Ici',
        ownerName: 'Moussa',
        quote: 'Je fournis 8 mariages par mois grâce à JDV. Les clients arrivent avec le budget prêt, c\'est idéal.',
        metric: '8 mariages/mois',
        city: 'Yopougon',
      },
      {
        businessName: 'Chef à Domicile',
        ownerName: 'Patricia',
        quote: 'Les anniversaires surprise sont ma spécialité. JDV m\'envoie des clients parfaits.',
        metric: '15 événements/mois',
        city: 'Cocody',
      },
    ],
    faqs: [
      {
        question: 'Comment recevoir des commandes ?',
        answer: 'Créez votre profil avec vos menus et formules. Les clients vous contactent via notre plateforme pour discuter de leur événement.',
      },
      {
        question: 'Puis-je proposer des formules personnalisées ?',
        answer: 'Absolument ! Notre système permet d\'échanger avec le client et de créer une offre sur mesure.',
      },
    ],
    pricing: {
      joinFee: 'Gratuit',
      commission: '8% par vente',
      payoutDelay: '24-48h',
    },
    requirements: [
      'Avoir une expérience en restauration/traiteur',
      'Disposer du matériel et équipe nécessaires',
      'Fournir des photos de vos réalisations',
      'Avoir un compte Mobile Money actif',
    ],
    targetCategories: ['gastronomie-delices'],
  },
};

export function getVendorSectorData(slug: string): VendorSectorPageData | undefined {
  return VENDOR_SECTOR_PAGES[slug];
}

export function getAllVendorSectorSlugs(): string[] {
  return Object.keys(VENDOR_SECTOR_PAGES);
}
