import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gift, Users, Heart, Sparkles, ShoppingBag, Calendar } from "lucide-react";
import logoJV from "@/assets/logo-jv.svg";
import celebrationHero from "@/assets/cadeaux-echanges.png";
import valueProposition from "@/assets/value-proposition.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { SurveyModal } from "@/components/SurveyModal";
import { MessageSquare } from "lucide-react";
const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [surveyOpen, setSurveyOpen] = useState(false);

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);
  const features = [{
    icon: Gift,
    title: "Cadeaux Partagés",
    description: "Créez des cagnottes collectives pour offrir ensemble des cadeaux inoubliables"
  }, {
    icon: Users,
    title: "Réseau de Générosité",
    description: "Construisez votre cercle de donneurs et recevez des cadeaux en retour"
  }, {
    icon: Calendar,
    title: "Rappels Automatiques",
    description: "Ne manquez plus jamais un anniversaire ou une occasion spéciale"
  }, {
    icon: Heart,
    title: "Moments de Bonheur",
    description: "Célébrez les réussites, promotions, mariages et toutes les joies de la vie"
  }, {
    icon: ShoppingBag,
    title: "Boutique Locale",
    description: "Découvrez des artisans et commerçants locaux de Côte d'Ivoire"
  }, {
    icon: Sparkles,
    title: "Surprises Mémorables",
    description: "Organisez des surprises avec révélation programmée et musique personnalisée"
  }];
  return <>
    <SurveyModal externalOpen={surveyOpen} onExternalOpenChange={setSurveyOpen} />
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <img src={logoJV} alt="Joie de Vivre" className="h-12 w-auto" />
              
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Connexion
              </Button>
              <Button variant="default" onClick={() => navigate("/auth")}>
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-background" />
        <div className="container relative px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                Plateforme #1 en Côte d'Ivoire
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Célébrez les Moments de{" "}
                <span className="text-primary">Bonheur</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Offrez et recevez des cadeaux pour les anniversaires, promotions, mariages et toutes les occasions qui comptent. Créez des cagnottes collectives et partagez la joie avec vos proches.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                  Commencer gratuitement
                  <Sparkles className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/business-auth")}>
                  Espace Vendeur
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img src={celebrationHero} alt="Célébration" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground rounded-2xl p-6 shadow-xl">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm opacity-90">Cadeaux offerts</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Pourquoi choisir JOIE DE VIVRE ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Une plateforme complète pour célébrer, offrir et recevoir des cadeaux de manière simple et mémorable
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => <div key={index} className="group relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 border border-border">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative order-2 lg:order-1">
              <img src={valueProposition} alt="Proposition de valeur" className="rounded-3xl shadow-2xl w-full" />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-foreground">
                Comment ça marche ?
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Ajoutez vos proches</h3>
                    <p className="text-muted-foreground">
                      Créez votre réseau en ajoutant amis, famille et collègues avec leurs dates importantes
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Recevez des notifications</h3>
                    <p className="text-muted-foreground">
                      Soyez alerté 7-10 jours avant chaque occasion pour préparer le cadeau parfait
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Offrez ensemble</h3>
                    <p className="text-muted-foreground">
                      Créez des cagnottes collectives pour offrir des cadeaux plus importants en groupe
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Livraison rapide</h3>
                    <p className="text-muted-foreground">
                      Commandez chez des commerçants locaux avec livraison ou retrait sur place
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-secondary/5 to-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Prêt à célébrer la joie de vivre ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Rejoignez des centaines d'utilisateurs qui partagent déjà des moments de bonheur sur JOIE DE VIVRE
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
                Créer mon compte
                <Heart className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/business-auth")}>
                Je suis vendeur
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={logoJV} alt="JOIE DE VIVRE" className="h-8 w-8" />
                <span className="font-bold text-foreground">JOIE DE VIVRE</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Célébrez les moments de bonheur avec vos proches en Côte d'Ivoire
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Plateforme</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/auth" className="hover:text-foreground transition-colors">S'inscrire</a></li>
                <li><a href="/business-auth" className="hover:text-foreground transition-colors">Espace Vendeur</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Fonctionnalités</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Cagnottes collectives</li>
                <li>Boutique locale</li>
                <li>Rappels automatiques</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Légal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="/terms-of-service" className="hover:text-foreground transition-colors">
                    Conditions d'Utilisation
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="hover:text-foreground transition-colors">
                    Politique de Confidentialité
                  </a>
                </li>
                <li>
                  <button 
                    onClick={() => setSurveyOpen(true)}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Donnez votre avis
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2026 JOIE DE VIVRE. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  </>;
};
export default Landing;