import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { getSeasonalData, getDaysUntil, getAllSeasonalSlugs } from '@/data/seasonal-pages';
import { useSchemaInjector } from '@/components/schema/useSchemaInjector';
import { Gift, Sparkles, ChevronRight, Star, Clock, Calendar, Check, ArrowRight } from 'lucide-react';
import logoJV from '@/assets/logo-jv.svg';

const SeasonalPage = () => {
  const params = useParams();
  const navigate = useNavigate();
  
  // Parse URL: "/tabaski-2026" -> eventSlug="tabaski", year="2026"
  const fullSlug = Object.values(params)[0] || '';
  const match = fullSlug.match(/^(.+)-(\d{4})$/);
  const eventSlug = match ? match[1] : '';
  const year = match ? parseInt(match[2]) : 0;
  
  const dataKey = `${eventSlug}-${year}`;
  const data = getSeasonalData(dataKey);
  
  const [daysUntil, setDaysUntil] = useState(0);
  
  useEffect(() => {
    if (data) {
      setDaysUntil(getDaysUntil(data.dateISO));
    }
  }, [data]);
  
  if (!data) {
    // Not a seasonal page - redirect to home
    return <Navigate to="/" replace />;
  }

  // Event Schema
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${data.event} ${data.year}`,
    description: data.description,
    startDate: data.dateISO,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: "Côte d'Ivoire, Sénégal, Bénin",
      address: {
        '@type': 'PostalAddress',
        addressCountry: ['CI', 'SN', 'BJ'],
      },
    },
    organizer: {
      '@type': 'Organization',
      name: 'JOIE DE VIVRE',
      url: 'https://joiedevivre-africa.com',
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'XOF',
      availability: 'https://schema.org/InStock',
      url: `https://joiedevivre-africa.com/${dataKey}`,
      description: 'Création de cagnotte gratuite',
    },
  };

  // FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://joiedevivre-africa.com/' },
      { '@type': 'ListItem', position: 2, name: data.event, item: `https://joiedevivre-africa.com/${dataKey}` },
    ],
  };

  useSchemaInjector(`seasonal-event-${dataKey}`, eventSchema);
  useSchemaInjector(`seasonal-faq-${dataKey}`, faqSchema);
  useSchemaInjector(`seasonal-breadcrumb-${dataKey}`, breadcrumbSchema);

  const handleCreateFund = () => {
    navigate('/auth?tab=signup&occasion=' + encodeURIComponent(data.event.toLowerCase()));
  };

  return (
    <>
      <SEOHead
        title={`${data.heroTitle} | JOIE DE VIVRE`}
        description={data.metaDescription}
        keywords={data.keywords.join(', ')}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <a href="/" className="flex items-center gap-3">
                <img src={logoJV} alt="Joie de Vivre" className="h-10 w-auto" />
              </a>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate('/auth?tab=signin')}>
                  Connexion
                </Button>
                <Button onClick={handleCreateFund}>
                  Créer ma cagnotte
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumb */}
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><a href="/" className="hover:text-foreground">Accueil</a></li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium">{data.event} {data.year}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background" />
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="text-7xl mb-6">{data.emoji}</div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {data.heroTitle}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {data.heroSubtitle}
              </p>
              
              {/* Countdown */}
              {data.countdown && daysUntil > 0 && (
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary/10 text-primary font-medium mb-8">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg">J-{daysUntil}</span>
                  <span className="text-muted-foreground">avant {data.event}</span>
                </div>
              )}
              
              {/* Date */}
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
                <Calendar className="h-5 w-5" />
                <span>{data.date}</span>
                {data.isVariable && <span className="text-sm">(date lunaire)</span>}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleCreateFund} className="text-lg px-8">
                  Préparer ma cagnotte
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/shop')}>
                  Découvrir les cadeaux
                  <Gift className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Traditions / Context */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{data.event} : une fête à célébrer ensemble</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.traditions.map((tradition, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-3">{tradition.title}</h3>
                    <p className="text-muted-foreground">{tradition.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Fund Ideas */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Idées de cagnottes pour {data.event}</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Créez une cagnotte collective pour célébrer ensemble
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.fundIdeas.map((idea, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={handleCreateFund}
                >
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{idea.emoji}</div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {idea.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{idea.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gift Suggestions */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Cadeaux recommandés</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Découvrez nos suggestions de cadeaux pour {data.event}
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.giftSuggestions.map((suggestion, index) => (
                <a
                  key={index}
                  href={suggestion.link}
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="text-3xl mb-3">{suggestion.emoji}</div>
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                        {suggestion.category}
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {data.testimonials.length > 0 && (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Témoignages</h2>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {data.testimonials.map((testimonial, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                          {data.emoji}
                        </div>
                        <div>
                          <div className="font-semibold">{testimonial.name}</div>
                          <div className="text-sm text-muted-foreground">{testimonial.city}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
            <div className="space-y-4">
              {data.faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground ml-7">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Other Seasonal Events */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Autres événements à célébrer</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {getAllSeasonalSlugs()
                .filter(slug => slug !== dataKey)
                .map((slug) => {
                  const seasonalData = getSeasonalData(slug);
                  if (!seasonalData) return null;
                  return (
                    <a
                      key={slug}
                      href={`/${slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-md transition-all"
                    >
                      <span>{seasonalData.emoji}</span>
                      {seasonalData.event} {seasonalData.year}
                    </a>
                  );
                })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="text-6xl mb-6">{data.emoji}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Préparez {data.event} {data.year} dès maintenant !
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {daysUntil > 0 
                ? `Plus que ${daysUntil} jours pour organiser votre cagnotte.` 
                : 'Créez votre cagnotte et partagez-la à vos proches.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleCreateFund} className="text-lg px-8">
                Créer ma cagnotte {data.event}
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/cagnottes')}>
                Voir les cagnottes publiques
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2026 JOIE DE VIVRE - Plateforme de cadeaux collectifs en Afrique</p>
            <div className="flex justify-center gap-4 mt-4">
              <a href="/privacy-policy" className="hover:text-foreground">Confidentialité</a>
              <a href="/terms-of-service" className="hover:text-foreground">CGU</a>
              <a href="/faq" className="hover:text-foreground">FAQ</a>
              <a href="/contact" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SeasonalPage;
