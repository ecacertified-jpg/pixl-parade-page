/**
 * Occasion Landing Pages Data
 * SEO-optimized pages for each celebration type
 */

export interface OccasionPageData {
  slug: string;
  occasion: string;
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
  giftIdeas: {
    name: string;
    link: string;
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
  relatedOccasions: string[];
  stats: {
    fundsCreated: string;
    avgAmount: string;
    contributors: string;
  };
}

export const OCCASION_PAGES: Record<string, OccasionPageData> = {
  anniversaire: {
    slug: 'anniversaire',
    occasion: 'Anniversaire',
    emoji: '🎂',
    heroTitle: 'Cagnotte Anniversaire - Offrez Ensemble un Cadeau Inoubliable',
    heroSubtitle: 'Réunissez vos proches pour offrir LE cadeau parfait. Gratuit, simple, via Mobile Money.',
    description: 'Créez une cagnotte anniversaire et collectez les contributions de votre famille et amis. Choisissez ensuite le cadeau idéal parmi nos artisans locaux ou laissez le bénéficiaire choisir.',
    metaDescription: 'Créez une cagnotte anniversaire gratuite. Collectez les contributions de famille et amis via Orange Money, MTN, Wave. Livraison cadeaux Abidjan, Dakar, Cotonou.',
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
      'cadeau anniversaire Afrique',
      'organiser surprise anniversaire',
      'financer cadeau groupe',
      'pot commun gratuit',
    ],
    benefits: [
      { icon: '💰', title: 'Gratuit', description: 'Aucun frais de création. Seule une petite commission sur les contributions.' },
      { icon: '📱', title: 'Mobile Money', description: 'Orange Money, MTN, Wave, Moov - tous les moyens de paiement locaux acceptés.' },
      { icon: '🎁', title: 'Boutique intégrée', description: 'Choisissez parmi 500+ artisans locaux ou laissez le choix au bénéficiaire.' },
      { icon: '🔔', title: 'Rappels automatiques', description: 'Ne ratez plus jamais un anniversaire grâce à nos notifications intelligentes.' },
      { icon: '🎉', title: 'Révélation surprise', description: 'Programmez une révélation surprise avec musique et animation.' },
      { icon: '📊', title: 'Suivi en temps réel', description: 'Suivez les contributions et la progression de votre cagnotte.' },
    ],
    giftIdeas: [
      { name: 'Bijoux personnalisés', link: '/shop?category=bijoux-accessoires' },
      { name: 'Gâteau sur mesure', link: '/shop?category=gastronomie-delices' },
      { name: 'Expérience spa', link: '/shop?category=experiences-bien-etre' },
      { name: 'Tenue wax', link: '/shop?category=mode-vetements' },
      { name: 'Bouquet de fleurs', link: '/shop?category=fleurs-plantes' },
      { name: 'Panier gourmand', link: '/shop?category=gastronomie-delices' },
    ],
    testimonials: [
      {
        name: 'Aminata K.',
        text: 'Grâce à JOIE DE VIVRE, on a pu offrir à maman un collier en or qu\'elle admirait depuis des mois. 15 personnes ont contribué en 3 jours !',
        city: 'Abidjan',
      },
      {
        name: 'Kofi M.',
        text: 'Super simple ! J\'ai créé la cagnotte en 2 minutes, partagé le lien sur WhatsApp, et la surprise était parfaite.',
        city: 'Cotonou',
      },
      {
        name: 'Fatou D.',
        text: 'Pour les 50 ans de papa, on était 30 à contribuer. Il a reçu un smartphone dernier cri !',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Comment créer une cagnotte anniversaire ?',
        answer: 'Inscrivez-vous gratuitement, cliquez sur "Créer une cagnotte", sélectionnez "Anniversaire", personnalisez votre page avec photo et message, puis partagez le lien par WhatsApp ou SMS à vos proches.',
      },
      {
        question: 'Quels moyens de paiement sont acceptés ?',
        answer: 'Nous acceptons Orange Money, MTN Mobile Money, Wave, Moov Money et Flooz. Aucune carte bancaire nécessaire.',
      },
      {
        question: 'Y a-t-il des frais de création ?',
        answer: 'Non, la création de cagnotte est 100% gratuite. Une commission de 5% est prélevée uniquement sur les contributions reçues.',
      },
      {
        question: 'Comment le bénéficiaire reçoit-il le cadeau ?',
        answer: 'Vous pouvez choisir un cadeau dans notre boutique avec livraison, ou transférer les fonds directement au bénéficiaire pour qu\'il choisisse lui-même.',
      },
      {
        question: 'Peut-on organiser une surprise ?',
        answer: 'Oui ! Activez le mode "Surprise" et programmez une date de révélation. Le bénéficiaire découvrira la cagnotte avec un message personnalisé et une animation festive.',
      },
    ],
    relatedOccasions: ['mariage', 'naissance', 'diplome', 'promotion'],
    stats: {
      fundsCreated: '2,500+',
      avgAmount: '75,000 FCFA',
      contributors: '12',
    },
  },

