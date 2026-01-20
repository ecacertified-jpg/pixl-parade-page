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
 * Main entry point
 */
function main() {
  console.log('🔄 Génération des fichiers Markdown pour LLMs...\n');
  
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
  
  console.log('\n✨ Génération terminée avec succès !');
  console.log(`📅 Date de mise à jour: ${getFormattedDate()}`);
}

main();
