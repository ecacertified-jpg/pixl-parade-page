import { type OrganizationSchemaProps, type WebSiteSchemaProps } from '@/components/schema/types';

const DOMAIN = 'https://joiedevivre-africa.com';

export const organizationData: OrganizationSchemaProps = {
  name: 'JOIE DE VIVRE',
  url: DOMAIN,
  logo: `${DOMAIN}/logo-jv.png`,
  description: "Plateforme #1 de cadeaux collaboratifs en Afrique francophone. Créez des cagnottes pour anniversaires, mariages et promotions avec vos proches.",
  socialLinks: [
    'https://www.facebook.com/joiedevivre.africa',
    'https://www.instagram.com/joiedevivre_africa',
    'https://wa.me/22505465666',
  ],
  contactEmail: 'contact@joiedevivre-africa.com',
  contactPhone: '+225 05 465 666 46',
};

export const websiteData: WebSiteSchemaProps = {
  name: 'JOIE DE VIVRE - Cadeaux Collectifs Afrique',
  url: DOMAIN,
  description: "Plateforme collaborative de cadeaux en Afrique francophone. Cagnottes anniversaires, boutiques artisanales, paiements Mobile Money.",
  searchUrl: `${DOMAIN}/shop`,
};