  mariage: {
    slug: 'mariage',
    occasion: 'Mariage',
    emoji: '💒',
    heroTitle: 'Cagnotte Mariage - La Liste de Mariage Moderne pour l\'Afrique',
    heroSubtitle: 'Recevez les contributions de vos invités facilement. Financez votre voyage de noces, votre maison ou vos projets.',
    description: 'Remplacez la liste de mariage traditionnelle par une cagnotte moderne. Vos invités contribuent via Mobile Money, et vous utilisez les fonds comme bon vous semble.',
    metaDescription: 'Cagnotte mariage gratuite - Liste de mariage moderne. Collectez les contributions via Orange Money, MTN, Wave. Côte d\'Ivoire, Sénégal, Bénin.',
    keywords: [
      'cagnotte mariage',
      'liste mariage Afrique',
      'pot commun mariage',
      'cadeau mariage collectif',
      'contribution mariage en ligne',
      'cagnotte couple',
      'financer mariage Afrique',
      'liste mariage moderne',
      'cagnotte voyage noces',
      'mariage Abidjan cadeaux',
      'mariage Dakar cagnotte',
      'urne mariage digitale',
      'collecte mariage Orange Money',
    ],
    benefits: [
      { icon: '💑', title: 'Une seule cagnotte', description: 'Fini les cadeaux en double ! Recevez ce dont vous avez vraiment besoin.' },
      { icon: '🌍', title: 'Invités partout', description: 'Même les proches à l\'étranger peuvent contribuer facilement.' },
      { icon: '🏠', title: 'Liberté totale', description: 'Utilisez les fonds pour votre maison, voyage de noces ou tout autre projet.' },
      { icon: '📱', title: 'Paiement local', description: 'Orange Money, MTN, Wave - adapté à vos invités.' },
      { icon: '📸', title: 'Page personnalisée', description: 'Ajoutez vos photos, votre histoire et vos objectifs.' },
      { icon: '📊', title: 'Suivi transparent', description: 'Voyez qui a contribué et remerciez chacun personnellement.' },
    ],
    giftIdeas: [
      { name: 'Électroménager', link: '/shop?category=maison-electromenager' },
      { name: 'Décoration intérieure', link: '/shop?category=decoration-maison' },
      { name: 'Voyage de noces', link: '/shop?category=experiences-bien-etre' },
      { name: 'Tenues de cérémonie', link: '/shop?category=mode-vetements' },
      { name: 'Bijoux de mariage', link: '/shop?category=bijoux-accessoires' },
    ],
    testimonials: [
      {
        name: 'Awa & Moussa',
        text: 'Notre cagnotte a récolté 2,5 millions FCFA en 2 semaines. On a pu s\'offrir le voyage à Dubaï qu\'on rêvait !',
        city: 'Abidjan',
      },
      {
        name: 'Adama & Binta',
        text: 'Même notre famille en France a pu contribuer facilement. C\'était vraiment pratique.',
        city: 'Dakar',
      },
      {
        name: 'Koffi & Aïcha',
        text: 'On a équipé notre appartement entier grâce aux contributions. Merci JOIE DE VIVRE !',
        city: 'Cotonou',
      },
    ],
    faqs: [
      {
        question: 'Comment fonctionne la cagnotte mariage ?',
        answer: 'Créez votre page de couple avec photos et histoire, définissez vos objectifs (voyage, maison...), puis partagez le lien dans vos faire-parts ou invitations.',
      },
      {
        question: 'Peut-on recevoir des contributions de l\'étranger ?',
        answer: 'Oui ! Vos proches à l\'étranger peuvent contribuer par carte bancaire ou virement. Vous recevez les fonds en Mobile Money.',
      },
      {
        question: 'Quand peut-on retirer les fonds ?',
        answer: 'Vous pouvez retirer les fonds à tout moment vers votre compte Mobile Money. Un délai de 24-48h est nécessaire pour le traitement.',
      },
      {
        question: 'Peut-on créer plusieurs objectifs ?',
        answer: 'Oui, vous pouvez définir plusieurs objectifs (voyage de noces, électroménager, etc.) et vos invités choisissent où contribuer.',
      },
    ],
    relatedOccasions: ['anniversaire', 'naissance', 'promotion'],
    stats: {
      fundsCreated: '850+',
      avgAmount: '450,000 FCFA',
      contributors: '45',
    },
  },

