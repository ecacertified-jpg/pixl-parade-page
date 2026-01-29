/**
 * Stratégie de contenu réseaux sociaux - JOIE DE VIVRE
 * Base centralisée de hashtags, templates et calendrier marketing
 */

// ============================================
// HASHTAGS PAR CATÉGORIE
// ============================================

export const HASHTAGS = {
  // Hashtags de marque (toujours inclus)
  brand: ['#JoieDeVivre', '#JDVAfrica', '#CadeauxCollaboratifs'],
  
  // Par plateforme
  instagram: ['#CadeauxAbidjan', '#ArtisanatAfricain', '#MadeInAfrica', '#InstaGift', '#AfricaGram'],
  twitter: ['#GiftPooling', '#AfricaGifts', '#CadeauxAfrique'],
  facebook: ['#CadeauxGroupe', '#FêteAfrique', '#CagnotteEnLigne'],
  tiktok: ['#AfricanGifts', '#CadeauTikTok', '#GiftTok', '#FYP', '#PourToi'],
  linkedin: ['#FintechAfrica', '#Ecommerce', '#StartupCI', '#EcommerceAfrique'],
  whatsapp: [], // WhatsApp n'utilise pas de hashtags
  
  // Par occasion
  birthday: ['#AnniversaireAfrique', '#CagnotteAnniversaire', '#SurpriseParty', '#HappyBirthday'],
  wedding: ['#MariageAfricain', '#CagnotteMariage', '#ListeDeMariage', '#WeddingCI'],
  baby: ['#BabyShowerAfrique', '#CagnotteNaissance', '#NouveauNé', '#BébéAfrique'],
  graduation: ['#Diplomé', '#RéussiteExamen', '#FiertéAfricaine', '#Baccalauréat'],
  promotion: ['#Promotion', '#RéussitePro', '#PotDeDépart', '#NouvelEmploi'],
  tabaski: ['#Tabaski', '#AidElKebir', '#FêteDesProches', '#EidMubarak'],
  korite: ['#Korité', '#EidAlFitr', '#Ramadan', '#FêteReligieuse'],
  christmas: ['#Noël', '#Christmas', '#CadeauxNoël', '#JoyeusesFêtes'],
  newYear: ['#NouvelAn', '#NewYear', '#BonneAnnée', '#Réveillon'],
  valentine: ['#SaintValentin', '#Love', '#Valentine', '#Amour'],
  mothersDay: ['#FêteDesMères', '#MamanJeTaime', '#MothersDay', '#Maman'],
  fathersDay: ['#FêteDesPères', '#Papa', '#FathersDay', '#MeilleurPapa'],
  womenDay: ['#8Mars', '#JournéeFemme', '#WomenPower', '#Féminisme'],
  
  // Par ville
  abidjan: ['#Abidjan', '#CIV', '#TeamCI', '#Babi', '#CIV225', '#CoteDIvoire'],
  cotonou: ['#Cotonou', '#Benin', '#Benin229', '#BeninTourism'],
  dakar: ['#Dakar', '#Senegal', '#Teranga', '#Kebetu', '#TeamSenegal'],
  bouake: ['#Bouaké', '#Baoulé', '#Gbêkê', '#CentreCI'],
  yamoussoukro: ['#Yamoussoukro', '#Capitale', '#BasiliqueCI'],
  portoNovo: ['#PortoNovo', '#CapitaleBenin'],
  
  // Par catégorie produit
  mode: ['#ModeAfricaine', '#WaxPrint', '#AfricanFashion', '#Bazin', '#Boubou'],
  bijoux: ['#BijouxAfricains', '#Handmade', '#AfricanJewelry', '#OrArtisanal', '#Perles'],
  gastronomie: ['#FoodAbidjan', '#GâteauPersonnalisé', '#TraiteurCI', '#PâtisserieAbidjan'],
  fleurs: ['#FleuristeAbidjan', '#Bouquet', '#Fleurs', '#CompositionsFlorale'],
  beaute: ['#BeautéAfricaine', '#Cosmétiques', '#SoinNaturel', '#BeautyAfrica'],
  maison: ['#DécoAfricaine', '#Artisanat', '#HomeDecor', '#AfricanArt'],
  experiences: ['#ExpérienceCadeau', '#Spa', '#Restaurant', '#ActivitésAbidjan'],
  
  // Paiement (différenciateurs)
  payment: ['#OrangeMoney', '#MTNMoney', '#Wave', '#MobileMoney', '#SansCarteBancaire'],
} as const;

