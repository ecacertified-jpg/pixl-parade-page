/**
 * Seasonal Landing Pages Data
 * Time-sensitive SEO pages for major events and holidays
 */

export interface SeasonalPageData {
  slug: string;
  event: string;
  year: number;
  emoji: string;
  date: string;
  dateISO: string;
  isVariable: boolean;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  countdown: boolean;
  traditions: {
    title: string;
    description: string;
  }[];
  fundIdeas: {
    title: string;
    description: string;
    emoji: string;
  }[];
  giftSuggestions: {
    category: string;
    description: string;
    link: string;
    emoji: string;
  }[];
  testimonials: {
    name: string;
    text: string;
    city: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const SEASONAL_PAGES: Record<string, SeasonalPageData> = {
  'tabaski-2026': {
    slug: 'tabaski-2026',
    event: 'Tabaski',
    year: 2026,
    emoji: '🐑',
    date: '7 juin 2026 (date estimée)',
    dateISO: '2026-06-07',
    isVariable: true,
    heroTitle: 'Tabaski 2026 - Préparez votre Cagnotte pour l\'Aïd el-Kebir',
    heroSubtitle: 'Réunissez votre famille pour offrir le mouton, des vêtements neufs ou un cadeau collectif. Contribuez via Mobile Money.',
    description: 'La Tabaski (Aïd el-Adha) est la fête du sacrifice et du partage. Créez une cagnotte familiale pour financer le mouton, les tenues de fête ou un cadeau groupé pour vos proches.',
    metaDescription: 'Cagnotte Tabaski 2026 - Aïd el-Kebir. Financez le mouton, vêtements, cadeaux ensemble. Collecte via Orange Money, MTN, Wave. Côte d\'Ivoire, Sénégal.',
    keywords: [
      'Tabaski 2026',
      'cagnotte Aïd el-Kebir',
      'cadeau mouton Tabaski',
      'cagnotte Tabaski Côte d\'Ivoire',
      'Tabaski Sénégal cadeaux',
      'financer mouton ensemble',
      'fête Tabaski Afrique',
      'cagnotte Eid Adha',
      'vêtements Tabaski',
      'cotisation Tabaski famille',
    ],
    countdown: true,
    traditions: [
      {
        title: 'Une fête de partage et de sacrifice',
        description: 'La Tabaski commémore le sacrifice d\'Ibrahim. C\'est une occasion de rassembler la famille, partager un repas festif et penser aux plus démunis. Le mouton est au cœur de la célébration.',
      },
      {
        title: 'Vêtements neufs pour toute la famille',
        description: 'Tradition veut que chacun porte des habits neufs pour la Tabaski. C\'est l\'occasion parfaite d\'offrir des tenues à vos proches, surtout aux enfants.',
      },
      {
        title: 'Générosité et solidarité',
        description: 'Une partie du mouton est traditionnellement offerte aux voisins et aux personnes dans le besoin. La Tabaski est un moment de partage et de générosité.',
      },
    ],
    fundIdeas: [
      { title: 'Cagnotte Mouton', description: 'Contribuez ensemble pour offrir le mouton à la famille. Partagez les frais équitablement.', emoji: '🐑' },
      { title: 'Cagnotte Vêtements', description: 'Offrez de nouveaux habits aux enfants et aux parents pour la fête.', emoji: '👕' },
      { title: 'Cagnotte Repas', description: 'Financez le repas de fête : viande, accompagnements, desserts pour toute la famille.', emoji: '🍖' },
      { title: 'Cagnotte Solidarité', description: 'Collectez pour aider une famille dans le besoin à célébrer dignement.', emoji: '💝' },
    ],
    giftSuggestions: [
      { category: 'Mode traditionnelle', description: 'Boubous, bazins, tenues wax pour la fête', link: '/shop?category=mode-vetements', emoji: '👘' },
      { category: 'Bijoux', description: 'Bijoux en or pour les femmes de la famille', link: '/shop?category=bijoux-accessoires', emoji: '💎' },
      { category: 'Parfums', description: 'Parfums et encens pour la fête', link: '/shop?category=parfums-beaute', emoji: '🌸' },
      { category: 'Décoration', description: 'Décoration maison pour accueillir les invités', link: '/shop?category=decoration-maison', emoji: '🏠' },
    ],
    testimonials: [
      {
        name: 'Famille Diallo',
        text: 'L\'an dernier, 12 membres de la famille ont cotisé pour le mouton. Maman n\'a eu aucun souci à gérer !',
        city: 'Abidjan',
      },
      {
        name: 'Les enfants Sy',
        text: 'On a offert de nouveaux boubous à tous les cousins grâce à la cagnotte. La joie dans leurs yeux !',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Quand créer ma cagnotte Tabaski ?',
        answer: 'Idéalement 3-4 semaines avant la fête pour avoir le temps de collecter et acheter le mouton au bon prix.',
      },
      {
        question: 'Peut-on utiliser les fonds pour acheter le mouton ?',
        answer: 'Oui ! Vous pouvez transférer les fonds sur votre Mobile Money et acheter le mouton chez votre boucher habituel.',
      },
      {
        question: 'Comment partager équitablement entre frères et sœurs ?',
        answer: 'L\'organisateur définit un montant suggéré. Chacun voit sa contribution et peut ajuster selon ses moyens.',
      },
    ],
  },

  'korite-2026': {
    slug: 'korite-2026',
    event: 'Korité',
    year: 2026,
    emoji: '🌙',
    date: '20 mars 2026 (date estimée)',
    dateISO: '2026-03-20',
    isVariable: true,
    heroTitle: 'Korité 2026 - Célébrez la Fin du Ramadan Ensemble',
    heroSubtitle: 'Après un mois de jeûne, célébrez l\'Aïd el-Fitr avec vos proches. Créez une cagnotte pour les cadeaux et le repas de fête.',
    description: 'La Korité (Aïd el-Fitr) marque la fin du Ramadan. C\'est un moment de joie, de prières et de retrouvailles familiales. Organisez une cagnotte pour les cadeaux et célébrations.',
    metaDescription: 'Cagnotte Korité 2026 - Aïd el-Fitr. Cadeaux fin Ramadan, vêtements, repas. Collecte Orange Money, Wave. Côte d\'Ivoire, Sénégal, Bénin.',
    keywords: [
      'Korité 2026',
      'cagnotte Eid al-Fitr',
      'cadeau fin Ramadan',
      'Korité Sénégal',
      'Korité Côte d\'Ivoire',
      'fête fin jeûne',
      'cagnotte Aïd el-Fitr',
      'vêtements Korité',
    ],
    countdown: true,
    traditions: [
      {
        title: 'La joie après le jeûne',
        description: 'La Korité célèbre la fin du mois de Ramadan. Après 30 jours de jeûne et de prières, c\'est un moment de joie et de gratitude.',
      },
      {
        title: 'Prières et rassemblement',
        description: 'La journée commence par la prière de l\'Aïd, suivie de visites familiales et d\'un grand repas festif.',
      },
      {
        title: 'Zakat al-Fitr',
        description: 'Avant la fête, les musulmans donnent l\'aumône (Zakat) pour que tous puissent célébrer dignement.',
      },
    ],
    fundIdeas: [
      { title: 'Cagnotte Repas de Fête', description: 'Financez le grand repas familial : thiéboudienne, méchoui, pâtisseries...', emoji: '🍛' },
      { title: 'Cagnotte Vêtements Enfants', description: 'Offrez de beaux habits neufs à tous les enfants de la famille.', emoji: '👶' },
      { title: 'Cagnotte Cadeau Parents', description: 'Gâtez vos parents avec un cadeau groupé après ce mois de dévotion.', emoji: '💝' },
    ],
    giftSuggestions: [
      { category: 'Mode & Tenues', description: 'Boubous et tenues traditionnelles', link: '/shop?category=mode-vetements', emoji: '👘' },
      { category: 'Pâtisseries', description: 'Gâteaux et douceurs pour la fête', link: '/shop?category=gastronomie-delices', emoji: '🎂' },
      { category: 'Parfums', description: 'Parfums et encens traditionnels', link: '/shop?category=parfums-beaute', emoji: '🌸' },
    ],
    testimonials: [
      {
        name: 'Famille Ndiaye',
        text: 'La cagnotte nous a permis d\'habiller les 8 enfants de la famille. Tout le monde était assorti !',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Quand créer la cagnotte pour la Korité ?',
        answer: 'Créez-la dès le début du Ramadan. Cela laisse un mois pour collecter et préparer les achats.',
      },
    ],
  },

  'fete-meres-2026': {
    slug: 'fete-meres-2026',
    event: 'Fête des Mères',
    year: 2026,
    emoji: '💐',
    date: '31 mai 2026',
    dateISO: '2026-05-31',
    isVariable: false,
    heroTitle: 'Fête des Mères 2026 - Offrez à Maman un Cadeau Inoubliable',
    heroSubtitle: 'Le 31 mai 2026, célébrez maman comme elle le mérite. Réunissez la fratrie pour un cadeau collectif exceptionnel.',
    description: 'La Fête des Mères approche ! Créez une cagnotte entre frères et sœurs pour offrir à maman LE cadeau dont elle rêve. Bijoux, voyage, spa... ensemble, tout devient possible.',
    metaDescription: 'Fête des Mères 2026 - Cagnotte cadeau maman. Offrez ensemble bijoux, spa, voyage. Collecte Orange Money. Côte d\'Ivoire, Sénégal.',
    keywords: [
      'Fête des Mères 2026',
      'cadeau maman',
      'cagnotte Fête des Mères',
      'offrir à maman',
      'cadeau maman collectif',
      'Fête des Mères Afrique',
      'Fête des Mères Abidjan',
      'surprise maman',
      'idée cadeau maman',
    ],
    countdown: true,
    traditions: [
      {
        title: 'Honorer nos mères',
        description: 'La Fête des Mères est l\'occasion de remercier celle qui nous a tout donné. Un cadeau, un repas, des mots d\'amour... chaque geste compte.',
      },
      {
        title: 'Un jour pour elle',
        description: 'Maman passe sa vie à s\'occuper des autres. Ce jour-là, c\'est à notre tour de la gâter sans compter.',
      },
    ],
    fundIdeas: [
      { title: 'Cagnotte Bijou de Rêve', description: 'Ce collier ou bracelet qu\'elle admire depuis des années.', emoji: '💎' },
      { title: 'Cagnotte Journée Spa', description: 'Offrez-lui une journée de détente absolue.', emoji: '🧖‍♀️' },
      { title: 'Cagnotte Voyage', description: 'Le voyage qu\'elle n\'a jamais osé se payer.', emoji: '✈️' },
      { title: 'Cagnotte Électroménager', description: 'Facilitez son quotidien avec un nouvel équipement.', emoji: '🏠' },
    ],
    giftSuggestions: [
      { category: 'Bijoux', description: 'Or, argent, perles... des bijoux qui durent', link: '/shop?category=bijoux-accessoires', emoji: '💎' },
      { category: 'Spa & Bien-être', description: 'Massages, soins, journée détente', link: '/shop?category=experiences-bien-etre', emoji: '🧖‍♀️' },
      { category: 'Fleurs', description: 'Bouquets spectaculaires', link: '/shop?category=fleurs-plantes', emoji: '💐' },
      { category: 'Parfums', description: 'Les grandes marques qu\'elle aime', link: '/shop?category=parfums-beaute', emoji: '🌸' },
    ],
    testimonials: [
      {
        name: 'Les enfants Kouamé',
        text: 'On est 6 enfants. L\'an dernier, on a offert à maman un voyage pour voir sa sœur en France. Elle a pleuré de joie.',
        city: 'Abidjan',
      },
      {
        name: 'Famille Sow',
        text: 'Le collier en or qu\'on lui a offert, elle le porte tous les jours. Chaque fois, elle pense à nous.',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Comment organiser la cagnotte entre frères et sœurs ?',
        answer: 'Un membre crée la cagnotte et partage le lien. Même ceux à l\'étranger peuvent contribuer par carte ou virement.',
      },
      {
        question: 'Comment garder la surprise ?',
        answer: 'Activez le mode "Surprise" lors de la création. Maman ne verra rien jusqu\'à la révélation que vous programmez.',
      },
    ],
  },

  'noel-2026': {
    slug: 'noel-2026',
    event: 'Noël',
    year: 2026,
    emoji: '🎄',
    date: '25 décembre 2026',
    dateISO: '2026-12-25',
    isVariable: false,
    heroTitle: 'Noël 2026 - Préparez des Cadeaux Mémorables pour vos Proches',
    heroSubtitle: 'Cette année, offrez des cadeaux à la hauteur de vos sentiments. Créez des cagnottes familiales pour des surprises inoubliables.',
    description: 'Noël approche ! Organisez des cagnottes collectives pour offrir de vrais cadeaux à vos proches. Parents, enfants, amis... tout le monde mérite un cadeau mémorable.',
    metaDescription: 'Noël 2026 - Cagnottes cadeaux. Offrez ensemble à famille et amis. Collecte Orange Money, MTN. Côte d\'Ivoire, Bénin.',
    keywords: [
      'Noël 2026',
      'cadeaux Noël Afrique',
      'cagnotte Noël',
      'Noël Côte d\'Ivoire',
      'cadeaux Noël collectif',
      'Noël Abidjan',
      'idées cadeaux Noël',
      'cadeau Noël famille',
    ],
    countdown: true,
    traditions: [
      {
        title: 'La magie de Noël',
        description: 'Noël est un moment de partage et de générosité. En famille ou entre amis, c\'est l\'occasion d\'offrir et de recevoir avec le cœur.',
      },
      {
        title: 'Le sapin et les cadeaux',
        description: 'Sous le sapin, les cadeaux attendent. Cette année, faites-les vraiment spéciaux grâce aux contributions de tous.',
      },
    ],
    fundIdeas: [
      { title: 'Cagnotte Cadeaux Enfants', description: 'Gâtez les enfants avec des jouets qu\'ils désirent vraiment.', emoji: '🧸' },
      { title: 'Cagnotte Cadeau Parents', description: 'Remerciez vos parents avec un cadeau mémorable.', emoji: '💝' },
      { title: 'Cagnotte Repas de Fête', description: 'Financez un réveillon inoubliable.', emoji: '🍗' },
      { title: 'Cagnotte Voyage Famille', description: 'Offrez des vacances en famille pour les fêtes.', emoji: '🏖️' },
    ],
    giftSuggestions: [
      { category: 'Jouets', description: 'Les jouets tendance pour les enfants', link: '/shop?category=jouets-enfants', emoji: '🧸' },
      { category: 'Tech', description: 'Smartphones, tablettes, gadgets', link: '/shop?category=tech-electronique', emoji: '📱' },
      { category: 'Bijoux', description: 'Des bijoux qui traversent le temps', link: '/shop?category=bijoux-accessoires', emoji: '💎' },
      { category: 'Mode', description: 'Tenues de fête et accessoires', link: '/shop?category=mode-vetements', emoji: '👗' },
    ],
    testimonials: [
      {
        name: 'Famille Brou',
        text: 'Noël dernier, les 4 cousins ont cotisé pour offrir une tablette à grand-mère. Elle fait maintenant des visios !',
        city: 'Abidjan',
      },
    ],
    faqs: [
      {
        question: 'Quand commencer la cagnotte de Noël ?',
        answer: 'Dès novembre pour avoir le temps de collecter, choisir et faire livrer les cadeaux à temps.',
      },
    ],
  },

  'rentree-scolaire-2026': {
    slug: 'rentree-scolaire-2026',
    event: 'Rentrée Scolaire',
    year: 2026,
    emoji: '📚',
    date: 'Septembre 2026',
    dateISO: '2026-09-01',
    isVariable: false,
    heroTitle: 'Rentrée Scolaire 2026 - Équipez les Enfants Ensemble',
    heroSubtitle: 'Les fournitures coûtent cher ? Créez une cagnotte familiale pour équiper les enfants sans stress.',
    description: 'La rentrée scolaire représente un budget important. Organisez une cagnotte entre parents, grands-parents et proches pour équiper les enfants de la famille.',
    metaDescription: 'Rentrée scolaire 2026 - Cagnotte fournitures, cartable, uniformes. Équipez les enfants ensemble. Orange Money, MTN. Côte d\'Ivoire.',
    keywords: [
      'rentrée scolaire 2026',
      'cagnotte fournitures',
      'équiper enfants rentrée',
      'rentrée scolaire Afrique',
      'cartable scolaire',
      'uniformes rentrée',
      'cotisation rentrée',
      'aider enfants scolarité',
    ],
    countdown: true,
    traditions: [
      {
        title: 'Investir dans l\'éducation',
        description: 'L\'éducation est le meilleur cadeau. En finançant ensemble les fournitures, on investit dans l\'avenir des enfants.',
      },
      {
        title: 'Solidarité familiale',
        description: 'Grands-parents, oncles, tantes... toute la famille peut contribuer à la réussite scolaire des enfants.',
      },
    ],
    fundIdeas: [
      { title: 'Cagnotte Fournitures', description: 'Cahiers, stylos, trousses... tout le nécessaire.', emoji: '✏️' },
      { title: 'Cagnotte Cartable', description: 'Un beau cartable solide pour toute l\'année.', emoji: '🎒' },
      { title: 'Cagnotte Uniformes', description: 'Uniformes neufs pour bien commencer l\'année.', emoji: '👔' },
      { title: 'Cagnotte Ordinateur', description: 'Un PC ou tablette pour les devoirs.', emoji: '💻' },
    ],
    giftSuggestions: [
      { category: 'Fournitures', description: 'Tout le matériel scolaire', link: '/shop?category=fournitures-scolaires', emoji: '📝' },
      { category: 'Informatique', description: 'Ordinateurs et tablettes', link: '/shop?category=tech-electronique', emoji: '💻' },
      { category: 'Mode enfants', description: 'Uniformes et chaussures', link: '/shop?category=mode-enfants', emoji: '👟' },
    ],
    testimonials: [
      {
        name: 'Famille Ouattara',
        text: 'Les grands-parents ont contribué à la cagnotte rentrée. Les 3 petits-enfants avaient tout le nécessaire dès le 1er jour.',
        city: 'Bouaké',
      },
    ],
    faqs: [
      {
        question: 'Comment organiser la cagnotte rentrée ?',
        answer: 'Un parent crée la cagnotte en juillet/août et partage le lien à la famille. Les fonds permettent d\'acheter les fournitures avant la rentrée.',
      },
      {
        question: 'Peut-on aider les enfants d\'autres familles ?',
        answer: 'Oui ! Créez une cagnotte solidarité pour aider des enfants défavorisés à avoir leurs fournitures.',
      },
    ],
  },
};

export function getSeasonalData(slug: string): SeasonalPageData | undefined {
  return SEASONAL_PAGES[slug];
}

export function getAllSeasonalSlugs(): string[] {
  return Object.keys(SEASONAL_PAGES);
}

/**
 * Get upcoming seasonal events (sorted by date)
 */
export function getUpcomingSeasonalEvents(): SeasonalPageData[] {
  const now = new Date();
  return Object.values(SEASONAL_PAGES)
    .filter(page => new Date(page.dateISO) > now)
    .sort((a, b) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime());
}

/**
 * Calculate days until event
 */
export function getDaysUntil(dateISO: string): number {
  const now = new Date();
  const eventDate = new Date(dateISO);
  const diffTime = eventDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