  naissance: {
    slug: 'naissance',
    occasion: 'Naissance & Baptême',
    emoji: '👶',
    heroTitle: 'Cagnotte Naissance - Accueillez Bébé avec des Cadeaux Utiles',
    heroSubtitle: 'Baby shower, naissance, baptême : recevez des contributions pour équiper bébé ou financer ses premiers besoins.',
    description: 'Créez une cagnotte pour la naissance ou le baptême de votre enfant. Famille et amis contribuent pour vous aider à accueillir bébé dans les meilleures conditions.',
    metaDescription: 'Cagnotte naissance et baptême gratuite. Baby shower Afrique. Collectez pour équiper bébé via Orange Money, MTN, Wave. Abidjan, Dakar, Cotonou.',
    keywords: [
      'cagnotte naissance',
      'baby shower Afrique',
      'cagnotte baptême',
      'cadeau naissance collectif',
      'pot commun bébé',
      'liste naissance Afrique',
      'équiper bébé ensemble',
      'cagnotte nouveau-né',
      'cadeau baptême Abidjan',
      'baby shower Dakar',
      'fête naissance Cotonou',
      'contribution bébé',
    ],
    benefits: [
      { icon: '👶', title: 'Équipement bébé', description: 'Recevez ce dont bébé a vraiment besoin : poussette, lit, vêtements...' },
      { icon: '💝', title: 'Baby shower moderne', description: 'Organisez une fête avec cagnotte intégrée.' },
      { icon: '📸', title: 'Annonce stylée', description: 'Partagez la nouvelle avec une belle page personnalisée.' },
      { icon: '🎁', title: 'Cadeaux groupés', description: 'Fini les petits cadeaux inutiles, place aux vrais besoins.' },
    ],
    giftIdeas: [
      { name: 'Poussette', link: '/shop?category=puericulture' },
      { name: 'Vêtements bébé', link: '/shop?category=mode-enfants' },
      { name: 'Lit bébé', link: '/shop?category=puericulture' },
      { name: 'Jouets d\'éveil', link: '/shop?category=jouets-enfants' },
    ],
    testimonials: [
      {
        name: 'Mariam S.',
        text: 'Ma baby shower a été un succès ! La cagnotte nous a permis d\'acheter la poussette de nos rêves.',
        city: 'Abidjan',
      },
      {
        name: 'Oumar & Fatou',
        text: 'Pour le baptême de notre fils, 25 personnes ont contribué. On a pu équiper toute la chambre.',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Quand créer ma cagnotte naissance ?',
        answer: 'Vous pouvez créer votre cagnotte dès l\'annonce de la grossesse ou après la naissance. Beaucoup de parents la créent pour leur baby shower.',
      },
      {
        question: 'Peut-on créer une liste de souhaits ?',
        answer: 'Oui ! Vous pouvez ajouter des produits de notre boutique à votre cagnotte ou simplement collecter des fonds libres.',
      },
      {
        question: 'Comment partager ma cagnotte ?',
        answer: 'Partagez le lien par WhatsApp, SMS ou dans vos faire-parts de naissance. Vous pouvez aussi générer un QR code.',
      },
    ],
    relatedOccasions: ['anniversaire', 'mariage', 'fete-meres'],
    stats: {
      fundsCreated: '1,200+',
      avgAmount: '125,000 FCFA',
      contributors: '18',
    },
  },

