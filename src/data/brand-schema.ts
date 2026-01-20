import { type OrganizationSchemaProps, type WebSiteSchemaProps } from '@/components/schema/types';

const DOMAIN = 'https://joiedevivre-africa.com';

export const organizationData: OrganizationSchemaProps = {
  name: 'JOIE DE VIVRE',
  url: DOMAIN,
  logo: `${DOMAIN}/logo-jv.png`,
  description: "Plateforme #1 de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages et promotions avec vos proches.",
  socialLinks: [
    'https://web.facebook.com/profile.php?id=61579100215241',
    'https://www.tiktok.com/@joiedevivre_46',
    'https://wa.me/22546566646',
  ],
  contactEmail: 'contact@joiedevivre-africa.com',
  contactPhone: '+225 46 566 646',
};

export const websiteData: WebSiteSchemaProps = {
  name: 'JOIE DE VIVRE - Cadeaux Collectifs Afrique',
  url: DOMAIN,
  description: "Plateforme collaborative de cadeaux en Afrique francophone. Cagnottes anniversaires, boutiques artisanales, paiements Mobile Money.",
  searchUrl: `${DOMAIN}/shop`,
};
