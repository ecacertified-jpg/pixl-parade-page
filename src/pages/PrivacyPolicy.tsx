import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Mail, MapPin, Phone, FileText, Users, Database, Share2, UserCheck, Clock, Lock, Cookie, Baby, Bell, ExternalLink, Building2, CreditCard, FileCheck } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import logoJV from "@/assets/logo-jv.svg";

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const lastUpdated = "27 décembre 2024";

  const sections = [
    { id: "presentation", title: "1. Présentation", icon: FileText },
    { id: "donnees-collectees", title: "2. Données collectées", icon: Database },
    { id: "utilisation", title: "3. Utilisation des données", icon: Users },
    { id: "partage", title: "4. Partage des données", icon: Share2 },
    { id: "droits", title: "5. Vos droits", icon: UserCheck },
    { id: "conservation", title: "6. Conservation", icon: Clock },
    { id: "securite", title: "7. Sécurité", icon: Lock },
    { id: "cookies", title: "8. Cookies", icon: Cookie },
    { id: "mineurs", title: "9. Mineurs", icon: Baby },
    { id: "modifications", title: "10. Modifications", icon: Bell },
    { id: "contact", title: "11. Contact", icon: Mail },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/90 backdrop-blur-md sticky top-0 z-50 border-b border-border/30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logoJV} alt="Joie de Vivre" className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Confidentialité</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>

        {/* Table of Contents */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Sommaire</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className="flex items-center gap-2 text-left text-muted-foreground hover:text-primary transition-colors py-1"
                >
                  <section.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{section.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              JOIE DE VIVRE - Vos données sont protégées
            </h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Raison sociale :</strong> AMTEY'S</span>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Forme juridique :</strong> SARLU</span>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Capital social :</strong> 1 000 000 F CFA</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Siège social :</strong> Abidjan, Anyama, Carrefour du Lycée Moderne d'Anyama, non loin du Grand Séminaire d'Anyama, Lot 174 ; Ilot 21</span>
              </div>
              <div className="flex items-start gap-3">
                <FileCheck className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>N° RCCM :</strong> CI-ABJ-03-2026-B13-00031</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <a href="mailto:contact@joiedevivre-africa.com" className="text-foreground hover:text-primary transition-colors">
                  <strong>E-mail :</strong> contact@joiedevivre-africa.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <a href="tel:+2250546566646" className="text-foreground hover:text-primary transition-colors">
                  <strong>Téléphone :</strong> +225 0546566646
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8">
          {/* Section 1 - Présentation */}
          <section id="presentation">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Présentation
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                JOIE DE VIVRE est une plateforme de partage de cadeaux et de célébration des moments de bonheur, 
                opérant principalement en Côte d'Ivoire. Nous nous engageons à protéger la vie privée de nos 
                utilisateurs et à traiter leurs données personnelles avec le plus grand soin.
              </p>
              <p>
                La présente politique de confidentialité décrit comment nous collectons, utilisons, stockons et 
                protégeons vos informations personnelles lorsque vous utilisez notre plateforme web et mobile.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 2 - Données collectées */}
          <section id="donnees-collectees">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              2. Données collectées
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Nous collectons les catégories de données suivantes :</p>
              
              <div className="grid gap-3">
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Données d'identité</h4>
                  <p className="text-sm">Nom, prénom, date de naissance, photo de profil</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Coordonnées</h4>
                  <p className="text-sm">Adresse e-mail, numéro de téléphone, adresse de livraison</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Préférences de cadeaux</h4>
                  <p className="text-sm">Wishlist, préférences de couleurs, tailles, allergies alimentaires</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Données de transaction</h4>
                  <p className="text-sm">Historique des contributions aux cagnottes, commandes, montants (références de paiement uniquement)</p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-semibold text-foreground mb-2">Relations</h4>
                  <p className="text-sm">Liste de contacts ajoutés, relations (famille, amis, collègues), dates importantes</p>
                </Card>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 3 - Utilisation */}
          <section id="utilisation">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              3. Utilisation des données
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Vos données sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Fourniture des services</strong> : Création de cagnottes, notifications d'anniversaires, commandes de cadeaux</li>
                <li><strong className="text-foreground">Personnalisation</strong> : Suggestions de cadeaux adaptées, rappels intelligents</li>
                <li><strong className="text-foreground">Communication</strong> : Notifications sur l'activité de vos cagnottes, confirmations de commandes</li>
                <li><strong className="text-foreground">Amélioration</strong> : Analyse anonymisée pour améliorer nos services</li>
                <li><strong className="text-foreground">Sécurité</strong> : Prévention de la fraude et protection de votre compte</li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Section 4 - Partage */}
          <section id="partage">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              4. Partage des données
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Vos données peuvent être partagées avec :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Vendeurs partenaires</strong> : Uniquement les informations nécessaires à la livraison</li>
                <li><strong className="text-foreground">Prestataires de paiement</strong> : Orange Money, MTN Mobile Money (références uniquement)</li>
                <li><strong className="text-foreground">Hébergeur</strong> : Supabase (données chiffrées)</li>
              </ul>
              
              <Card className="p-4 border-destructive/20 bg-destructive/5 mt-4">
                <p className="text-sm font-medium text-foreground">
                  ⚠️ Nous ne vendons JAMAIS vos données à des tiers à des fins publicitaires.
                </p>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Section 5 - Droits */}
          <section id="droits">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              5. Vos droits
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Conformément à la réglementation, vous disposez des droits suivants :</p>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary font-bold">✓</span>
                  <div>
                    <strong className="text-foreground">Droit d'accès</strong>
                    <p className="text-sm">Consultez toutes vos données via les paramètres de votre profil</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary font-bold">✓</span>
                  <div>
                    <strong className="text-foreground">Droit de rectification</strong>
                    <p className="text-sm">Modifiez vos informations à tout moment</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary font-bold">✓</span>
                  <div>
                    <strong className="text-foreground">Droit à l'effacement</strong>
                    <p className="text-sm">Demandez la suppression de votre compte et données</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary font-bold">✓</span>
                  <div>
                    <strong className="text-foreground">Droit à la portabilité</strong>
                    <p className="text-sm">Exportez vos données dans un format lisible</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary font-bold">✓</span>
                  <div>
                    <strong className="text-foreground">Droit d'opposition</strong>
                    <p className="text-sm">Refusez certains traitements de vos données</p>
                  </div>
                </div>
              </div>
              
              <Card className="p-4 border-primary/20 bg-primary/5 mt-4">
                <p className="text-sm text-foreground">
                  📧 Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@joiedevivre-africa.com" className="text-primary font-medium hover:underline">contact@joiedevivre-africa.com</a>
                </p>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Section 6 - Conservation */}
          <section id="conservation">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              6. Conservation des données
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Compte actif</strong> : Données conservées tant que le compte est actif</li>
                <li><strong className="text-foreground">Compte supprimé</strong> : Anonymisation après 30 jours</li>
                <li><strong className="text-foreground">Transactions</strong> : Conservation 5 ans (obligation légale)</li>
                <li><strong className="text-foreground">Logs de sécurité</strong> : Conservation 1 an</li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Section 7 - Sécurité */}
          <section id="securite">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              7. Sécurité
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Nous mettons en œuvre des mesures de sécurité robustes :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Chiffrement des données en transit (HTTPS/TLS)</li>
                <li>Chiffrement des données au repos</li>
                <li>Authentification sécurisée avec validation par e-mail</li>
                <li>Politiques de sécurité au niveau des lignes (RLS) sur la base de données</li>
                <li>Audits réguliers de sécurité</li>
                <li>Accès restreint aux données sensibles</li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Section 8 - Cookies */}
          <section id="cookies">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              8. Cookies et technologies similaires
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Nous utilisons des cookies pour :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Cookies essentiels</strong> : Authentification et sécurité de session</li>
                <li><strong className="text-foreground">Cookies de préférences</strong> : Mémorisation de vos choix (langue, thème)</li>
                <li><strong className="text-foreground">Cookies analytiques</strong> : Amélioration de l'expérience (anonymisés)</li>
              </ul>
              <p className="mt-4">
                Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 9 - Mineurs */}
          <section id="mineurs">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Baby className="h-5 w-5 text-primary" />
              9. Protection des mineurs
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                JOIE DE VIVRE est destiné aux personnes de 18 ans et plus. Nous ne collectons pas 
                sciemment de données concernant les mineurs. Si nous découvrons qu'un mineur a créé 
                un compte, celui-ci sera supprimé immédiatement.
              </p>
              <p>
                Les parents ou tuteurs légaux peuvent nous contacter pour signaler tout compte créé 
                par un mineur.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 10 - Modifications */}
          <section id="modifications">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              10. Modifications de la politique
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Nous pouvons mettre à jour cette politique de confidentialité périodiquement. 
                En cas de modifications significatives, nous vous informerons par :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Notification dans l'application</li>
                <li>E-mail à l'adresse associée à votre compte</li>
                <li>Bannière sur notre site web</li>
              </ul>
              <p className="mt-4">
                La date de dernière mise à jour est indiquée en haut de ce document. Nous vous 
                encourageons à consulter régulièrement cette page.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 11 - Contact */}
          <section id="contact">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              11. Nous contacter
            </h2>
            <Card className="p-6 border-primary/20 bg-primary/5">
              <h3 className="font-semibold text-foreground mb-4">JOIE DE VIVRE</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">E-mail</p>
                    <a href="mailto:contact@joiedevivre-africa.com" className="text-foreground font-medium hover:text-primary transition-colors">
                      contact@joiedevivre-africa.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adresse</p>
                    <p className="text-foreground font-medium">Anyama, Abidjan, Côte d'Ivoire</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone</p>
                    <a href="tel:+2250546566646" className="text-foreground font-medium hover:text-primary transition-colors">
                      +225 0546566646
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link to="/terms-of-service">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Conditions d'Utilisation
                </Button>
              </Link>
              <Button variant="ghost" onClick={() => navigate("/")}>
                Retour à l'accueil
              </Button>
            </div>
          </section>

          {/* Legal Footer */}
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>
              Cette politique est régie par les lois de la République de Côte d'Ivoire, 
              notamment la loi n°2013-450 du 19 juin 2013 relative à la protection des 
              données à caractère personnel.
            </p>
            <p className="mt-4">
              © 2026 JOIE DE VIVRE - AMTEY'S SARL. Tous droits réservés.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
