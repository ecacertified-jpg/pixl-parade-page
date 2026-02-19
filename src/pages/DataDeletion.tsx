import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Database, ShieldCheck, Mail, Phone, Clock, Send, Settings, FileText, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { LegalBreadcrumb } from "@/components/breadcrumbs";
import logoJV from "@/assets/logo-jv.svg";

const DataDeletion = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Veuillez saisir votre adresse email.");
      return;
    }
    setIsSubmitting(true);
    // Simulated submission — ready for edge function integration
    setTimeout(() => {
      toast.success("Votre demande de suppression a été envoyée. Vous recevrez une confirmation par email sous 30 jours.");
      setEmail("");
      setReason("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <>
      <SEOHead {...SEO_CONFIGS.dataDeletion} />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
        {/* Breadcrumb */}
        <LegalBreadcrumb page="data-deletion" />

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
              Suppression des Données Utilisateur
            </h1>
            <p className="text-muted-foreground">
              Conformément aux exigences de protection des données personnelles
            </p>
          </div>

          {/* Introduction */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UserX className="h-5 w-5 text-primary" />
                Votre droit à la suppression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Chez <strong className="text-foreground">JOIE DE VIVRE</strong>, nous respectons votre droit à la suppression de vos données personnelles. Vous pouvez à tout moment demander la suppression de votre compte et des données associées.
              </p>
              <p>
                Cette page vous explique quelles données sont concernées, comment effectuer votre demande et les délais de traitement.
              </p>
            </CardContent>
          </Card>

          {/* Données supprimées */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="h-5 w-5 text-primary" />
                Données supprimées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Lors de la suppression de votre compte, les données suivantes seront définitivement effacées :
              </p>
              <ul className="space-y-2">
                {[
                  "Profil utilisateur (nom, prénom, photo, biographie)",
                  "Liste de contacts et rappels d'anniversaires",
                  "Contributions aux cagnottes collectives",
                  "Publications, commentaires et réactions",
                  "Notifications et préférences",
                  "Badges et scores de réciprocité",
                  "Favoris et boutiques suivies",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-muted-foreground">
                    <Trash2 className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Données conservées */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Données conservées (obligations légales)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Certaines données sont conservées conformément aux obligations légales :
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Transactions financières</p>
                    <p className="text-sm text-muted-foreground">
                      Conservées pendant <strong>5 ans</strong> (obligation fiscale et comptable)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Logs d'audit</p>
                    <p className="text-sm text-muted-foreground">
                      Conservés pendant <strong>1 an</strong> (sécurité et conformité)
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Ces données sont anonymisées et ne permettent plus de vous identifier directement.
              </p>
            </CardContent>
          </Card>

          {/* Comment demander */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-5 w-5 text-primary" />
                Comment demander la suppression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: <Settings className="h-5 w-5 text-primary" />,
                    title: "Depuis l'application",
                    desc: "Accédez à Paramètres > Confidentialité > Supprimer mon compte.",
                  },
                  {
                    icon: <Mail className="h-5 w-5 text-primary" />,
                    title: "Par email",
                    desc: (
                      <>
                        Envoyez un email à{" "}
                        <a href="mailto:contact@joiedevivre-africa.com" className="text-primary hover:underline font-medium">
                          contact@joiedevivre-africa.com
                        </a>{" "}
                        avec l'objet « Suppression de compte ».
                      </>
                    ),
                  },
                  {
                    icon: <Send className="h-5 w-5 text-primary" />,
                    title: "Via le formulaire ci-dessous",
                    desc: "Remplissez le formulaire de demande sur cette page.",
                  },
                ].map((method, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <div className="mt-0.5 shrink-0">{method.icon}</div>
                    <div>
                      <p className="font-medium text-foreground">{method.title}</p>
                      <p className="text-sm text-muted-foreground">{method.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formulaire */}
          <Card className="shadow-lg border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="h-5 w-5 text-primary" />
                Formulaire de demande de suppression
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email associée à votre compte *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motif de la suppression (optionnel)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Dites-nous pourquoi vous souhaitez supprimer vos données..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi en cours..." : "Envoyer ma demande de suppression"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Délais */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Clock className="h-5 w-5 text-primary" />
                Délais de traitement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Votre demande sera traitée dans un délai maximum de <strong className="text-foreground">30 jours</strong> à compter de sa réception.
              </p>
              <p>
                Une confirmation de suppression vous sera envoyée par email à l'adresse associée à votre compte.
              </p>
              <p>
                Pendant ce délai, vous pouvez annuler votre demande en nous contactant.
              </p>
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
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href="mailto:contact@joiedevivre-africa.com"
                      className="font-medium text-primary hover:underline"
                    >
                      contact@joiedevivre-africa.com
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

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t">
            <p>© 2026 JOIE DE VIVRE - Tous droits réservés.</p>
          </div>
        </main>
      </div>
    </>
  );
};

export default DataDeletion;
