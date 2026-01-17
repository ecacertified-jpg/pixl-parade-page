import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ForceUpdateButton } from "@/components/ForceUpdateButton";
import {
  ArrowLeft,
  Info,
  Heart,
  Gift,
  Bell,
  Users,
  ShoppingBag,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Building2,
  ExternalLink,
} from "lucide-react";
import logoJV from "@/assets/logo-jv.svg";
import { APP_VERSION, APP_NAME, APP_TAGLINE, APP_DESCRIPTION, COMPANY_INFO, BUILD_DATE } from "@/config/appVersion";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";

const features = [
  {
    icon: Gift,
    title: "Cagnottes collectives",
    description: "Organisez des cadeaux de groupe pour toutes les occasions",
  },
  {
    icon: Bell,
    title: "Rappels d'anniversaires",
    description: "Ne manquez plus jamais une date importante",
  },
  {
    icon: ShoppingBag,
    title: "Boutique de cadeaux",
    description: "Découvrez des idées de cadeaux locaux et personnalisés",
  },
  {
    icon: Users,
    title: "Communauté",
    description: "Partagez vos moments de joie avec vos proches",
  },
];

export default function About() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <>
    <SEOHead {...SEO_CONFIGS.about} />
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={logoJV} alt={APP_NAME} className="h-10 w-auto" />
          <div className="w-10 flex items-center justify-center">
            <Info className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-6">
          <div className="flex justify-center mb-4">
            <img 
              src={logoJV} 
              alt={APP_NAME} 
              className="h-24 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground font-poppins">
            {APP_NAME}
          </h1>
          <p className="text-xl text-primary font-medium font-nunito">
            {APP_TAGLINE}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm text-primary">
            <span>Version {APP_VERSION}</span>
            <span className="text-primary/50">•</span>
            <span className="text-muted-foreground">{BUILD_DATE}</span>
          </div>
        </div>

        {/* Mission Card */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                <Heart className="h-5 w-5" />
              </div>
              Notre Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground leading-relaxed">
              {APP_DESCRIPTION}
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Que ce soit pour un anniversaire, un mariage, une promotion ou toute autre 
              célébration, {APP_NAME} facilite l'organisation de cadeaux collectifs et 
              renforce les liens entre les personnes qui s'aiment.
            </p>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20 text-accent">
                <Gift className="h-5 w-5" />
              </div>
              Fonctionnalités
            </CardTitle>
            <CardDescription>
              Tout ce dont vous avez besoin pour célébrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Update Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary">
                <RefreshCw className="h-5 w-5" />
              </div>
              Mise à jour de l'application
            </CardTitle>
            <CardDescription>
              Assurez-vous d'utiliser la dernière version
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si vous rencontrez des problèmes ou souhaitez vous assurer d'avoir la 
              dernière version de l'application, utilisez le bouton ci-dessous pour 
              forcer la mise à jour.
            </p>
            <ForceUpdateButton />
          </CardContent>
        </Card>

        {/* Legal Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              Informations légales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-foreground">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{COMPANY_INFO.name}</span>
                <span className="text-muted-foreground">({COMPANY_INFO.type})</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{COMPANY_INFO.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`mailto:${COMPANY_INFO.email}`} 
                  className="text-primary hover:underline"
                >
                  {COMPANY_INFO.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={`tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`} 
                  className="text-primary hover:underline"
                >
                  {COMPANY_INFO.phone}
                </a>
              </div>
            </div>

            {/* Legal Links */}
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">Documents légaux</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="justify-start gap-2"
                  onClick={() => navigate("/privacy-policy")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Politique de Confidentialité
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start gap-2"
                  onClick={() => navigate("/terms-of-service")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Conditions d'Utilisation
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start gap-2"
                  onClick={() => navigate("/legal-notice")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Mentions Légales
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start gap-2"
                  onClick={() => navigate("/faq")}
                >
                  <ExternalLink className="h-4 w-4" />
                  FAQ
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-4 pt-4 pb-8">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>© {currentYear} {APP_NAME}. Tous droits réservés.</p>
            <p className="flex items-center justify-center gap-1">
              Fait avec <Heart className="h-3 w-3 text-primary fill-primary" /> en Côte d'Ivoire
            </p>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