  diplome: {
    slug: 'diplome',
    occasion: 'Diplôme & Réussite',
    emoji: '🎓',
    heroTitle: 'Cagnotte Diplôme - Célébrez la Réussite Ensemble',
    heroSubtitle: 'Bac, licence, master, concours : félicitez le diplômé avec un cadeau collectif mémorable.',
    description: 'Créez une cagnotte pour célébrer une réussite scolaire ou professionnelle. Famille et amis contribuent pour offrir un cadeau à la hauteur de l\'accomplissement.',
    metaDescription: 'Cagnotte diplôme et réussite examen. Célébrez le baccalauréat, licence, master. Cadeau collectif via Orange Money. Abidjan, Dakar, Cotonou.',
    keywords: [
      'cagnotte diplôme',
      'cadeau réussite examen',
      'cagnotte baccalauréat',
      'félicitations diplômé',
      'pot commun réussite',
      'cadeau bac Afrique',
      'cagnotte licence master',
      'réussite concours cadeau',
      'célébrer diplôme ensemble',
      'cadeau étudiant groupe',
    ],
    benefits: [
      { icon: '🎓', title: 'Récompense méritée', description: 'Offrez un cadeau à la hauteur de l\'effort fourni.' },
      { icon: '💻', title: 'Équipement pro', description: 'Laptop, téléphone, ou matériel pour la suite.' },
      { icon: '✈️', title: 'Voyage de récompense', description: 'Financez un voyage pour célébrer cette victoire.' },
      { icon: '💼', title: 'Démarrage carrière', description: 'Aidez le diplômé à bien démarrer sa vie professionnelle.' },
    ],
    giftIdeas: [
      { name: 'Ordinateur portable', link: '/shop?category=tech-electronique' },
      { name: 'Smartphone', link: '/shop?category=tech-electronique' },
      { name: 'Tenue professionnelle', link: '/shop?category=mode-vetements' },
      { name: 'Montre de luxe', link: '/shop?category=bijoux-accessoires' },
    ],
    testimonials: [
      {
        name: 'Ibrahim T.',
        text: 'Pour mon bac, toute la famille a contribué. J\'ai reçu un MacBook pour commencer l\'université !',
        city: 'Abidjan',
      },
      {
        name: 'Aïssatou B.',
        text: 'Après ma soutenance de master, mes amis m\'ont offert un voyage à Marrakech via la cagnotte.',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Quand créer la cagnotte diplôme ?',
        answer: 'Créez-la avant l\'annonce des résultats pour être prêt à célébrer, ou juste après la réussite.',
      },
      {
        question: 'Qui peut contribuer ?',
        answer: 'Famille, amis, collègues, anciens profs... Tout le monde peut féliciter le diplômé avec une contribution.',
      },
    ],
    relatedOccasions: ['anniversaire', 'promotion', 'naissance'],
    stats: {
      fundsCreated: '800+',
      avgAmount: '95,000 FCFA',
      contributors: '15',
    },
  },

