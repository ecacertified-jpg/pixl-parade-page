import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { getVendorSectorData, getAllVendorSectorSlugs } from '@/data/vendor-sector-pages';
import { useSchemaInjector } from '@/components/schema/useSchemaInjector';
import { Store, Sparkles, Check, ChevronRight, Star, TrendingUp, CreditCard, Clock } from 'lucide-react';
import logoJV from '@/assets/logo-jv.svg';

const VendorSectorPage = () => {
  const { sectorSlug } = useParams<{ sectorSlug: string }>();
  const navigate = useNavigate();
  
  const data = getVendorSectorData(sectorSlug || '');
  
  if (!data) {
    return <Navigate to="/business-auth" replace />;
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

  // HowTo Schema for becoming a vendor
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `Comment devenir vendeur ${data.sector.toLowerCase()} sur JOIE DE VIVRE`,
    description: `Guide pour rejoindre notre marketplace en tant que ${data.sector.toLowerCase()}`,
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Créez votre compte vendeur',
        text: 'Remplissez le formulaire d\'inscription avec vos informations professionnelles.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Ajoutez vos produits',
        text: 'Téléchargez des photos de vos créations et définissez vos prix.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Validation du profil',
        text: 'Notre équipe vérifie votre profil sous 48h.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Recevez des commandes',
        text: 'Votre boutique est en ligne ! Vous recevez des commandes de clients qualifiés.',
      },
    ],
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://joiedevivre-africa.com/' },
      { '@type': 'ListItem', position: 2, name: 'Devenir vendeur', item: 'https://joiedevivre-africa.com/business-auth' },
      { '@type': 'ListItem', position: 3, name: data.sector, item: `https://joiedevivre-africa.com/devenir-vendeur/${data.slug}` },
    ],
  };

  useSchemaInjector(`vendor-faq-${data.slug}`, faqSchema);
  useSchemaInjector(`vendor-howto-${data.slug}`, howToSchema);
  useSchemaInjector(`vendor-breadcrumb-${data.slug}`, breadcrumbSchema);

  const handleRegister = () => {
    navigate('/business-auth?sector=' + encodeURIComponent(data.slug));
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
                <Button variant="ghost" onClick={() => navigate('/business-auth')}>
                  Connexion vendeur
                </Button>
                <Button onClick={handleRegister}>
                  Créer ma boutique
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
            <li><a href="/business-auth" className="hover:text-foreground">Devenir vendeur</a></li>
            <ChevronRight className="h-4 w-4" />
            <li className="text-foreground font-medium">{data.sector}</li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background" />
          <div className="max-w-7xl mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-6xl mb-6">{data.emoji}</div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                  {data.heroTitle}
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  {data.heroSubtitle}
                </p>
                <Button size="lg" onClick={handleRegister} className="text-lg px-8">
                  Créer ma boutique gratuite
                  <Store className="ml-2 h-5 w-5" />
                </Button>
                
                {/* Pricing highlight */}
                <div className="flex gap-6 mt-8 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span className="font-medium">{data.pricing.joinFee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>{data.pricing.commission}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Paiement {data.pricing.payoutDelay}</span>
                  </div>
                </div>
              </div>
              
              {/* Success Story Highlight */}
              {data.successStories[0] && (
                <Card className="bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-xl italic mb-6">
                      "{data.successStories[0].quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{data.successStories[0].ownerName}</div>
                        <div className="text-muted-foreground">{data.successStories[0].businessName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{data.successStories[0].metric}</div>
                        <div className="text-sm text-muted-foreground">{data.successStories[0].city}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Pourquoi nous rejoindre ?</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              JOIE DE VIVRE vous connecte à des clients qui ont déjà collecté l'argent via leurs cagnottes.
            </p>
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

        {/* Features */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Vos outils de vente</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.features.map((feature, index) => (
                <div key={index} className="flex gap-4 items-start p-6 rounded-lg bg-card border">
                  <div className="text-3xl">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        {data.successStories.length > 1 && (
          <section className="py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">Ils ont réussi avec nous</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.successStories.map((story, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic">"{story.quote}"</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{story.ownerName}</div>
                          <div className="text-sm text-muted-foreground">{story.businessName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{story.metric}</div>
                          <div className="text-xs text-muted-foreground">{story.city}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Requirements */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Critères pour rejoindre</h2>
            <Card>
              <CardContent className="p-8">
                <ul className="space-y-4">
                  {data.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Tarification transparente</h2>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3">
                  <div className="p-8 text-center border-b md:border-b-0 md:border-r">
                    <div className="text-4xl mb-4">💳</div>
                    <div className="text-3xl font-bold text-primary">{data.pricing.joinFee}</div>
                    <div className="text-muted-foreground mt-2">Frais d'inscription</div>
                  </div>
                  <div className="p-8 text-center border-b md:border-b-0 md:border-r">
                    <div className="text-4xl mb-4">📊</div>
                    <div className="text-3xl font-bold text-primary">{data.pricing.commission}</div>
                    <div className="text-muted-foreground mt-2">Commission par vente</div>
                  </div>
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">⚡</div>
                    <div className="text-3xl font-bold text-primary">{data.pricing.payoutDelay}</div>
                    <div className="text-muted-foreground mt-2">Délai de paiement</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
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

        {/* Other Sectors */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Autres secteurs</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {getAllVendorSectorSlugs()
                .filter(slug => slug !== data.slug)
                .map((slug) => {
                  const sectorData = getVendorSectorData(slug);
                  if (!sectorData) return null;
                  return (
                    <a
                      key={slug}
                      href={`/devenir-vendeur/${slug}`}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-card border border-border hover:border-primary hover:shadow-md transition-all"
                    >
                      <span>{sectorData.emoji}</span>
                      {sectorData.sector}
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
              Prêt à développer votre activité ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez notre communauté de vendeurs et accédez à des milliers de clients.
            </p>
            <Button size="lg" onClick={handleRegister} className="text-lg px-8">
              Créer ma boutique gratuite
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2026 JOIE DE VIVRE - Marketplace de cadeaux en Afrique</p>
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

export default VendorSectorPage;
