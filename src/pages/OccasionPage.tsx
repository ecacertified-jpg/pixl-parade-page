import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { getOccasionData, getAllOccasionSlugs } from '@/data/occasion-pages';
import { useSchemaInjector } from '@/components/schema/useSchemaInjector';
import { Gift, Sparkles, Users, ArrowRight, ChevronRight, Star, Check } from 'lucide-react';
import logoJV from '@/assets/logo-jv.svg';

const OccasionPage = () => {
  const { occasionSlug } = useParams<{ occasionSlug: string }>();
  const navigate = useNavigate();
  
  // Extract occasion from URL (e.g., "cagnotte-anniversaire" -> "anniversaire")
  const slug = occasionSlug?.replace('cagnotte-', '') || '';
  const data = getOccasionData(slug);
  
  // Check if this is a valid occasion page
  if (!data) {
    // Not an occasion page - let the router handle it
    return <Navigate to={`/${occasionSlug}`} replace />;
  }

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

  // HowTo Schema
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Comment créer une cagnotte ${data.occasion.toLowerCase()}`,
    description: `Guide pour créer une cagnotte collective pour un ${data.occasion.toLowerCase()} sur JOIE DE VIVRE`,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Créez votre compte',
        text: 'Inscrivez-vous gratuitement sur JOIE DE VIVRE en quelques clics.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Créez votre cagnotte',
        text: `Cliquez sur "Créer une cagnotte" et sélectionnez "${data.occasion}". Personnalisez avec photo et message.`,
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Partagez le lien',
        text: 'Partagez le lien de votre cagnotte par WhatsApp, SMS ou email à vos proches.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Recevez les contributions',
        text: 'Vos proches contribuent via Orange Money, MTN, Wave ou autres moyens de paiement locaux.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Offrez le cadeau',
        text: 'Choisissez un cadeau dans notre boutique ou transférez les fonds au bénéficiaire.',
      },
    ],
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://joiedevivre-africa.com/' },
      { '@type': 'ListItem', position: 2, name: 'Cagnottes', item: 'https://joiedevivre-africa.com/cagnottes' },
      { '@type': 'ListItem', position: 3, name: `Cagnotte ${data.occasion}`, item: `https://joiedevivre-africa.com/cagnotte-${data.slug}` },
    ],
  };

  useSchemaInjector(`occasion-faq-${slug}`, faqSchema);
  useSchemaInjector(`occasion-howto-${slug}`, howToSchema);
  useSchemaInjector(`occasion-breadcrumb-${slug}`, breadcrumbSchema);

  const handleCreateFund = () => {
    navigate('/auth?tab=signup&occasion=' + encodeURIComponent(data.slug));
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
            <li><a href="/cagnottes" className="hover:text-foreground">Cagnottes</a></li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium">Cagnotte {data.occasion}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background" />
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="text-6xl mb-6">{data.emoji}</div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
                {data.heroTitle}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {data.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleCreateFund} className="text-lg px-8">
                  Créer ma cagnotte gratuite
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/shop')}>
                  Voir la boutique
                  <Gift className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              {/* Stats */}
              <div className="flex justify-center gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{data.stats.fundsCreated}</div>
                  <div className="text-sm text-muted-foreground">Cagnottes créées</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{data.stats.avgAmount}</div>
                  <div className="text-sm text-muted-foreground">Montant moyen</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{data.stats.contributors}</div>
                  <div className="text-sm text-muted-foreground">Contributeurs/cagnotte</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Comment ça marche ?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: 1, title: 'Créez votre cagnotte', desc: 'Inscrivez-vous, personnalisez votre page avec photos et message.' },
                { step: 2, title: 'Partagez le lien', desc: 'Envoyez le lien par WhatsApp, SMS ou email à vos proches.' },
                { step: 3, title: 'Offrez le cadeau', desc: 'Choisissez un cadeau ou transférez les fonds au bénéficiaire.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Pourquoi utiliser JOIE DE VIVRE ?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.benefits.map((benefit, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Gift Ideas */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Idées de cadeaux pour un {data.occasion.toLowerCase()}</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Découvrez nos suggestions de cadeaux auprès d'artisans locaux vérifiés
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {data.giftIdeas.map((idea, index) => (
                <a
                  key={index}
                  href={idea.link}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-md transition-all"
                >
                  <Gift className="h-4 w-4 text-primary" />
                  {idea.name}
                  <ArrowRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Ils ont créé leur cagnotte {data.occasion.toLowerCase()}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {data.testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
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

        {/* Related Occasions */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Autres types de cagnottes</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {data.relatedOccasions.map((occasionSlug) => {
                const relatedData = getOccasionData(occasionSlug);
                if (!relatedData) return null;
                return (
                  <a
                    key={occasionSlug}
                    href={`/cagnotte-${occasionSlug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-md transition-all"
                  >
                    <span>{relatedData.emoji}</span>
                    Cagnotte {relatedData.occasion}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="text-5xl mb-6">{data.emoji}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à créer votre cagnotte {data.occasion.toLowerCase()} ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Inscription gratuite, création en 2 minutes, partage par WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleCreateFund} className="text-lg px-8">
                Créer ma cagnotte gratuite
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

export default OccasionPage;
