import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SEOHead, SEO_CONFIGS } from "@/components/SEOHead";
import { LegalBreadcrumb } from "@/components/breadcrumbs";
import { supabase } from "@/integrations/supabase/client";
import logoJV from "@/assets/logo-jv.svg";
import { COMPANY_INFO } from "@/config/appVersion";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  subject: z.string().min(1, "Veuillez sélectionner un sujet"),
  message: z.string().trim().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
});

type ContactFormData = z.infer<typeof contactSchema>;

const subjectOptions = [
  { value: "general", label: "Question générale" },
  { value: "technical", label: "Problème technique" },
  { value: "suggestion", label: "Suggestion d'amélioration" },
  { value: "partnership", label: "Partenariat / Collaboration" },
  { value: "business", label: "Devenir prestataire" },
  { value: "other", label: "Autre" },
];

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: COMPANY_INFO.email,
    href: `mailto:${COMPANY_INFO.email}`,
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: COMPANY_INFO.phone,
    href: `tel:${COMPANY_INFO.phone.replace(/\s/g, '')}`,
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: COMPANY_INFO.address,
    href: null,
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lun - Ven : 8h00 - 18h00",
    href: null,
  },
];

export default function Contact() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });

      if (error) throw error;

      toast.success("Message envoyé avec succès ! Nous vous répondrons rapidement.");
      form.reset();
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead {...SEO_CONFIGS.contact} />
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10">
        {/* Breadcrumb */}
        <LegalBreadcrumb page="contact" />

        {/* Header */}
        <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <img src={logoJV} alt="JOIE DE VIVRE" className="h-8 w-8" />
              <h1 className="text-title-section truncate">Contactez-nous</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Introduction */}
          <section className="text-center space-y-4">
            <h2 className="text-title-main">Comment pouvons-nous vous aider ?</h2>
            <p className="text-content text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est à votre disposition pour répondre à toutes vos questions 
              concernant les cagnottes collectives, les commandes ou l'utilisation de la plateforme.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Envoyez-nous un message
                </CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre nom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="votre@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un sujet" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjectOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez votre demande..."
                              className="min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Nos coordonnées</CardTitle>
                  <CardDescription>
                    Vous pouvez également nous joindre directement.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-primary/10">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-muted-foreground">{info.label}</p>
                        {info.href ? (
                          <a 
                            href={info.href}
                            className="text-content font-medium hover:text-primary transition-colors break-all"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="text-content font-medium">{info.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Company Info Card */}
              <Card className="shadow-card bg-gradient-to-br from-primary/5 to-secondary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <img src={logoJV} alt="" className="h-6 w-6" />
                    {COMPANY_INFO.name}
                  </CardTitle>
                  <CardDescription>{COMPANY_INFO.type}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    JOIE DE VIVRE est une plateforme de cadeaux collectifs qui célèbre 
                    les moments de bonheur en Afrique francophone.
                  </p>
                  <p>
                    Nous facilitons l'organisation de cagnottes pour les anniversaires, 
                    mariages, promotions et toutes les occasions spéciales.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Link */}
          <Card className="shadow-card text-center">
            <CardContent className="py-6">
              <p className="text-content text-muted-foreground mb-4">
                Consultez également notre Foire Aux Questions pour des réponses rapides.
              </p>
              <Button variant="outline" onClick={() => navigate("/faq")}>
                Voir la FAQ
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
