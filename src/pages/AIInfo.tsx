import { useEffect } from "react";
import { ExternalLink, Bot, FileJson, FileText, Code, Globe } from "lucide-react";
import { organizationData } from "@/data/brand-schema";

// Use centralized brand data as source of truth
const DOMAIN = organizationData.url;

/**
 * AI Info Page - Structured data entry point for AI crawlers
 * Contains comprehensive JSON-LD Schema.org structured data
 */
const AIInfo = () => {
  // Organization Schema - dynamically built from brand-schema.ts
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${DOMAIN}/#organization`,
    name: organizationData.name,
    alternateName: ["JDV", "JOIE DE VIVRE"],
    url: DOMAIN,
    logo: organizationData.logo,
    description: organizationData.description,
    slogan: "Célébrer les moments de bonheur",
    foundingDate: "2024",
    foundingLocation: {
      "@type": "Place",
      name: "Abidjan, Côte d'Ivoire"
    },
    legalName: "AMTEY'S SARLU",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carrefour du Lycée Moderne d'Anyama",
      addressLocality: "Abidjan",
      addressRegion: "Anyama",
      addressCountry: "CI"
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: organizationData.contactPhone,
        contactType: "customer service",
        email: organizationData.contactEmail,
        availableLanguage: ["French"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "18:00"
        }
      }
    ],
    areaServed: [
      { "@type": "Country", "name": "Côte d'Ivoire", "alternateName": "CI" },
      { "@type": "Country", "name": "Bénin", "alternateName": "BJ" },
      { "@type": "Country", "name": "Sénégal", "alternateName": "SN" },
      { "@type": "Country", "name": "Mali", "alternateName": "ML" },
      { "@type": "Country", "name": "Cameroun", "alternateName": "CM" },
      { "@type": "Country", "name": "Togo", "alternateName": "TG" },
      { "@type": "Country", "name": "Burkina Faso", "alternateName": "BF" }
    ],
    sameAs: organizationData.socialLinks
  };

  // WebApplication Schema
  const webApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${DOMAIN}/#webapp`,
    name: "Joie de Vivre",
    applicationCategory: "ShoppingApplication",
    applicationSubCategory: "GiftShoppingApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript, Modern browser with ES6 support",
    softwareVersion: "1.0.0",
    inLanguage: "fr",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "XOF",
      description: "Inscription gratuite"
    },
    featureList: [
      "Cagnottes collectives pour anniversaires et événements",
      "Cagnottes surprises avec révélation programmée",
      "Marketplace de boutiques artisanales africaines",
      "Rappels d'anniversaires automatiques (7 jours, 3 jours, jour J)",
      "Paiement Mobile Money (Orange Money, MTN, Wave)",
      "Communauté de partage et célébrations",
      "Suggestions de cadeaux personnalisées",
      "Mode hors ligne partiel (PWA)"
    ],
    screenshot: `${DOMAIN}/og-image.png`,
    provider: { "@id": `${DOMAIN}/#organization` }
  };

  // Product Categories (ItemList)
  const productCategoriesSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${DOMAIN}/#categories`,
    name: "Catégories de Produits Joie de Vivre",
    description: "Types de cadeaux disponibles sur la marketplace",
    numberOfItems: 5,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "ProductGroup",
          name: "Mode africaine",
          description: "Boubous, wax, pagnes, vêtements traditionnels"
        }
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "ProductGroup",
          name: "Bijoux",
          description: "Créations artisanales en or, argent, perles"
        }
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "ProductGroup",
          name: "Gastronomie",
          description: "Gâteaux personnalisés, chocolats, paniers gourmands"
        }
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "ProductGroup",
          name: "Fleurs",
          description: "Bouquets et compositions florales"
        }
      },
      {
        "@type": "ListItem",
        position: 5,
        item: {
          "@type": "ProductGroup",
          name: "Expériences",
          description: "Spa, restaurants, ateliers créatifs"
        }
      }
    ]
  };

  // Occasions (Service offerings)
  const occasionsSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${DOMAIN}/#service`,
    name: "Services de cadeaux collectifs",
    description: "Organisation de cagnottes pour toutes les occasions importantes",
    provider: { "@id": `${DOMAIN}/#organization` },
    serviceType: "Collaborative Gift Platform",
    areaServed: [
      { "@type": "Country", "name": "Côte d'Ivoire" },
      { "@type": "Country", "name": "Bénin" },
      { "@type": "Country", "name": "Sénégal" }
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Occasions supportées",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Anniversaires" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Mariages" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Naissances" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Promotions professionnelles" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Diplômes et réussites scolaires" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Pendaisons de crémaillère" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Fêtes religieuses (Tabaski, Noël)" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Départs en retraite" } }
      ]
    }
  };

  // Payment Methods
  const paymentMethodsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${DOMAIN}/#payments`,
    name: "Moyens de paiement acceptés",
    description: "Mobile Money et autres moyens de paiement disponibles",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "PaymentMethod",
          name: "Orange Money",
          description: "Disponible en Côte d'Ivoire, Sénégal, Mali"
        }
      },
      {
        "@type": "ListItem",
        position: 2,
        item: {
          "@type": "PaymentMethod",
          name: "MTN Mobile Money",
          description: "Disponible en Côte d'Ivoire, Bénin, Cameroun"
        }
      },
      {
        "@type": "ListItem",
        position: 3,
        item: {
          "@type": "PaymentMethod",
          name: "Wave",
          description: "Disponible au Sénégal, Côte d'Ivoire"
        }
      },
      {
        "@type": "ListItem",
        position: 4,
        item: {
          "@type": "PaymentMethod",
          name: "Flooz",
          description: "Disponible au Togo, Bénin"
        }
      }
    ]
  };

  // FAQ Schema (Top 10 questions)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${DOMAIN}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "Comment créer une cagnotte ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Depuis votre tableau de bord, cliquez sur le bouton « + » puis « Créer une cagnotte ». Renseignez le titre, la description, le montant objectif, la date limite et le bénéficiaire."
        }
      },
      {
        "@type": "Question",
        name: "Quels moyens de paiement acceptez-vous ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nous acceptons Orange Money, MTN Mobile Money et Wave. Ces moyens de paiement sont sécurisés et largement utilisés en Afrique francophone."
        }
      },
      {
        "@type": "Question",
        name: "Comment organiser une cagnotte surprise ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lors de la création de la cagnotte, activez l'option « Surprise ». Définissez une date de révélation et un message personnalisé. Le bénéficiaire ne verra pas la cagnotte jusqu'à la date choisie."
        }
      },
      {
        "@type": "Question",
        name: "Comment devenir vendeur sur la plateforme ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cliquez sur « Espace Vendeur » depuis la page d'accueil et créez votre compte professionnel. Remplissez les informations de votre entreprise, ajoutez vos produits et attendez la validation (sous 48h)."
        }
      },
      {
        "@type": "Question",
        name: "Quels sont les délais de livraison ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Les délais varient selon le vendeur et la zone. En général, comptez 24 à 72 heures pour Abidjan et ses environs. Les délais exacts sont indiqués sur chaque fiche produit."
        }
      },
      {
        "@type": "Question",
        name: "Puis-je faire une contribution anonyme ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui ! Lors de votre contribution, vous avez l'option « Contribuer anonymement ». Votre nom ne sera pas affiché aux autres participants."
        }
      },
      {
        "@type": "Question",
        name: "Comment activer les rappels d'anniversaire ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ajoutez vos contacts avec leur date d'anniversaire depuis « Mes contacts ». Les rappels sont automatiquement envoyés 7 jours, 3 jours et le jour même."
        }
      },
      {
        "@type": "Question",
        name: "Mes paiements sont-ils sécurisés ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, toutes les transactions sont cryptées et sécurisées. Nous ne stockons pas vos informations de paiement. Chaque transaction passe par les serveurs sécurisés de nos partenaires."
        }
      },
      {
        "@type": "Question",
        name: "Comment contacter le support ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Par email à ${organizationData.contactEmail}, par téléphone au ${organizationData.contactPhone}, ou via WhatsApp.`
        }
      },
      {
        "@type": "Question",
        name: "Dans quels pays la plateforme est-elle disponible ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Joie de Vivre opère principalement en Côte d'Ivoire, Bénin et Sénégal, avec des livraisons à Abidjan, Cotonou et Dakar."
        }
      }
    ]
  };

  // BreadcrumbList for site navigation
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${DOMAIN}/#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: DOMAIN },
      { "@type": "ListItem", position: 2, name: "Boutique", item: `${DOMAIN}/shop` },
      { "@type": "ListItem", position: 3, name: "À propos", item: `${DOMAIN}/about` },
      { "@type": "ListItem", position: 4, name: "FAQ", item: `${DOMAIN}/faq` },
      { "@type": "ListItem", position: 5, name: "Espace Vendeur", item: `${DOMAIN}/business` }
    ]
  };

  // All schemas combined
  const allSchemas = [
    organizationSchema,
    webApplicationSchema,
    productCategoriesSchema,
    occasionsSchema,
    paymentMethodsSchema,
    faqSchema,
    breadcrumbSchema
  ];

  useEffect(() => {
    // Inject all schemas into the document head
    const existingScripts = document.querySelectorAll('script[data-ai-schema]');
    existingScripts.forEach(script => script.remove());

    allSchemas.forEach((schema, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-ai-schema', `schema-${index}`);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    // Update document title for AI crawlers
    document.title = "Joie de Vivre - AI Information | Structured Data for AI Agents";

    return () => {
      const scripts = document.querySelectorAll('script[data-ai-schema]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  // Resource links for AI agents
  const resources = [
    { name: "llms.txt", url: "/llms.txt", description: "AI discovery file (concise)", icon: FileText },
    { name: "llms-full.txt", url: "/llms-full.txt", description: "Extended AI documentation", icon: FileText },
    { name: "ai-plugin.json", url: "/.well-known/ai-plugin.json", description: "AI plugin manifest", icon: FileJson },
    { name: "FAQ (Markdown)", url: "/content/faq.md", description: "Frequently asked questions", icon: FileText },
    { name: "About (Markdown)", url: "/content/about.md", description: "Platform description", icon: FileText },
    { name: "Privacy Policy", url: "/content/privacy-policy.md", description: "Data protection policy", icon: FileText },
    { name: "Terms of Service", url: "/content/terms.md", description: "General terms", icon: FileText },
    { name: "Legal Notice", url: "/content/legal-notice.md", description: "Legal information", icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-primary/5 border-b border-primary/10 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-10 h-10 text-primary" />
            <h1 className="text-2xl md:text-3xl font-poppins font-semibold text-foreground">
              Joie de Vivre - AI Information
            </h1>
          </div>
          <p className="text-muted-foreground font-nunito">
            Cette page fournit des données structurées (JSON-LD Schema.org) pour les agents IA et moteurs de recherche.
            <br />
            <span className="text-sm italic">
              This page provides structured data for AI agents and search engines.
            </span>
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Summary */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-poppins font-medium mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Résumé de la Plateforme
          </h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm font-nunito">
            <div>
              <strong>Nom:</strong> Joie de Vivre
            </div>
            <div>
              <strong>Type:</strong> Plateforme de cadeaux collaboratifs
            </div>
            <div>
              <strong>Marché:</strong> Afrique francophone
            </div>
            <div>
              <strong>Pays:</strong> Côte d'Ivoire, Bénin, Sénégal
            </div>
            <div>
              <strong>Paiements:</strong> Orange Money, MTN, Wave
            </div>
            <div>
              <strong>Langue:</strong> Français
            </div>
          </div>
        </section>

        {/* JSON-LD Schemas */}
        <section className="space-y-4">
          <h2 className="text-xl font-poppins font-medium flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Structured Data (JSON-LD)
          </h2>
          
          {allSchemas.map((schema, index) => (
            <details key={index} className="bg-card rounded-lg border">
              <summary className="p-4 cursor-pointer font-poppins font-medium hover:bg-muted/50 transition-colors">
                {(schema as { "@type": string })["@type"]}
              </summary>
              <div className="p-4 pt-0">
                <pre className="bg-muted/50 p-4 rounded-md overflow-x-auto text-xs font-mono">
                  {JSON.stringify(schema, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </section>

        {/* Resources Links */}
        <section className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-poppins font-medium mb-4 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Related Resources
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {resources.map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <resource.icon className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium font-poppins text-sm truncate">{resource.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{resource.description}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* For AI Agents */}
        <section className="bg-primary/5 rounded-lg border border-primary/20 p-6">
          <h2 className="text-lg font-poppins font-medium mb-3">📌 For AI Agents</h2>
          <ul className="text-sm font-nunito space-y-2 text-muted-foreground">
            <li>• Primary language: <strong>French</strong></li>
            <li>• Target market: <strong>French-speaking West Africa</strong></li>
            <li>• Main features: Collective gift funds, birthday reminders, artisan marketplace</li>
            <li>• Payment: Mobile Money only (Orange Money, MTN, Wave)</li>
            <li>• Contact: contact@joiedevivre-africa.com</li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground font-nunito">
        <p>© 2026 Joie de Vivre. Structured data for AI agents and search engines.</p>
        <p className="mt-2">
          <a href="/" className="text-primary hover:underline">← Retour à l'accueil</a>
        </p>
      </footer>
    </div>
  );
};

export default AIInfo;