export type HashtagCategory = keyof typeof HASHTAGS;

// ============================================
// EMOJIS PAR OCCASION
// ============================================

export const OCCASION_EMOJIS: Record<string, string> = {
  birthday: '🎂',
  anniversaire: '🎂',
  wedding: '💒',
  mariage: '💒',
  baby: '👶',
  naissance: '👶',
  graduation: '🎓',
  diplome: '🎓',
  promotion: '🎉',
  tabaski: '🐑',
  korite: '🌙',
  christmas: '🎄',
  noel: '🎄',
  newYear: '🎆',
  valentine: '❤️',
  mothersDay: '💐',
  fathersDay: '👔',
  retirement: '🏖️',
  retraite: '🏖️',
  other: '🎁',
};

// ============================================
// TEMPLATES DE POSTS
// ============================================

export interface PostTemplate {
  id: string;
  label: string;
  emoji: string;
  text: string;
  hashtags?: HashtagCategory[];
  platforms?: ('whatsapp' | 'facebook' | 'instagram' | 'twitter' | 'sms' | 'email')[];
}

export const PRODUCT_TEMPLATES: PostTemplate[] = [
  {
    id: 'nouveau',
    label: 'Nouveau',
    emoji: '🆕',
    text: '🆕 Nouveau produit disponible !\n\n{product_name}\n💰 {price} {currency}\n\n📍 Livraison {city}\n💳 Paiement Mobile Money\n\n👉 {url}',
    hashtags: ['brand', 'payment'],
  },
  {
    id: 'promotion',
    label: 'Offre spéciale',
    emoji: '🔥',
    text: '🔥 Offre spéciale !\n\n{product_name}\n💰 {price} {currency}\n\n⏰ Offre limitée\n📍 {city}\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'bestseller',
    label: 'Best-seller',
    emoji: '⭐',
    text: '⭐ Notre best-seller !\n\n{product_name}\n💰 {price} {currency}\n\n❤️ Adoré par nos clients\n📍 {city}\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'cadeau',
    label: 'Idée cadeau',
    emoji: '🎁',
    text: '🎁 Idée cadeau parfaite !\n\n{product_name}\n💰 {price} {currency}\n\n✨ Faites plaisir à vos proches\n📍 Livraison {city}\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'anniversaire',
    label: 'Anniversaire',
    emoji: '🎂',
    text: '🎂 Parfait pour un anniversaire !\n\n{product_name}\n💰 {price} {currency}\n\n🎉 Offrez un moment de joie\n📍 {city}\n\n👉 {url}',
    hashtags: ['brand', 'birthday'],
  },
  {
    id: 'stock_limite',
    label: 'Stock limité',
    emoji: '⚡',
    text: '⚡ Stock limité, profitez-en !\n\n{product_name}\n💰 {price} {currency}\n\n🏃 Ne tardez pas !\n📍 {city}\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'artisan',
    label: 'Artisan local',
    emoji: '🎨',
    text: '🎨 Création artisanale locale\n\n{product_name}\n💰 {price} {currency}\n\n🤝 Soutenez nos artisans\n📍 Fabriqué en {city}\n\n👉 {url}',
    hashtags: ['brand'],
  },
];