  promotion: {
    slug: 'promotion',
    occasion: 'Promotion & Départ',
    emoji: '🚀',
    heroTitle: 'Cagnotte Promotion - Félicitez un Collègue qui Évolue',
    heroSubtitle: 'Promotion, mutation, nouveau poste : organisez une collecte entre collègues pour marquer le coup.',
    description: 'Créez une cagnotte pour célébrer la promotion d\'un collègue ou organiser un pot de départ mémorable. Collectez facilement entre collègues.',
    metaDescription: 'Cagnotte promotion et pot de départ. Cadeau collègue collectif. Collecte entre collègues via Orange Money, MTN, Wave. Bureau Abidjan.',
    keywords: [
      'cagnotte promotion',
      'pot de départ',
      'cadeau collègue',
      'cagnotte mutation',
      'féliciter promotion',
      'cadeau bureau collectif',
      'départ entreprise cadeau',
      'collecte collègues',
      'cagnotte travail',
      'nouveau poste cadeau',
    ],
    benefits: [
      { icon: '🎯', title: 'Organisation facile', description: 'Un lien à partager, les collègues contribuent à leur rythme.' },
      { icon: '🤫', title: 'Discrétion', description: 'La collecte peut rester secrète jusqu\'à la remise du cadeau.' },
      { icon: '💼', title: 'Montant conséquent', description: 'À plusieurs, offrez un cadeau vraiment mémorable.' },
      { icon: '📊', title: 'Suivi transparent', description: 'Chaque organisateur voit qui a contribué.' },
    ],
    giftIdeas: [
      { name: 'Accessoires bureau luxe', link: '/shop?category=bureau-accessoires' },
      { name: 'Montre', link: '/shop?category=bijoux-accessoires' },
      { name: 'Expérience restaurant', link: '/shop?category=gastronomie-delices' },
      { name: 'Voyage week-end', link: '/shop?category=experiences-bien-etre' },
    ],
    testimonials: [
      {
        name: 'Équipe Marketing - Société X',
        text: 'On a organisé le pot de départ de notre directeur en 3 jours. 40 collègues ont contribué pour un voyage !',
        city: 'Abidjan',
      },
      {
        name: 'Service RH - Entreprise Y',
        text: 'Pour la promotion de Fatou, on a collecté 300,000 FCFA en une semaine. Elle était aux anges !',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Comment organiser une collecte entre collègues ?',
        answer: 'Créez la cagnotte, partagez le lien par email ou groupe WhatsApp du bureau. Chacun contribue selon ses moyens.',
      },
      {
        question: 'Le bénéficiaire voit-il les montants individuels ?',
        answer: 'Non, par défaut seul l\'organisateur voit le détail. Le bénéficiaire voit juste le montant total et les contributeurs.',
      },
    ],
    relatedOccasions: ['anniversaire', 'retraite', 'diplome'],
    stats: {
      fundsCreated: '650+',
      avgAmount: '150,000 FCFA',
      contributors: '22',
    },
  },

