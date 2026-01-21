import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  User, 
  Settings, 
  Users, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  Edit, 
  Copyright, 
  AlertTriangle, 
  Shield, 
  Scale, 
  RefreshCw, 
  FileCheck, 
  Mail, 
  MapPin, 
  Phone, 
  Building2,
  ExternalLink
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { LegalBreadcrumb } from "@/components/breadcrumbs";
import logoJV from "@/assets/logo-jv.svg";

const TermsOfService = () => {
  const navigate = useNavigate();
  const lastUpdated = "27 décembre 2024";

  const sections = [
    { id: "presentation", title: "1. Présentation du Service", icon: FileText },
    { id: "acceptation", title: "2. Acceptation des Conditions", icon: CheckCircle },
    { id: "inscription", title: "3. Inscription et Compte", icon: User },
    { id: "services", title: "4. Services Proposés", icon: Settings },
    { id: "cagnottes", title: "5. Cagnottes Collectives", icon: Users },
    { id: "paiements", title: "6. Achats et Paiements", icon: CreditCard },
    { id: "livraison", title: "7. Livraison", icon: Truck },
    { id: "retours", title: "8. Rétractation et Retours", icon: RotateCcw },
    { id: "contenu", title: "9. Contenu Utilisateur", icon: Edit },
    { id: "propriete", title: "10. Propriété Intellectuelle", icon: Copyright },
    { id: "responsabilite", title: "11. Limitation de Responsabilité", icon: AlertTriangle },
    { id: "donnees", title: "12. Protection des Données", icon: Shield },
    { id: "litiges", title: "13. Règlement des Litiges", icon: Scale },
    { id: "modifications", title: "14. Modifications des CGU", icon: RefreshCw },
    { id: "dispositions", title: "15. Dispositions Générales", icon: FileCheck },
    { id: "contact", title: "16. Contact", icon: Mail },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
    <SEOHead {...SEO_CONFIGS.terms} />
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <LegalBreadcrumb page="terms" />
      
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
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">CGU</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Conditions Générales d'Utilisation
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

        {/* Company Info Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Informations Légales
            </h3>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Raison sociale :</strong> AMTEY'S</span>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <span className="text-foreground"><strong>Forme juridique :</strong> SARLU (Société à Responsabilité Limitée Unipersonnelle)</span>
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
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-primary mt-0.5" />
                <Link to="/privacy-policy" className="text-primary hover:underline flex items-center gap-1">
                  <strong>Politique de Confidentialité</strong>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CGU Sections */}
        <div className="space-y-8">
          {/* Section 1 - Présentation */}
          <section id="presentation">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Présentation du Service
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                JOIE DE VIVRE est une plateforme numérique exploitée par <strong className="text-foreground">AMTEY'S</strong>, 
                SARLU au capital de 1 000 000 F CFA, immatriculée au RCCM sous le numéro CI-ABJ-03-2026-B13-00031, 
                dont le siège social est situé à Abidjan, Anyama, Carrefour du Lycée Moderne d'Anyama, 
                non loin du Grand Séminaire d'Anyama, Lot 174 ; Ilot 21, Côte d'Ivoire.
              </p>
              <p>
                La plateforme permet aux utilisateurs de :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Créer et participer à des cagnottes collectives pour offrir des cadeaux</li>
                <li>Gérer un carnet d'adresses avec les dates importantes de leurs proches</li>
                <li>Recevoir des rappels pour les anniversaires et occasions spéciales</li>
                <li>Acheter des cadeaux auprès de vendeurs partenaires</li>
                <li>Partager des moments de célébration avec leur communauté</li>
              </ul>
            </div>
          </section>

          <Separator />

          {/* Section 2 - Acceptation */}
          <section id="acceptation">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              2. Acceptation des Conditions
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                En accédant à la plateforme JOIE DE VIVRE ou en l'utilisant, vous acceptez d'être lié par les 
                présentes Conditions Générales d'Utilisation (CGU). Si vous n'acceptez pas ces conditions, 
                vous ne devez pas utiliser nos services.
              </p>
              <Card className="p-4 border-primary/20 bg-primary/5">
                <p className="text-sm text-foreground">
                  <strong>Important :</strong> L'inscription sur la plateforme vaut acceptation pleine et entière 
                  des présentes CGU. Nous vous recommandons de les lire attentivement avant toute utilisation.
                </p>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Section 3 - Inscription */}
          <section id="inscription">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              3. Inscription et Compte Utilisateur
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">3.1 Conditions d'inscription</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Être âgé d'au moins 18 ans</li>
                <li>Fournir des informations exactes et complètes</li>
                <li>Disposer d'une adresse e-mail valide ou d'un numéro de téléphone</li>
                <li>Accepter les présentes CGU et notre Politique de Confidentialité</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">3.2 Sécurité du compte</h4>
              <p>
                Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes 
                les activités effectuées depuis votre compte. Vous vous engagez à nous signaler immédiatement 
                toute utilisation non autorisée de votre compte.
              </p>

              <h4 className="font-semibold text-foreground mt-4">3.3 Suspension et suppression</h4>
              <p>
                Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de violation 
                des présentes CGU, d'activité frauduleuse, ou à votre demande.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 4 - Services */}
          <section id="services">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              4. Services Proposés
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">4.1 Services gratuits</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Création d'un profil utilisateur</li>
                <li>Gestion d'un carnet de contacts avec dates importantes</li>
                <li>Réception de rappels d'anniversaires</li>
                <li>Création et participation à des cagnottes collectives</li>
                <li>Publication de messages de gratitude et célébration</li>
                <li>Consultation de la boutique en ligne</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">4.2 Services payants</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contributions aux cagnottes collectives</li>
                <li>Achats de produits auprès des vendeurs partenaires</li>
                <li>Frais de livraison (selon zones et vendeurs)</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">4.3 Comptes Vendeurs</h4>
              <p>
                Les professionnels peuvent créer un compte vendeur pour proposer leurs produits sur la 
                plateforme, sous réserve de validation par notre équipe.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 5 - Cagnottes */}
          <section id="cagnottes">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              5. Cagnottes Collectives
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">5.1 Création de cagnottes</h4>
              <p>
                Tout utilisateur inscrit peut créer une cagnotte pour une occasion spécifique (anniversaire, 
                mariage, promotion, etc.). Le créateur définit l'objectif, la date limite et le bénéficiaire.
              </p>

              <h4 className="font-semibold text-foreground mt-4">5.2 Contributions</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Les contributions sont volontaires et non remboursables (sauf cas exceptionnels)</li>
                <li>Les contributeurs peuvent choisir de rester anonymes</li>
                <li>Le montant minimum de contribution est de 500 FCFA</li>
                <li>Les contributions sont immédiates et irrévocables</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">5.3 Utilisation des fonds</h4>
              <p>
                Les fonds collectés sont destinés exclusivement à l'achat de cadeaux pour le bénéficiaire 
                désigné. Le créateur de la cagnotte est responsable de l'utilisation conforme des fonds.
              </p>

              <h4 className="font-semibold text-foreground mt-4">5.4 Cagnottes surprises</h4>
              <p>
                Les cagnottes surprises restent cachées du bénéficiaire jusqu'à la date de révélation 
                définie par le créateur.
              </p>

              <Card className="p-4 border-destructive/20 bg-destructive/5 mt-4">
                <p className="text-sm text-foreground">
                  <strong>⚠️ Attention :</strong> JOIE DE VIVRE n'est pas responsable de l'utilisation des 
                  fonds par le créateur de la cagnotte. En contribuant, vous acceptez ce risque.
                </p>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Section 6 - Paiements */}
          <section id="paiements">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              6. Achats et Paiements
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">6.1 Prix et devise</h4>
              <p>
                Tous les prix sont affichés en Francs CFA (XOF) et incluent les taxes applicables. 
                Les frais de livraison sont indiqués séparément avant la validation de la commande.
              </p>

              <h4 className="font-semibold text-foreground mt-4">6.2 Moyens de paiement</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-foreground">Orange Money</strong></li>
                <li><strong className="text-foreground">MTN Mobile Money</strong></li>
                <li><strong className="text-foreground">Paiement à la livraison</strong> (selon disponibilité)</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">6.3 Confirmation de commande</h4>
              <p>
                Une confirmation de commande vous est envoyée par e-mail et/ou notification après 
                validation du paiement. Cette confirmation vaut contrat de vente.
              </p>

              <h4 className="font-semibold text-foreground mt-4">6.4 Facturation</h4>
              <p>
                Une facture électronique est générée pour chaque transaction et accessible depuis 
                votre historique de commandes.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 7 - Livraison */}
          <section id="livraison">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              7. Livraison
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">7.1 Zones de livraison</h4>
              <p>
                La livraison est disponible principalement en Côte d'Ivoire. Les zones couvertes 
                dépendent de chaque vendeur partenaire et sont indiquées sur les fiches produits.
              </p>

              <h4 className="font-semibold text-foreground mt-4">7.2 Délais de livraison</h4>
              <p>
                Les délais de livraison sont estimatifs et varient selon le vendeur et la zone de 
                livraison. Ils sont communiqués avant la validation de la commande.
              </p>

              <h4 className="font-semibold text-foreground mt-4">7.3 Retrait en magasin</h4>
              <p>
                Certains vendeurs proposent le retrait en magasin. Les modalités sont précisées 
                lors de la commande.
              </p>

              <h4 className="font-semibold text-foreground mt-4">7.4 Responsabilité</h4>
              <p>
                La responsabilité de la livraison incombe au vendeur partenaire. JOIE DE VIVRE 
                facilite la mise en relation mais n'est pas responsable des retards ou problèmes 
                de livraison.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 8 - Retours */}
          <section id="retours">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              8. Droit de Rétractation et Retours
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">8.1 Produits éligibles</h4>
              <p>
                Le droit de rétractation s'applique dans un délai de 14 jours suivant la réception 
                du produit, pour les produits non personnalisés et en parfait état.
              </p>

              <h4 className="font-semibold text-foreground mt-4">8.2 Exclusions</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Produits personnalisés ou sur mesure</li>
                <li>Denrées périssables (gâteaux, fleurs fraîches, etc.)</li>
                <li>Produits descellés pour raisons d'hygiène</li>
                <li>Contributions aux cagnottes (non remboursables)</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">8.3 Procédure de retour</h4>
              <p>
                Pour effectuer un retour, contactez le vendeur directement via la plateforme ou 
                notre service client. Les frais de retour sont à la charge de l'acheteur sauf 
                en cas de produit défectueux ou non conforme.
              </p>

              <h4 className="font-semibold text-foreground mt-4">8.4 Remboursements</h4>
              <p>
                Les remboursements sont effectués via le même moyen de paiement utilisé lors 
                de l'achat, dans un délai de 14 jours suivant l'acceptation du retour.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 9 - Contenu */}
          <section id="contenu">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              9. Contenu Utilisateur
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">9.1 Responsabilité</h4>
              <p>
                Vous êtes entièrement responsable du contenu que vous publiez sur la plateforme 
                (messages, photos, commentaires, etc.).
              </p>

              <h4 className="font-semibold text-foreground mt-4">9.2 Contenu interdit</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contenu illégal, diffamatoire ou portant atteinte aux droits d'autrui</li>
                <li>Contenu à caractère discriminatoire, haineux ou violent</li>
                <li>Spam, publicité non autorisée ou contenus trompeurs</li>
                <li>Contenu à caractère sexuel ou inapproprié</li>
                <li>Usurpation d'identité</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">9.3 Modération</h4>
              <p>
                Nous nous réservons le droit de modérer, modifier ou supprimer tout contenu 
                contraire aux présentes CGU, sans préavis ni indemnité.
              </p>

              <h4 className="font-semibold text-foreground mt-4">9.4 Signalement</h4>
              <p>
                Tout utilisateur peut signaler un contenu inapproprié via les outils de signalement 
                intégrés à la plateforme.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 10 - Propriété Intellectuelle */}
          <section id="propriete">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Copyright className="h-5 w-5 text-primary" />
              10. Propriété Intellectuelle
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">10.1 Droits de JOIE DE VIVRE</h4>
              <p>
                La marque JOIE DE VIVRE, le logo, le design, les textes, images et tous les éléments 
                composant la plateforme sont la propriété exclusive d'AMTEY'S SARL et sont protégés 
                par les lois sur la propriété intellectuelle.
              </p>

              <h4 className="font-semibold text-foreground mt-4">10.2 Licence d'utilisation</h4>
              <p>
                Nous vous accordons une licence limitée, non exclusive et révocable pour utiliser 
                la plateforme conformément aux présentes CGU. Cette licence ne vous autorise pas à 
                copier, modifier, distribuer ou créer des œuvres dérivées.
              </p>

              <h4 className="font-semibold text-foreground mt-4">10.3 Contenu utilisateur</h4>
              <p>
                En publiant du contenu sur la plateforme, vous nous accordez une licence non exclusive, 
                mondiale et gratuite pour utiliser, reproduire et afficher ce contenu dans le cadre 
                du fonctionnement de la plateforme.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 11 - Responsabilité */}
          <section id="responsabilite">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              11. Limitation de Responsabilité
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">11.1 Exclusions</h4>
              <p>JOIE DE VIVRE ne peut être tenu responsable :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Des actes des utilisateurs ou vendeurs partenaires</li>
                <li>De l'utilisation des fonds des cagnottes par les créateurs</li>
                <li>Des interruptions de service dues à des maintenances ou pannes</li>
                <li>Des dommages indirects, perte de données ou manque à gagner</li>
                <li>De la qualité des produits vendus par les partenaires</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">11.2 Force majeure</h4>
              <p>
                Nous ne serons pas responsables des retards ou manquements résultant de cas de 
                force majeure (catastrophes naturelles, pannes, grèves, etc.).
              </p>

              <h4 className="font-semibold text-foreground mt-4">11.3 Plafond de responsabilité</h4>
              <p>
                En tout état de cause, notre responsabilité est limitée au montant des sommes 
                effectivement versées par l'utilisateur au cours des 12 derniers mois.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 12 - Données */}
          <section id="donnees">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              12. Protection des Données
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                La collecte et le traitement de vos données personnelles sont régis par notre 
                Politique de Confidentialité, accessible à l'adresse suivante :
              </p>
              
              <Card className="p-4 border-primary/20 bg-primary/5">
                <Link 
                  to="/privacy-policy" 
                  className="text-primary font-medium hover:underline flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  https://joiedevivre-africa.com/privacy-policy
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </Card>

              <p className="mt-4">
                En utilisant nos services, vous consentez au traitement de vos données conformément 
                à cette politique.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 13 - Litiges */}
          <section id="litiges">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              13. Règlement des Litiges
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">13.1 Réclamations</h4>
              <p>
                Pour toute réclamation, contactez notre service client par e-mail à 
                <a href="mailto:contact@joiedevivre-africa.com" className="text-primary hover:underline ml-1">
                  contact@joiedevivre-africa.com
                </a>. Nous nous engageons à vous répondre dans un délai de 48 heures ouvrées.
              </p>

              <h4 className="font-semibold text-foreground mt-4">13.2 Médiation</h4>
              <p>
                En cas de litige, nous vous invitons à rechercher une solution amiable avant 
                toute action judiciaire. Un médiateur pourra être désigné d'un commun accord.
              </p>

              <h4 className="font-semibold text-foreground mt-4">13.3 Juridiction compétente</h4>
              <p>
                Les présentes CGU sont régies par le droit ivoirien. En cas de litige non résolu 
                à l'amiable, les tribunaux d'Abidjan (Côte d'Ivoire) seront seuls compétents.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 14 - Modifications */}
          <section id="modifications">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              14. Modifications des CGU
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Nous nous réservons le droit de modifier les présentes CGU à tout moment. 
                Les modifications prennent effet dès leur publication sur la plateforme.
              </p>
              <p>
                En cas de modification substantielle, nous vous informerons par e-mail et/ou 
                notification dans l'application au moins 15 jours avant l'entrée en vigueur 
                des nouvelles conditions.
              </p>
              <p>
                La poursuite de l'utilisation de la plateforme après modification vaut acceptation 
                des nouvelles CGU.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 15 - Dispositions */}
          <section id="dispositions">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              15. Dispositions Générales
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <h4 className="font-semibold text-foreground">15.1 Nullité partielle</h4>
              <p>
                Si une disposition des présentes CGU est déclarée nulle ou inapplicable, les 
                autres dispositions restent en vigueur.
              </p>

              <h4 className="font-semibold text-foreground mt-4">15.2 Intégralité</h4>
              <p>
                Les présentes CGU constituent l'intégralité de l'accord entre vous et JOIE DE VIVRE 
                concernant l'utilisation de la plateforme.
              </p>

              <h4 className="font-semibold text-foreground mt-4">15.3 Renonciation</h4>
              <p>
                Le fait de ne pas exercer un droit prévu par les présentes CGU ne constitue pas 
                une renonciation à ce droit.
              </p>

              <h4 className="font-semibold text-foreground mt-4">15.4 Cession</h4>
              <p>
                Vous ne pouvez pas céder vos droits et obligations au titre des présentes CGU 
                sans notre accord préalable écrit.
              </p>
            </div>
          </section>

          <Separator />

          {/* Section 16 - Contact */}
          <section id="contact">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              16. Contact
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Pour toute question concernant les présentes CGU ou nos services, vous pouvez 
                nous contacter :
              </p>
              
              <Card className="p-6">
                <div className="grid gap-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">AMTEY'S SARL</p>
                      <p className="text-sm">Exploitant de la plateforme JOIE DE VIVRE</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-foreground">Anyama, Abidjan, Côte d'Ivoire</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href="mailto:contact@joiedevivre-africa.com" className="text-primary hover:underline">
                      contact@joiedevivre-africa.com
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href="tel:+2250546566646" className="text-primary hover:underline">
                      +225 0546566646
                    </a>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link to="/privacy-policy">
                  <Button variant="outline" className="gap-2">
                    <Shield className="h-4 w-4" />
                    Politique de Confidentialité
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Retour à l'accueil
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            © 2026 JOIE DE VIVRE - AMTEY'S SARL. Tous droits réservés.
          </p>
          <p className="mt-2">
            Conformément à la législation ivoirienne en vigueur relative au commerce électronique 
            et à la protection des consommateurs.
          </p>
        </div>
      </main>
    </div>
    </>
  );
};

export default TermsOfService;