export const FUND_TEMPLATES: PostTemplate[] = [
  {
    id: 'creation',
    label: 'Nouvelle cagnotte',
    emoji: '🎁',
    text: '🎁 J\'organise une cagnotte pour {beneficiary} !\n\n{occasion_emoji} {occasion}\n🎯 Objectif : {target} {currency}\n\n💝 Chaque contribution compte !\n\n👉 Participez ici : {url}',
    hashtags: ['brand'],
  },
  {
    id: 'milestone_50',
    label: '50% atteint',
    emoji: '🎉',
    text: '🎉 Déjà 50% de notre objectif atteint !\n\n🎁 Cagnotte pour {beneficiary}\n💰 {current}/{target} {currency}\n\n🙏 Merci à tous les contributeurs !\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'milestone_75',
    label: '75% atteint',
    emoji: '🚀',
    text: '🚀 Plus que 25% pour atteindre l\'objectif !\n\n🎁 Cagnotte pour {beneficiary}\n💰 {current}/{target} {currency}\n\n💪 On y est presque !\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'last_chance',
    label: 'Derniers jours',
    emoji: '⏰',
    text: '⏰ Derniers jours pour contribuer !\n\n🎁 Cagnotte pour {beneficiary}\n📅 Fin : {deadline}\n💰 Il manque {remaining} {currency}\n\n👉 {url}',
    hashtags: ['brand'],
  },
  {
    id: 'thank_you',
    label: 'Remerciement',
    emoji: '🙏',
    text: '🙏 Objectif atteint ! Merci à tous !\n\n🎁 Cagnotte pour {beneficiary}\n💰 {current} {currency} collectés\n\n❤️ Grâce à vous, {beneficiary} va être comblé(e) !\n\n#Merci #JoieDeVivre',
    hashtags: ['brand'],
  },
];

export const OCCASION_TEMPLATES: Record<string, PostTemplate> = {
  birthday: {
    id: 'birthday',
    label: 'Anniversaire',
    emoji: '🎂',
    text: '🎂 L\'anniversaire de {name} approche !\n\nCréons ensemble une belle surprise 🎁\n\n💝 Chaque contribution compte\n📅 Le {date}\n\n👉 {url}',
    hashtags: ['brand', 'birthday'],
  },
  wedding: {
    id: 'wedding',
    label: 'Mariage',
    emoji: '💒',
    text: '💒 {names} se marient !\n\nContribuez à leur liste de mariage ✨\n\n🎁 Offrons-leur un cadeau inoubliable\n📅 {date}\n\n👉 {url}',
    hashtags: ['brand', 'wedding'],
  },
  baby: {
    id: 'baby',
    label: 'Naissance',
    emoji: '👶',
    text: '👶 Un bébé arrive !\n\nParticipez à la cagnotte pour {name} 🍼\n\n💝 Accueillons ce petit ange ensemble\n\n👉 {url}',
    hashtags: ['brand', 'baby'],
  },
  graduation: {
    id: 'graduation',
    label: 'Diplôme',
    emoji: '🎓',
    text: '🎓 {name} est diplômé(e) !\n\nFélicitons cette réussite ensemble 🎉\n\n💝 Contribuez au cadeau\n\n👉 {url}',
    hashtags: ['brand', 'graduation'],
  },
  promotion: {
    id: 'promotion',
    label: 'Promotion',
    emoji: '🎉',
    text: '🎉 {name} a été promu(e) !\n\nCélébrons cette réussite professionnelle 💼\n\n💝 Participez au cadeau collectif\n\n👉 {url}',
    hashtags: ['brand', 'promotion'],
  },
  tabaski: {
    id: 'tabaski',
    label: 'Tabaski',
    emoji: '🐑',
    text: '🐑 Bonne fête de Tabaski !\n\nOffrez un cadeau à vos proches 🎁\n\n💝 Célébrons ensemble\n\n👉 {url}',
    hashtags: ['brand', 'tabaski'],
  },
  mothersDay: {
    id: 'mothersDay',
    label: 'Fête des Mères',
    emoji: '💐',
    text: '💐 Bonne fête Maman !\n\nOffrons-lui un cadeau inoubliable ensemble 💝\n\n🎁 Chaque contribution compte\n\n👉 {url}',
    hashtags: ['brand', 'mothersDay'],
  },
  fathersDay: {
    id: 'fathersDay',
    label: 'Fête des Pères',
    emoji: '👔',
    text: '👔 Bonne fête Papa !\n\nOffrons-lui un cadeau mémorable ensemble 💙\n\n🎁 Participez à la cagnotte\n\n👉 {url}',
    hashtags: ['brand', 'fathersDay'],
  },
};

