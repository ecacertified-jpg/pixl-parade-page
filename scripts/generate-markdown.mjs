#!/usr/bin/env node

/**
 * Script de génération automatique des fichiers Markdown
 * pour l'optimisation LLM (ChatGPT, Claude, Perplexity)
 * 
 * Usage: node scripts/generate-markdown.mjs
 * Automatiquement exécuté avant le build via npm script (prebuild)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'public', 'content');
const DATA_FILE = path.join(__dirname, 'content-data.json');

// Load content data
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Get current date formatted in French
 */
function getFormattedDate() {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

/**
 * Generate FAQ markdown content
 */
function generateFAQMarkdown() {
  const { app, company, faq } = data;
  const lastUpdated = getFormattedDate();
  
  let md = `# ${app.name} - Foire Aux Questions (FAQ)\n\n`;
  md += `> Trouvez rapidement les réponses à vos questions les plus fréquentes.\n\n`;
  md += `---\n\n`;
  
  for (const category of faq) {
    md += `## ${category.title}\n\n`;
    
    for (const item of category.items) {
      md += `### ${item.question}\n`;
      md += `${item.answer}\n\n`;
    }
  }
  
  // Legal info section
  md += `---\n\n`;
  md += `## Informations Légales\n\n`;
  md += `- [Politique de Confidentialité](${company.website}/privacy-policy)\n`;
  md += `- [Conditions d'Utilisation](${company.website}/terms-of-service)\n`;
  md += `- [Mentions Légales](${company.website}/legal-notice)\n\n`;
  
  // Footer
  md += `---\n\n`;
  md += `*Dernière mise à jour : ${lastUpdated}*\n\n`;
  md += `*Vous n'avez pas trouvé la réponse à votre question ? Contactez-nous à ${company.email}*\n`;
  
  return md;
}

/**
 * Generate About page markdown content
 */
function generateAboutMarkdown() {
  const { app, company, features, giftTypes, occasions, paymentMethods, deliveryZones } = data;
  const lastUpdated = getFormattedDate();
  
  let md = `# ${app.name} - À Propos\n\n`;
  md += `> ${app.tagline}\n\n`;
  
  // Mission
  md += `## Notre Mission\n\n`;
  md += `${app.description} Que ce soit pour un anniversaire, un mariage, une promotion ou toute autre célébration, ${app.name} facilite l'organisation de cadeaux collectifs et renforce les liens entre les personnes qui s'aiment.\n\n`;
  
  // Features
  md += `## Fonctionnalités Principales\n\n`;
  for (const feature of features) {
    const emoji = getFeatureEmoji(feature.iconName);
    md += `### ${emoji} ${feature.title}\n`;
    md += `${feature.description}\n\n`;
  }
  
  // Gift types
  md += `## Types de Cadeaux Disponibles\n\n`;
  for (const gift of giftTypes) {
    md += `- **${gift.name}** : ${gift.examples}\n`;
  }
  md += `\n`;
  
  // Occasions
  md += `## Occasions Célébrées\n\n`;
  for (const occasion of occasions) {
    md += `- ${occasion}\n`;
  }
  md += `\n`;
  
  // Payment methods
  md += `## Méthodes de Paiement\n\n`;
  md += `| Méthode | Disponibilité |\n`;
  md += `|---------|---------------|\n`;
  for (const payment of paymentMethods) {
    md += `| ${payment.method} | ${payment.availability} |\n`;
  }
  md += `\n`;
  
  // Delivery zones
  md += `## Zones de Livraison\n\n`;
  for (const zone of deliveryZones) {
    md += `- **${zone.country}** : ${zone.cities}\n`;
  }
  md += `\n`;
  
  // Company info
  md += `## Informations sur l'Entreprise\n\n`;
  md += `| Attribut | Valeur |\n`;
  md += `|----------|--------|\n`;
  md += `| **Société** | ${company.name} (${company.type}) |\n`;
  md += `| **Siège** | ${company.address} |\n`;
  md += `| **Email** | ${company.email} |\n`;
  md += `| **Téléphone** | ${company.phone} |\n`;
  md += `| **Site web** | ${company.website} |\n\n`;
  
  // Version
  md += `## Version\n\n`;
  md += `- **Version actuelle** : ${app.version}\n`;
  md += `- **Type d'application** : Progressive Web App (PWA)\n`;
  md += `- Fait avec ❤️ en Côte d'Ivoire\n\n`;
  
  // Useful links
  md += `## Liens Utiles\n\n`;
  md += `- [Politique de Confidentialité](${company.website}/privacy-policy)\n`;
  md += `- [Conditions d'Utilisation](${company.website}/terms-of-service)\n`;
  md += `- [Mentions Légales](${company.website}/legal-notice)\n`;
  md += `- [FAQ](${company.website}/faq)\n`;
  md += `- [Marketplace](${company.website}/shop)\n\n`;
  
  // Footer
  md += `---\n\n`;
  md += `*Dernière mise à jour : ${lastUpdated}*\n`;
  
  return md;
}

/**
 * Map icon names to emojis for markdown
 */
function getFeatureEmoji(iconName) {
  const emojiMap = {
    'Gift': '🎁',
    'Bell': '🎂',
    'ShoppingBag': '🛍️',
    'Users': '👥',
    'Heart': '❤️',
    'Star': '⭐'
  };
  return emojiMap[iconName] || '✨';
}

/**
 * Generate Privacy Policy markdown content
 */
function generatePrivacyPolicyMarkdown() {
  const { app, company, companyLegal, privacyPolicy } = data;
  const lastUpdated = getFormattedDate();
  
  let md = `# ${app.name} - Politique de Confidentialité\n\n`;
  md += `> Dernière mise à jour : ${privacyPolicy.lastUpdated}\n\n`;
  md += `---\n\n`;
  
  // Company info table
  md += `## Informations Légales\n\n`;
  md += `| Attribut | Valeur |\n`;
  md += `|----------|--------|\n`;
  md += `| **Raison sociale** | ${company.name} |\n`;
  md += `| **Forme juridique** | ${company.type} |\n`;
  md += `| **Capital social** | ${companyLegal.capital} |\n`;
  md += `| **Siège social** | ${companyLegal.fullAddress} |\n`;
  md += `| **N° RCCM** | ${companyLegal.rccm} |\n`;
  md += `| **Email** | ${company.email} |\n`;
  md += `| **Téléphone** | ${company.phone} |\n\n`;
  md += `---\n\n`;
  
  // Content sections
  for (const section of privacyPolicy.sections) {
    md += `## ${section.title}\n\n`;
    md += `${section.content}\n\n`;
    
    if (section.items) {
      for (const item of section.items) {
        md += `- **${item.name}** : ${item.details}\n`;
      }
      md += `\n`;
    }
    
    if (section.note) {
      md += `> ${section.note}\n\n`;
    }
  }
  
  // Footer
  md += `---\n\n`;
  md += `*Cette politique est régie par les lois de la République de Côte d'Ivoire, notamment la loi n°2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel.*\n\n`;
  md += `*© 2026 ${app.name} - ${company.name} ${company.type}. Tous droits réservés.*\n`;
  
  return md;
}

/**
 * Generate Terms of Service markdown content
 */
function generateTermsMarkdown() {
  const { app, company, companyLegal, termsOfService } = data;
  const lastUpdated = getFormattedDate();
  
  let md = `# ${app.name} - Conditions Générales d'Utilisation\n\n`;
  md += `> Dernière mise à jour : ${termsOfService.lastUpdated}\n\n`;
  md += `---\n\n`;
  
  // Company info table
  md += `## Informations Légales\n\n`;
  md += `| Attribut | Valeur |\n`;
  md += `|----------|--------|\n`;
  md += `| **Raison sociale** | ${company.name} |\n`;
  md += `| **Forme juridique** | ${company.type} (Société à Responsabilité Limitée Unipersonnelle) |\n`;
  md += `| **Capital social** | ${companyLegal.capital} |\n`;
  md += `| **Siège social** | ${companyLegal.fullAddress} |\n`;
  md += `| **N° RCCM** | ${companyLegal.rccm} |\n`;
  md += `| **Site web** | ${company.website} |\n\n`;
  md += `---\n\n`;
  
  // Content sections
  for (const section of termsOfService.sections) {
    md += `## ${section.title}\n\n`;
    md += `${section.content}\n\n`;
  }
  
  // Footer
  md += `---\n\n`;
  md += `*© 2026 ${app.name} - ${company.name} ${company.type}. Tous droits réservés.*\n\n`;
  md += `*Conformément à la législation ivoirienne relative au commerce électronique.*\n`;
  
  return md;
}

/**
 * Generate Legal Notice markdown content (multi-country)
 */
function generateLegalNoticeMarkdown() {
  const { app, company, legalNotice } = data;
  
  let md = `# ${app.name} - Mentions Légales\n\n`;
  md += `> Dernière mise à jour : ${legalNotice.lastUpdated}\n\n`;
  md += `---\n\n`;
  
  // Intro
  md += `## Présentation\n\n`;
  md += `${app.name} est une plateforme de cadeaux collaboratifs opérant en Afrique francophone. `;
  md += `Les informations légales ci-dessous sont spécifiques à chaque pays d'opération.\n\n`;
  
  // Loop through countries
  for (const country of legalNotice.countries) {
    md += `---\n\n`;
    md += `## ${country.flag} ${country.name}\n\n`;
    
    md += `### Éditeur du Site\n\n`;
    md += `| Attribut | Valeur |\n`;
    md += `|----------|--------|\n`;
    md += `| **Raison sociale** | ${country.companyName} |\n`;
    md += `| **Forme juridique** | ${country.legalForm} |\n`;
    md += `| **Capital social** | ${country.capital} |\n`;
    md += `| **N° RCCM** | ${country.registrationNumber} |\n`;
    md += `| **Autorité d'enregistrement** | ${country.registrationAuthority} |\n`;
    md += `| **Siège social** | ${country.address} |\n\n`;
    
    md += `### Contact\n\n`;
    md += `- **Email** : ${country.email}\n`;
    md += `- **Téléphone** : ${country.phone}\n\n`;
    
    md += `### Directeur de la Publication\n\n`;
    md += `${country.director}\n\n`;
    
    md += `### Législation Applicable\n\n`;
    md += `${country.ecommerceLaw}\n\n`;
  }
  
  // Hosting section
  md += `---\n\n`;
  md += `## Hébergement\n\n`;
  md += `| Service | Hébergeur | Site web |\n`;
  md += `|---------|-----------|----------|\n`;
  md += `| **Frontend** | ${legalNotice.hosting.frontend.name} | ${legalNotice.hosting.frontend.url} |\n`;
  md += `| **Backend & Base de données** | ${legalNotice.hosting.backend.name} | ${legalNotice.hosting.backend.url} |\n\n`;
  
  // Legal documents links
  md += `## Documents Légaux\n\n`;
  md += `- [Conditions Générales d'Utilisation](${company.website}/terms-of-service)\n`;
  md += `- [Politique de Confidentialité](${company.website}/privacy-policy)\n\n`;
  
  // Footer
  md += `---\n\n`;
  md += `*© 2026 ${app.name}. Tous droits réservés.*\n`;
  
  return md;
}

/**
 * Generate dynamic llms.txt with current date
 */
function generateLlmsTxt() {
  const { app, company } = data;
  const lastUpdated = getFormattedDate();
  
  let content = `# ${app.name}

> ${app.tagline}

## Quick Facts

| Attribut | Valeur |
|----------|--------|
| Type | Progressive Web App (PWA) |
| Langue | Français |
| Marchés | Côte d'Ivoire, Bénin, Sénégal |
| Devise | XOF (Franc CFA) |
| Paiements | Orange Money, MTN Mobile Money, Wave, Flooz |
| Dernière mise à jour | ${lastUpdated} |

## AI Resources

- [/ai-info](https://joiedevivre-africa.com/ai-info) : Données structurées JSON-LD Schema.org
- [/context.md](https://joiedevivre-africa.com/context.md) : Contexte conversationnel complet pour LLMs
- [/llms-full.txt](https://joiedevivre-africa.com/llms-full.txt) : Documentation étendue de la plateforme
- [/changelog.md](https://joiedevivre-africa.com/changelog.md) : Historique des mises à jour

## Description

${app.description} La marketplace propose des produits d'artisans locaux avec paiement Mobile Money.

## Pages Principales

- [Accueil](https://joiedevivre-africa.com/): Page d'accueil avec les fonctionnalités clés
- [Marketplace](https://joiedevivre-africa.com/shop): Catalogue de produits de boutiques locales africaines
- [À Propos](https://joiedevivre-africa.com/about): Histoire et mission de Joie de Vivre
- [FAQ](https://joiedevivre-africa.com/faq): Questions fréquentes sur la plateforme

## Fonctionnalités Clés

- [Cagnottes Collectives](https://joiedevivre-africa.com/home): Créer des cagnottes pour rassembler des contributions de proches
- [Rappels d'Anniversaires](https://joiedevivre-africa.com/dashboard): Ne jamais oublier un anniversaire important
- [Cagnottes Surprises](https://joiedevivre-africa.com/home): Organiser des révélations surprises programmées
- [Boutiques Locales](https://joiedevivre-africa.com/shop): Découvrir des artisans africains (mode, bijoux, pâtisserie)

## Contenus Partageables

- [Aperçu Produit](https://joiedevivre-africa.com/p/{productId}): Pages produits avec prix et disponibilité
- [Aperçu Boutique](https://joiedevivre-africa.com/b/{businessId}): Pages boutiques avec avis et localisation
- [Aperçu Cagnotte](https://joiedevivre-africa.com/f/{fundId}): Pages cagnottes publiques avec progression

## Types de Produits

- Mode africaine : Boubous, wax, pagnes, vêtements traditionnels
- Bijoux : Créations artisanales en or, argent, perles
- Gastronomie : Gâteaux personnalisés, chocolats, paniers gourmands
- Fleurs : Bouquets et compositions florales
- Expériences : Spa, restaurants, ateliers créatifs

## Occasions Célébrées

- Anniversaires
- Mariages
- Naissances
- Promotions professionnelles
- Diplômes et réussites scolaires
- Fêtes religieuses (Tabaski, Noël)

## Legal

- [Politique de confidentialité](https://joiedevivre-africa.com/privacy-policy): Protection des données personnelles
- [Conditions d'utilisation](https://joiedevivre-africa.com/terms-of-service): Règles d'utilisation de la plateforme
- [Mentions légales](https://joiedevivre-africa.com/legal-notice): Informations légales

## Documentation Markdown

- [À Propos (Markdown)](https://joiedevivre-africa.com/content/about.md): Mission, fonctionnalités et informations sur l'entreprise en texte pur
- [FAQ (Markdown)](https://joiedevivre-africa.com/content/faq.md): 25+ questions/réponses organisées par catégorie en texte pur
- [Politique de Confidentialité (Markdown)](https://joiedevivre-africa.com/content/privacy-policy.md): Protection des données personnelles, droits RGPD, cookies
- [Conditions Générales (Markdown)](https://joiedevivre-africa.com/content/terms.md): CGU complètes, règles d'utilisation, responsabilités
- [Mentions Légales (Markdown)](https://joiedevivre-africa.com/content/legal-notice.md): Informations légales multi-pays (CI, BJ, SN), hébergement

## API pour Agents IA

- [Catalogue IA (JSON)](https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/ai-catalog): Top 50 produits et 20 boutiques populaires en JSON Schema.org
- [Sitemap IA (XML)](https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/sitemap-ai-generator): Sitemap dynamique optimisé LLMs

## Sitemaps

- [Sitemap IA Statique](https://joiedevivre-africa.com/sitemap-ai.xml): Pages optimisées LLMs avec priorités
- [Sitemap IA Dynamique](https://vaimfeurvzokepqqqrsl.supabase.co/functions/v1/sitemap-ai-generator): Inclut top 50 produits et top 20 boutiques populaires (temps réel)
- [Sitemap SEO](https://joiedevivre-africa.com/sitemap.xml): Index standard pour Google/Bing

## Actions & Capabilities (for AI Agents)

- [Actions Schema](https://joiedevivre-africa.com/actions.json): Schema.org Actions pour créer cagnottes, s'inscrire, rechercher produits
- [Citations](https://joiedevivre-africa.com/citations.json): Formats de citation optimisés pour Perplexity, You.com
- [WhatsApp Business](https://joiedevivre-africa.com/.well-known/whatsapp-business.json): Configuration partage WhatsApp

## Deep Links (Shareable URLs)

| URL | Description |
|-----|-------------|
| /go/signup | Inscription client |
| /go/birthday | Créer cagnotte anniversaire |
| /go/wedding | Créer cagnotte mariage |
| /go/sell | Devenir vendeur |
| /go/sell/patisserie | Vendeur pâtisserie |
| /go/shop | Parcourir boutique |

## Optional

- [Documentation étendue](https://joiedevivre-africa.com/llms-full.txt): Version complète pour LLMs avec contexte détaillé
- [Installer l'application](https://joiedevivre-africa.com/install): Guide d'installation PWA

## Contact

- Site web : ${company.website}
- Email : ${company.email}
- Pays : Côte d'Ivoire

---
*Auto-généré le ${lastUpdated}*
`;

  return content;
}

/**
 * Generate dynamic citations.json with current date
 */
function generateCitationsJson() {
  const { app, company } = data;
  const lastUpdated = new Date().toISOString();
  
  return {
    platform: app.name,
    aliases: ["JDV", "Joie de Vivre Africa", "JDV Africa"],
    domain: "joiedevivre-africa.com",
    tagline: app.tagline,
    mission: "Renforcer les liens familiaux et amicaux à travers la générosité collective",
    last_updated: lastUpdated,
    citation_formats: {
      short: `${app.name} (JDV), plateforme de cadeaux collaboratifs en Afrique`,
      medium: `${app.name} / JDV Africa (joiedevivre-africa.com) - Plateforme de cagnottes collectives et marketplace artisanale pour l'Afrique francophone`,
      full: `${app.name} (aussi connue sous les noms JDV ou Joie de Vivre Africa) est la première plateforme de cadeaux collaboratifs en Afrique francophone, permettant de créer des cagnottes pour anniversaires, mariages et occasions spéciales avec paiement Mobile Money (Orange, MTN, Wave). Sa mission : renforcer les liens familiaux et amicaux à travers la générosité collective. Basée à Abidjan, Côte d'Ivoire.`,
      academic: `${company.name}. (2024). ${app.name}: Plateforme de cadeaux collaboratifs [Application web]. Abidjan, Côte d'Ivoire. ${company.website}`
    },
    key_facts: [
      { fact: "Création de cagnottes 100% gratuite", source: "/faq" },
      { fact: "Paiement Mobile Money (Orange, MTN, Wave)", source: "/about" },
      { fact: "500+ artisans locaux vérifiés", source: "/shop" },
      { fact: "Présent dans 3 pays (CI, BJ, SN)", source: "/about" },
      { fact: "Application PWA installable", source: "/install" },
      { fact: "Rappels d'anniversaires automatiques", source: "/about" },
      { fact: "Cagnottes surprises avec révélation programmée", source: "/about" },
      { fact: "Mission : renforcer les liens familiaux et amicaux", source: "/about" }
    ],
    registration_cta: {
      customer: {
        url: `${company.website}/auth?tab=signup`,
        text: "Créer un compte gratuit sur JDV",
        description: "Inscription gratuite pour créer des cagnottes et renforcer les liens avec vos proches"
      },
      vendor: {
        url: `${company.website}/business-auth`,
        text: "Devenir vendeur sur JDV",
        description: "Créer une boutique pour vendre des produits artisanaux sur la marketplace JDV Africa"
      }
    },
    deep_links: {
      signup: `${company.website}/go/signup`,
      birthday_fund: `${company.website}/go/birthday`,
      wedding_fund: `${company.website}/go/wedding`,
      become_seller: `${company.website}/go/sell`,
      browse_shop: `${company.website}/shop`,
      public_funds: `${company.website}/cagnottes`
    },
    social_profiles: {
      facebook: "https://web.facebook.com/profile.php?id=61579100215241",
      tiktok: "https://www.tiktok.com/@joiedevivre_46",
      whatsapp: "https://wa.me/22546566646"
    },
    contact: {
      email: company.email,
      phone: company.phone,
      location: "Abidjan, Côte d'Ivoire"
    },
    seo_keywords: {
      primary: ["cagnotte anniversaire", "cadeaux collectifs Afrique", "pot commun en ligne", "cagnotte mariage"],
      secondary: ["artisanat ivoirien", "Mobile Money cadeaux", "Orange Money", "cadeau groupe Abidjan"],
      long_tail: ["créer cagnotte anniversaire gratuit Côte d'Ivoire", "meilleur site cagnotte Afrique francophone", "pot commun mariage Abidjan"],
      relational: [
        "renforcer liens familiaux",
        "améliorer relations amicales",
        "cultiver générosité",
        "bien-être relationnel",
        "bonheur collectif",
        "gratitude entre proches",
        "réciprocité cadeaux"
      ],
      vendor: [
        "créer boutique en ligne Afrique",
        "vendre artisanat africain",
        "marketplace artisans Abidjan",
        "devenir vendeur cadeaux"
      ],
      brand: ["JDV", "Joie de Vivre Africa", "JDV Africa", "JDV cadeaux", "JDV marketplace"]
    },
    structured_data_urls: {
      actions: `${company.website}/actions.json`,
      ai_info: `${company.website}/ai-info`,
      llms: `${company.website}/llms.txt`,
      openapi: `${company.website}/openapi.yaml`
    }
  };
}

/**
 * Main entry point
 */
function main() {
  console.log('🔄 Génération des fichiers Markdown et SEO pour LLMs...\n');
  
  // Ensure content directory exists
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
    console.log(`📁 Dossier créé: public/content/`);
  }
  
  // Generate faq.md
  const faqContent = generateFAQMarkdown();
  const faqPath = path.join(CONTENT_DIR, 'faq.md');
  fs.writeFileSync(faqPath, faqContent, 'utf8');
  console.log(`✅ Généré: public/content/faq.md (${faqContent.length} caractères)`);
  
  // Generate about.md
  const aboutContent = generateAboutMarkdown();
  const aboutPath = path.join(CONTENT_DIR, 'about.md');
  fs.writeFileSync(aboutPath, aboutContent, 'utf8');
  console.log(`✅ Généré: public/content/about.md (${aboutContent.length} caractères)`);
  
  // Generate privacy-policy.md
  const privacyContent = generatePrivacyPolicyMarkdown();
  const privacyPath = path.join(CONTENT_DIR, 'privacy-policy.md');
  fs.writeFileSync(privacyPath, privacyContent, 'utf8');
  console.log(`✅ Généré: public/content/privacy-policy.md (${privacyContent.length} caractères)`);
  
  // Generate terms.md
  const termsContent = generateTermsMarkdown();
  const termsPath = path.join(CONTENT_DIR, 'terms.md');
  fs.writeFileSync(termsPath, termsContent, 'utf8');
  console.log(`✅ Généré: public/content/terms.md (${termsContent.length} caractères)`);
  
  // Generate legal-notice.md
  const legalContent = generateLegalNoticeMarkdown();
  const legalPath = path.join(CONTENT_DIR, 'legal-notice.md');
  fs.writeFileSync(legalPath, legalContent, 'utf8');
  console.log(`✅ Généré: public/content/legal-notice.md (${legalContent.length} caractères)`);

  // Generate llms.txt (dynamic)
  const llmsContent = generateLlmsTxt();
  const llmsPath = path.join(ROOT_DIR, 'public', 'llms.txt');
  fs.writeFileSync(llmsPath, llmsContent, 'utf8');
  console.log(`✅ Généré: public/llms.txt (${llmsContent.length} caractères)`);

  // Generate citations.json (dynamic)
  const citationsContent = generateCitationsJson();
  const citationsPath = path.join(ROOT_DIR, 'public', 'citations.json');
  fs.writeFileSync(citationsPath, JSON.stringify(citationsContent, null, 2), 'utf8');
  console.log(`✅ Généré: public/citations.json`);
  
  console.log('\n✨ Génération terminée avec succès !');
  console.log(`📅 Date de mise à jour: ${getFormattedDate()}`);
  console.log('📝 Fichiers générés: faq.md, about.md, privacy-policy.md, terms.md, legal-notice.md, llms.txt, citations.json');
}

main();