  retraite: {
    slug: 'retraite',
    occasion: 'Retraite',
    emoji: '🌅',
    heroTitle: 'Cagnotte Retraite - Célébrez une Carrière Accomplie',
    heroSubtitle: 'Honorez un départ à la retraite avec un cadeau collectif à la mesure d\'une vie de travail.',
    description: 'Créez une cagnotte pour le départ à la retraite d\'un collègue, ami ou proche. Rassemblez les contributions pour offrir un cadeau inoubliable.',
    metaDescription: 'Cagnotte retraite - Pot de départ retraite. Cadeau collectif fin de carrière. Collecte via Orange Money. Abidjan, Dakar, Cotonou.',
    keywords: [
      'cagnotte retraite',
      'pot de départ retraite',
      'cadeau départ retraite',
      'hommage carrière',
      'cadeau fin carrière',
      'retraite cadeau collectif',
      'célébrer retraite',
      'départ retraite Afrique',
    ],
    benefits: [
      { icon: '🏆', title: 'Hommage mérité', description: 'Offrez un cadeau digne de toute une carrière.' },
      { icon: '👥', title: 'Collecte large', description: 'Anciens et actuels collègues peuvent tous participer.' },
      { icon: '🎁', title: 'Cadeau premium', description: 'À plusieurs, offrez ce qui était inaccessible individuellement.' },
      { icon: '💝', title: 'Messages personnels', description: 'Chaque contributeur peut ajouter un mot.' },
    ],
    giftIdeas: [
      { name: 'Voyage de rêve', link: '/shop?category=experiences-bien-etre' },
      { name: 'Montre de prestige', link: '/shop?category=bijoux-accessoires' },
      { name: 'Équipement loisirs', link: '/shop?category=sport-loisirs' },
      { name: 'Panier gastronomique luxe', link: '/shop?category=gastronomie-delices' },
    ],
    testimonials: [
      {
        name: 'Collègues Banque Z',
        text: 'Pour M. Diallo qui partait après 35 ans, on a collecté 1,5 million. Il a fait le pèlerinage à La Mecque !',
        city: 'Abidjan',
      },
    ],
    faqs: [
      {
        question: 'Comment contacter d\'anciens collègues pour contribuer ?',
        answer: 'Utilisez LinkedIn, les groupes WhatsApp d\'anciens, ou demandez aux RH de relayer l\'information.',
      },
      {
        question: 'Peut-on ajouter un livre d\'or numérique ?',
        answer: 'Oui ! Chaque contributeur peut laisser un message qui sera compilé avec le cadeau.',
      },
    ],
    relatedOccasions: ['promotion', 'anniversaire'],
    stats: {
      fundsCreated: '320+',
      avgAmount: '280,000 FCFA',
      contributors: '35',
    },
  },

  'fete-meres': {
    slug: 'fete-meres',
    occasion: 'Fête des Mères',
    emoji: '💐',
    heroTitle: 'Cagnotte Fête des Mères - Offrez à Maman un Cadeau à la Hauteur',
    heroSubtitle: 'Réunissez frères, sœurs et famille pour offrir à maman LE cadeau qu\'elle mérite vraiment.',
    description: 'Pour la Fête des Mères, créez une cagnotte familiale. Frères, sœurs, enfants : contribuez ensemble pour gâter maman comme jamais.',
    metaDescription: 'Cagnotte Fête des Mères - Cadeau maman collectif. Offrez ensemble via Orange Money, MTN, Wave. Abidjan, Dakar, Cotonou.',
    keywords: [
      'cadeau Fête des Mères',
      'cagnotte maman',
      'surprise maman Afrique',
      'fête des mères Abidjan',
      'cadeau maman collectif',
      'offrir à maman ensemble',
      'cagnotte fête mères',
      'cadeau maman groupe',
      'fête mères Dakar',
      'fête mères Cotonou',
    ],
    benefits: [
      { icon: '💝', title: 'Cadeau de rêve', description: 'À plusieurs enfants, offrez ce que maman n\'oserait jamais demander.' },
      { icon: '👨‍👩‍👧‍👦', title: 'Fratrie unie', description: 'Organisez facilement entre frères et sœurs, même à distance.' },
      { icon: '🎁', title: 'Surprise parfaite', description: 'Gardez le secret jusqu\'au jour J.' },
      { icon: '💐', title: 'Livraison', description: 'Faites livrer directement chez maman.' },
    ],
    giftIdeas: [
      { name: 'Bijoux', link: '/shop?category=bijoux-accessoires' },
      { name: 'Journée spa', link: '/shop?category=experiences-bien-etre' },
      { name: 'Bouquet luxe', link: '/shop?category=fleurs-plantes' },
      { name: 'Parfum de marque', link: '/shop?category=parfums-beaute' },
      { name: 'Voyage', link: '/shop?category=experiences-bien-etre' },
    ],
    testimonials: [
      {
        name: 'Les enfants Touré',
        text: 'On est 5 enfants dispersés. Grâce à JDV, on a offert à maman un voyage chez sa sœur en France !',
        city: 'Abidjan',
      },
      {
        name: 'Famille Diop',
        text: 'Maman voulait un collier en or depuis 10 ans. Cette année, on s\'est tous cotisés !',
        city: 'Dakar',
      },
    ],
    faqs: [
      {
        question: 'Comment organiser entre frères et sœurs ?',
        answer: 'Un membre de la famille crée la cagnotte et partage le lien. Chacun contribue selon ses moyens, même depuis l\'étranger.',
      },
      {
        question: 'Quand créer la cagnotte ?',
        answer: 'Idéalement 2-3 semaines avant la Fête des Mères pour avoir le temps de collecter et choisir le cadeau.',
      },
    ],
    relatedOccasions: ['fete-peres', 'anniversaire', 'naissance'],
    stats: {
      fundsCreated: '450+',
      avgAmount: '85,000 FCFA',
      contributors: '5',
    },
  },

