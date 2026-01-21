import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Search,
  User,
  Gift,
  CreditCard,
  ShoppingBag,
  Bell,
  HelpCircle,
  Mail,
  Phone,
} from "lucide-react";
import logoJV from "@/assets/logo-jv.svg";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { FAQPageSchema, BreadcrumbListSchema, HowToSchema } from "@/components/schema";
import { LegalBreadcrumb } from "@/components/breadcrumbs";
import { faqCategories as faqData, type FAQCategory as FAQCategoryData } from "@/data/faq-data";
import { howToGuides } from "@/data/howto-guides";

// Map icon names to actual icon components
const iconMap: Record<string, React.ElementType> = {
  User,
  Gift,
  CreditCard,
  ShoppingBag,
  Bell,
  HelpCircle,
};

// Transform data to include actual icon components
interface FAQCategory extends Omit<FAQCategoryData, 'iconName'> {
  icon: React.ElementType;
}

const faqCategories: FAQCategory[] = faqData.map(category => ({
  ...category,
  icon: iconMap[category.iconName] || HelpCircle,
}));

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = faqCategories
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const totalQuestions = faqCategories.reduce(
    (acc, cat) => acc + cat.items.length,
    0
  );

  // Extract all FAQ items for schema
  const allFaqs = faqCategories.flatMap(cat => cat.items);

  return (
    <>
    <SEOHead {...SEO_CONFIGS.faq} />
    <FAQPageSchema faqs={allFaqs} />
    <BreadcrumbListSchema items={[
      { name: "Accueil", path: "/" },
      { name: "Aide & FAQ", path: "/faq" }
    ]} />
    {/* HowTo Schemas for Rich Snippets */}
    {howToGuides.map(guide => (
      <HowToSchema key={guide.id} {...guide} />
    ))}
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
          <img src={logoJV} alt="JOIE DE VIVRE" className="h-10 w-auto" />
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Title Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Foire Aux Questions
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Trouvez rapidement les réponses à vos questions parmi nos{" "}
            {totalQuestions} questions les plus fréquentes
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher une question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        {/* FAQ Categories */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                      <category.icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {category.title}
                    </h2>
                    <span className="ml-auto text-sm text-muted-foreground">
                      {category.items.length} question
                      {category.items.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, index) => (
                      <AccordionItem
                        key={index}
                        value={`${category.id}-${index}`}
                        className="border-b last:border-0"
                      >
                        <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-muted/50">
                          <span className="pr-4">{item.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4 text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun résultat trouvé</p>
              <p className="text-sm mt-1">
                Essayez avec d'autres mots-clés ou contactez notre support
              </p>
            </div>
          </Card>
        )}

        {/* Contact Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Vous n'avez pas trouvé votre réponse ?
              </h3>
              <p className="text-muted-foreground">
                Notre équipe support est là pour vous aider
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" className="gap-2" asChild>
                  <a href="mailto:contact@joiedevivre-africa.com">
                    <Mail className="h-4 w-4" />
                    contact@joiedevivre-africa.com
                  </a>
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="tel:+2250546566646">
                    <Phone className="h-4 w-4" />
                    +225 05 465 666 46
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center space-y-4 pt-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Button variant="link" onClick={() => navigate("/terms-of-service")}>
              Conditions d'Utilisation
            </Button>
            <Button variant="link" onClick={() => navigate("/privacy-policy")}>
              Politique de Confidentialité
            </Button>
            <Button variant="link" onClick={() => navigate("/legal-notice")}>
              Mentions Légales
            </Button>
            <Button variant="link" onClick={() => navigate("/about")}>
              À propos
            </Button>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
          <p className="text-xs text-muted-foreground">
            Dernière mise à jour : Janvier 2026
          </p>
        </div>
      </main>
    </div>
    </>
  );
}
