import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, FileCheck, CreditCard, Mail, Phone, Globe, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import logoJV from "@/assets/logo-jv.svg";

const LegalNotice = () => {
  const navigate = useNavigate();
  const lastUpdated = "8 janvier 2026";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <img src={logoJV} alt="Joie de Vivre" className="h-10 w-auto" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Mentions Légales
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>

        {/* Éditeur du site */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-primary" />
              Éditeur du Site
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Raison sociale</p>
                  <p className="font-medium text-foreground">AMTEY'S</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Forme juridique</p>
                  <p className="font-medium text-foreground">SARLU</p>
                  <p className="text-xs text-muted-foreground">Société à Responsabilité Limitée Unipersonnelle</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Capital social</p>
                  <p className="font-medium text-foreground">1 000 000 F CFA</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">N° RCCM</p>
                  <p className="font-medium text-foreground">CI-ABJ-03-2026-B13-00031</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Siège social</p>
                <p className="font-medium text-foreground">
                  Abidjan, Anyama, Carrefour du Lycée Moderne d'Anyama, non loin du Grand Séminaire d'Anyama, Lot 174 ; Ilot 21.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a 
                    href="mailto:contact@joie-de-vivre.ci" 
                    className="font-medium text-primary hover:underline"
                  >
                    contact@joie-de-vivre.ci
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <a 
                    href="tel:+22505465666 46" 
                    className="font-medium text-primary hover:underline"
                  >
                    +225 05 465 666 46
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Directeur de publication */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              Directeur de la Publication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Responsable</p>
                <p className="font-medium text-foreground">Le Gérant de AMTEY'S</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hébergement */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Globe className="h-5 w-5 text-primary" />
              Hébergement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Hébergeur Frontend</p>
                  <p className="font-medium text-foreground">Lovable</p>
                  <a 
                    href="https://lovable.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    https://lovable.dev
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Globe className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Hébergeur Backend & Base de données</p>
                  <p className="font-medium text-foreground">Supabase</p>
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    https://supabase.com
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liens utiles */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Documents légaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/terms-of-service")}
                className="flex-1 min-w-[200px]"
              >
                Conditions Générales d'Utilisation
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/privacy-policy")}
                className="flex-1 min-w-[200px]"
              >
                Politique de Confidentialité
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>© 2026 JOIE DE VIVRE - AMTEY'S. Tous droits réservés.</p>
          <p className="mt-2">
            Conformément à la législation ivoirienne sur le commerce électronique.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LegalNotice;