  'fete-peres': {
    slug: 'fete-peres',
    occasion: 'Fête des Pères',
    emoji: '👔',
    heroTitle: 'Cagnotte Fête des Pères - Gâtez Papa Comme Il le Mérite',
    heroSubtitle: 'Réunissez la famille pour offrir à papa un cadeau exceptionnel qu\'il n\'oubliera jamais.',
    description: 'Pour la Fête des Pères, créez une cagnotte familiale. Enfants et petits-enfants : contribuez ensemble pour gâter papa.',
    metaDescription: 'Cagnotte Fête des Pères - Cadeau papa collectif. Offrez ensemble via Orange Money, MTN, Wave. Abidjan, Dakar, Cotonou.',
    keywords: [
      'cadeau Fête des Pères',
      'cagnotte papa',
      'surprise papa Afrique',
      'fête des pères Abidjan',
      'cadeau papa collectif',
      'offrir à papa ensemble',
      'cagnotte fête pères',
      'cadeau papa groupe',
    ],
    benefits: [
      { icon: '👔', title: 'Cadeau premium', description: 'Montre, costume, voyage... offrez ce qui fait rêver papa.' },
      { icon: '👨‍👩‍👧‍👦', title: 'Toute la famille', description: 'Même les petits-enfants peuvent participer symboliquement.' },
      { icon: '🎁', title: 'Surprise', description: 'Papa ne verra rien venir.' },
      { icon: '🏆', title: 'À sa mesure', description: 'Un cadeau digne du pilier de la famille.' },
    ],
    giftIdeas: [
      { name: 'Montre', link: '/shop?category=bijoux-accessoires' },
      { name: 'Costume sur mesure', link: '/shop?category=mode-vetements' },
      { name: 'Week-end golf', link: '/shop?category=experiences-bien-etre' },
      { name: 'Gadgets tech', link: '/shop?category=tech-electronique' },
    ],
    testimonials: [
      {
        name: 'Famille Koné',
        text: 'Papa rêvait d\'une montre Seiko. Ses 4 enfants + 8 petits-enfants ont cotisé. Son sourire valait tout !',
        city: 'Abidjan',
      },
    ],
    faqs: [
      {
        question: 'Comment impliquer les petits-enfants ?',
        answer: 'Les parents peuvent contribuer au nom de leurs enfants. Chaque contribution apparaît avec le nom choisi.',
      },
    ],
    relatedOccasions: ['fete-meres', 'anniversaire', 'retraite'],
    stats: {
      fundsCreated: '380+',
      avgAmount: '95,000 FCFA',
      contributors: '6',
    },
  },
};

export function getOccasionData(slug: string): OccasionPageData | undefined {
  return OCCASION_PAGES[slug];
}

export function getAllOccasionSlugs(): string[] {
  return Object.keys(OCCASION_PAGES);
}