// ============================================
// CALENDRIER MARKETING
// ============================================

export interface MarketingEvent {
  day: number | null; // null = date variable
  event: string;
  template: string;
  hashtags: HashtagCategory[];
  description?: string;
}

export const MARKETING_CALENDAR: Record<string, MarketingEvent[]> = {
  january: [
    { day: 1, event: 'Nouvel An', template: 'celebration', hashtags: ['brand', 'newYear'] },
  ],
  february: [
    { day: 14, event: 'Saint-Valentin', template: 'love', hashtags: ['brand', 'valentine'] },
  ],
  march: [
    { day: 8, event: 'Journée de la Femme', template: 'women', hashtags: ['brand', 'womenDay'] },
  ],
  april: [
    { day: null, event: 'Pâques', template: 'celebration', hashtags: ['brand'] },
  ],
  may: [
    { day: null, event: 'Fête des Mères', template: 'mothersDay', hashtags: ['brand', 'mothersDay'], description: 'Dernier dimanche de mai' },
  ],
  june: [
    { day: null, event: 'Fête des Pères', template: 'fathersDay', hashtags: ['brand', 'fathersDay'], description: 'Troisième dimanche de juin' },
    { day: null, event: 'Korité/Eid al-Fitr', template: 'religious', hashtags: ['brand', 'korite'], description: 'Date variable selon calendrier lunaire' },
  ],
  august: [
    { day: 7, event: 'Fête de l\'Indépendance CI', template: 'celebration', hashtags: ['brand', 'abidjan'] },
  ],
  september: [
    { day: null, event: 'Rentrée Scolaire', template: 'backToSchool', hashtags: ['brand'] },
  ],
  october: [
    { day: null, event: 'Tabaski/Eid al-Adha', template: 'tabaski', hashtags: ['brand', 'tabaski'], description: 'Date variable selon calendrier lunaire' },
  ],
  december: [
    { day: 25, event: 'Noël', template: 'christmas', hashtags: ['brand', 'christmas'] },
    { day: 31, event: 'Réveillon', template: 'newYear', hashtags: ['brand', 'newYear'] },
  ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Génère une chaîne de hashtags à partir des catégories
 */
export function buildHashtags(
  categories: HashtagCategory[],
  options?: {
    limit?: number;
    platform?: 'instagram' | 'twitter' | 'facebook' | 'whatsapp';
    includeCity?: string;
    includeCategory?: string;
  }
): string {
  const { limit = 10, platform, includeCity, includeCategory } = options || {};
  
  // WhatsApp n'utilise pas de hashtags
  if (platform === 'whatsapp') return '';
  
  const allHashtags: string[] = [];
  
  // Ajouter les hashtags de marque en premier
  if (categories.includes('brand')) {
    allHashtags.push(...HASHTAGS.brand);
  }
  
  // Ajouter les autres catégories
  categories.forEach(cat => {
    if (cat !== 'brand' && HASHTAGS[cat]) {
      allHashtags.push(...HASHTAGS[cat]);
    }
  });
  
  // Ajouter la ville si spécifiée
  if (includeCity) {
    const cityKey = includeCity.toLowerCase().replace(/[éè]/g, 'e').replace(/\s+/g, '') as HashtagCategory;
    if (HASHTAGS[cityKey]) {
      allHashtags.push(...HASHTAGS[cityKey].slice(0, 2));
    }
  }
  
  // Ajouter la catégorie produit si spécifiée
  if (includeCategory) {
    const catKey = includeCategory.toLowerCase() as HashtagCategory;
    if (HASHTAGS[catKey]) {
      allHashtags.push(...HASHTAGS[catKey].slice(0, 2));
    }
  }
  
  // Twitter a une limite plus stricte
  const effectiveLimit = platform === 'twitter' ? Math.min(limit, 5) : limit;
  
  // Dédupliquer et limiter
  const uniqueHashtags = [...new Set(allHashtags)];
  return uniqueHashtags.slice(0, effectiveLimit).join(' ');
}

/**
 * Génère un post complet à partir d'un template
 */
export function generatePost(
  template: PostTemplate,
  variables: Record<string, string>,
  options?: {
    platform?: 'instagram' | 'facebook' | 'twitter' | 'whatsapp' | 'sms' | 'email';
    includeHashtags?: boolean;
    city?: string;
    productCategory?: string;
  }
): string {
  const { platform = 'instagram', includeHashtags = true, city, productCategory } = options || {};
  
  // Remplacer les variables dans le texte
  let text = template.text;
  Object.entries(variables).forEach(([key, value]) => {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  
  // Ajouter les hashtags si demandé
  if (includeHashtags && template.hashtags && platform !== 'whatsapp' && platform !== 'sms' && platform !== 'email') {
    const hashtags = buildHashtags(template.hashtags, { 
      platform: platform as 'instagram' | 'twitter' | 'facebook',
      includeCity: city,
      includeCategory: productCategory,
    });
    if (hashtags) {
      text += '\n\n' + hashtags;
    }
  }
  
  // Adapter selon la plateforme
  return adaptForPlatform(text, platform);
}

/**
 * Adapte un post pour une plateforme spécifique
 */
export function adaptForPlatform(
  text: string,
  platform: string
): string {
  switch (platform) {
    case 'twitter':
      // Twitter: limite à 280 caractères
      if (text.length > 280) {
        return text.substring(0, 277) + '...';
      }
      return text;
      
    case 'whatsapp':
    case 'sms':
      // Supprimer les hashtags pour WhatsApp et SMS
      return text.replace(/#\w+/g, '').replace(/\n{3,}/g, '\n\n').trim();
      
    case 'email':
      // Email: format plus formel, supprimer hashtags
      return text.replace(/#\w+/g, '').replace(/\n{3,}/g, '\n\n').trim();
      
    default:
      return text;
  }
}

/**
 * Récupère l'emoji pour une occasion
 */
export function getOccasionEmoji(occasion: string): string {
  const normalized = occasion.toLowerCase().replace(/[éè]/g, 'e').replace(/\s+/g, '');
  return OCCASION_EMOJIS[normalized] || OCCASION_EMOJIS['other'];
}

/**
 * Récupère les événements marketing du mois
 */
export function getMonthlyEvents(month: number): MarketingEvent[] {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const monthKey = months[month - 1];
  return MARKETING_CALENDAR[monthKey] || [];
}

/**
 * Récupère les prochains événements marketing
 */
export function getUpcomingEvents(daysAhead: number = 30): MarketingEvent[] {
  const today = new Date();
  const events: (MarketingEvent & { date?: Date })[] = [];
  
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  
  // Vérifier les 2 prochains mois
  for (let i = 0; i < 2; i++) {
    const checkDate = new Date(today);
    checkDate.setMonth(today.getMonth() + i);
    const monthKey = months[checkDate.getMonth()];
    
    const monthEvents = MARKETING_CALENDAR[monthKey] || [];
    monthEvents.forEach(event => {
      if (event.day) {
        const eventDate = new Date(checkDate.getFullYear(), checkDate.getMonth(), event.day);
        const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0 && daysUntil <= daysAhead) {
          events.push({ ...event, date: eventDate });
        }
      }
    });
  }
  
  return events;
}
