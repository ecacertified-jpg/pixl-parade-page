import { useParams, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";
import { LocalBusinessSchema, BreadcrumbListSchema, FAQPageSchema } from "@/components/schema/SchemaOrg";
import { CITY_PAGES, type CityPageData } from "@/data/city-pages";
import { 
  Gift, Users, MapPin, CreditCard, Calendar, Sparkles, 
  Heart, Star, ArrowRight, CheckCircle2, Quote
} from "lucide-react";
import logoJV from "@/assets/logo-jv.svg";

/**
 * CityPage - Localized SEO landing page for each target city
 * 
 * Features:
 * - Hero section with city-specific messaging
 * - Local neighborhoods served
 * - Payment methods available
 * - Local testimonials
 * - Localized FAQ
 * - Schema.org structured data (LocalBusiness, FAQ, Breadcrumbs)
 */

// Hero Section
const HeroSection = ({ city }: { city: CityPageData }) => (
  <section className="relative bg-gradient-to-br from-primary/10 via-secondary/20 to-background py-16 md:py-24">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">{city.city}, {city.country}</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-poppins font-bold text-foreground mb-6">
          {city.heroTitle}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {city.heroSubtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/auth">
              <Gift className="w-5 h-5" />
              Créer une cagnotte gratuite
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/shop">
              <Sparkles className="w-5 h-5" />
              Découvrir les boutiques
            </Link>
          </Button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg mx-auto">
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{city.stats.businesses}</p>
            <p className="text-sm text-muted-foreground">Boutiques</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{city.stats.gifts}</p>
            <p className="text-sm text-muted-foreground">Cadeaux offerts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl md:text-3xl font-bold text-primary">{city.stats.users}</p>
            <p className="text-sm text-muted-foreground">Utilisateurs</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// How it Works Section
const HowItWorksSection = ({ city }: { city: CityPageData }) => {
  const steps = [
    {
      icon: Gift,
      title: "Créez votre cagnotte",
      description: `Gratuit et en 2 minutes. Choisissez l'occasion et personnalisez votre page.`
    },
    {
      icon: Users,
      title: "Invitez vos proches",
      description: `Partagez le lien par WhatsApp, SMS ou email. Même vos proches à l'étranger peuvent contribuer.`
    },
    {
      icon: Heart,
      title: "Offrez le cadeau",
      description: `Choisissez parmi nos artisans à ${city.city} ou recevez l'argent collecté.`
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-12">
          Comment ça marche à {city.city} ?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-sm text-primary font-medium mb-2">Étape {index + 1}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Neighborhoods Section
const NeighborhoodsSection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-secondary/30">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-4">
        Nous livrons dans tout {city.city}
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Nos artisans partenaires livrent vos cadeaux dans tous les quartiers de {city.city} et ses environs.
      </p>
      
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        {city.neighborhoods.map((neighborhood) => (
          <span 
            key={neighborhood}
            className="inline-flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-full text-sm hover:border-primary/50 transition-colors"
          >
            <MapPin className="w-3 h-3 text-primary" />
            {neighborhood}
          </span>
        ))}
      </div>
    </div>
  </section>
);

// Payment Methods Section
const PaymentSection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-background">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-4">
        Paiement facile avec Mobile Money
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Contribuez à une cagnotte en quelques clics avec vos moyens de paiement préférés.
      </p>
      
      <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
        {city.paymentMethods.map((method) => (
          <Card key={method.name} className="flex items-center gap-3 px-6 py-4">
            <span className="text-2xl">{method.icon}</span>
            <span className="font-medium">{method.name}</span>
          </Card>
        ))}
      </div>
      
      <p className="text-center text-sm text-muted-foreground mt-6">
        Également : Cartes Visa/Mastercard pour vos proches à l'étranger
      </p>
    </div>
  </section>
);

// Occasions Section
const OccasionsSection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-secondary/30">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-4">
        Toutes les occasions à célébrer
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Créez une cagnotte pour n'importe quel moment de joie.
      </p>
      
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        {city.occasions.map((occasion) => (
          <span 
            key={occasion}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium"
          >
            <Calendar className="w-3 h-3" />
            {occasion}
          </span>
        ))}
      </div>
    </div>
  </section>
);

// Testimonials Section
const TestimonialsSection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-background">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-4">
        Ils célèbrent avec JOIE DE VIVRE
      </h2>
      <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Découvrez les témoignages de nos utilisateurs à {city.city}.
      </p>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {city.testimonials.map((testimonial, index) => (
          <Card key={index} className="relative">
            <CardContent className="pt-8 pb-6">
              <Quote className="absolute top-4 left-4 w-8 h-8 text-primary/20" />
              <p className="text-muted-foreground mb-4 italic">
                "{testimonial.text}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.occasion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// FAQ Section
const FAQSection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-secondary/30">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-center mb-4">
        Questions fréquentes à {city.city}
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Tout ce que vous devez savoir sur JOIE DE VIVRE à {city.city}.
      </p>
      
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="space-y-2">
          {city.faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-background rounded-lg px-4">
              <AccordionTrigger className="text-left font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  </section>
);

// CTA Section
const CTASection = ({ city }: { city: CityPageData }) => (
  <section className="py-16 bg-gradient-to-br from-primary to-primary/80">
    <div className="container mx-auto px-4 text-center">
      <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-white mb-4">
        Prêt à célébrer à {city.city} ?
      </h2>
      <p className="text-white/80 mb-8 max-w-xl mx-auto">
        Rejoignez des milliers de familles qui célèbrent ensemble avec JOIE DE VIVRE.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg" variant="secondary" className="gap-2">
          <Link to="/auth">
            <Gift className="w-5 h-5" />
            Créer ma cagnotte gratuite
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 gap-2">
          <Link to="/business-registration">
            <Sparkles className="w-5 h-5" />
            Devenir vendeur partenaire
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

// Footer
const CityFooter = ({ city }: { city: CityPageData }) => (
  <footer className="bg-background border-t py-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src={logoJV} alt="JOIE DE VIVRE" className="w-10 h-10" />
          <div>
            <p className="font-poppins font-semibold">JOIE DE VIVRE</p>
            <p className="text-sm text-muted-foreground">Cadeaux Collectifs • {city.city}</p>
          </div>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/" className="text-muted-foreground hover:text-primary">Accueil</Link>
          <Link to="/shop" className="text-muted-foreground hover:text-primary">Boutique</Link>
          <Link to="/faq" className="text-muted-foreground hover:text-primary">FAQ</Link>
          <Link to="/about" className="text-muted-foreground hover:text-primary">À propos</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-primary">Contact</Link>
        </nav>
        
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} JOIE DE VIVRE
        </p>
      </div>
    </div>
  </footer>
);

/**
 * Main CityPage Component
 */
export default function CityPage() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const cityData = citySlug ? CITY_PAGES[citySlug] : null;

  // Redirect to 404 if city not found
  if (!cityData) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head */}
      <SEOHead
        title={`Cadeaux Collectifs ${cityData.city} | Cagnottes ${cityData.country}`}
        description={cityData.metaDescription}
        keywords={cityData.keywords.join(', ')}
        aiContentType="landing"
        aiSummary={cityData.description}
        contentRegion={cityData.countryCode}
        audience="consumers"
      />
      
      {/* Schema.org Structured Data */}
      <LocalBusinessSchema
        id={`city-${cityData.slug}`}
        name={`JOIE DE VIVRE ${cityData.city}`}
        description={cityData.description}
        countryCode={cityData.countryCode}
        latitude={cityData.coordinates.lat}
        longitude={cityData.coordinates.lng}
        telephone="+225 05 465 666 46"
        email="contact@joiedevivre-africa.com"
      />
      
      <BreadcrumbListSchema 
        items={[
          { name: 'Accueil', path: '/' },
          { name: cityData.city, path: `/${cityData.slug}` },
        ]} 
      />
      
      <FAQPageSchema 
        faqs={cityData.faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }))} 
      />

      {/* Page Sections */}
      <HeroSection city={cityData} />
      <HowItWorksSection city={cityData} />
      <NeighborhoodsSection city={cityData} />
      <PaymentSection city={cityData} />
      <OccasionsSection city={cityData} />
      <TestimonialsSection city={cityData} />
      <FAQSection city={cityData} />
      <CTASection city={cityData} />
      <CityFooter city={cityData} />
    </div>
  );
}
