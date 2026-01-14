// Configuration multi-pays pour JOIE DE VIVRE

export interface LegalEntity {
  companyName: string;
  legalForm: string;
  registrationNumber: string;
  registrationAuthority: string;
  address: string;
  email: string;
  phone: string;
  director: string;
  ecommerceLaw: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  capital: string;
  economicCapital: string;
  mapCenter: [number, number];
  mapBounds: [[number, number], [number, number]];
  legalEntity: LegalEntity;
  mobileMoneyProviders: string[];
  dateFormat: string;
  language: string;
}

export const COUNTRIES: Record<string, CountryConfig> = {
  CI: {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    currency: "XOF",
    currencySymbol: "FCFA",
    phonePrefix: "+225",
    capital: "Yamoussoukro",
    economicCapital: "Abidjan",
    mapCenter: [-5.5471, 7.5400],
    mapBounds: [[-8.6, 4.3], [-2.5, 10.7]],
    legalEntity: {
      companyName: "AMTEY'S",
      legalForm: "SARL",
      registrationNumber: "CI-ABJ-2024-B-XXXXX",
      registrationAuthority: "RCCM Abidjan",
      address: "Abidjan, Côte d'Ivoire",
      email: "contact@joiedevivre.ci",
      phone: "+225 07 XX XX XX XX",
      director: "Directeur de Publication AMTEY'S",
      ecommerceLaw: "Loi n° 2013-546 du 30 juillet 2013 relative aux transactions électroniques et Loi n° 2016-412 du 15 juin 2016 relative à la consommation"
    },
    mobileMoneyProviders: ["Orange Money", "MTN Mobile Money", "Moov Money", "Wave"],
    dateFormat: "DD/MM/YYYY",
    language: "fr"
  },
  BJ: {
    code: "BJ",
    name: "Bénin",
    flag: "🇧🇯",
    currency: "XOF",
    currencySymbol: "FCFA",
    phonePrefix: "+229",
    capital: "Porto-Novo",
    economicCapital: "Cotonou",
    mapCenter: [2.3158, 9.3077],
    mapBounds: [[0.7, 6.0], [3.9, 12.5]],
    legalEntity: {
      companyName: "JOIE DE VIVRE Bénin",
      legalForm: "SARL",
      registrationNumber: "BJ-COT-2024-XXXXX",
      registrationAuthority: "RCCM Cotonou",
      address: "Cotonou, Bénin",
      email: "contact@joiedevivre.bj",
      phone: "+229 XX XX XX XX",
      director: "Directeur de Publication JOIE DE VIVRE Bénin",
      ecommerceLaw: "Loi n° 2017-20 du 20 avril 2018 portant Code du numérique en République du Bénin"
    },
    mobileMoneyProviders: ["MTN Mobile Money", "Moov Money", "Celtiis Cash"],
    dateFormat: "DD/MM/YYYY",
    language: "fr"
  },
  SN: {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    currency: "XOF",
    currencySymbol: "FCFA",
    phonePrefix: "+221",
    capital: "Dakar",
    economicCapital: "Dakar",
    mapCenter: [-17.4677, 14.7167],
    mapBounds: [[-17.5, 12.3], [-11.4, 16.7]],
    legalEntity: {
      companyName: "JOIE DE VIVRE Sénégal",
      legalForm: "SARL",
      registrationNumber: "SN-DKR-2024-XXXXX",
      registrationAuthority: "RCCM Dakar",
      address: "Dakar, Sénégal",
      email: "contact@joiedevivre.sn",
      phone: "+221 XX XXX XX XX",
      director: "Directeur de Publication JOIE DE VIVRE Sénégal",
      ecommerceLaw: "Loi n° 2008-08 du 25 janvier 2008 sur les transactions électroniques et Loi n° 2017-27 du 28 juin 2017 relative à la protection des données personnelles"
    },
    mobileMoneyProviders: ["Orange Money", "Wave", "Free Money", "Wari", "Joni Joni"],
    dateFormat: "DD/MM/YYYY",
    language: "fr"
  }
};

export const DEFAULT_COUNTRY_CODE = "CI";

export function getCountryConfig(code: string): CountryConfig {
  return COUNTRIES[code] || COUNTRIES[DEFAULT_COUNTRY_CODE];
}

export function getAllCountries(): CountryConfig[] {
  return Object.values(COUNTRIES);
}

export function isValidCountryCode(code: string): boolean {
  return code in COUNTRIES;
}
