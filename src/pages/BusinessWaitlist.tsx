import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Store, CheckCircle, Clock, ArrowLeft, Sparkles, Gift, Users, TrendingUp, LogIn, Share2 } from 'lucide-react';
import logoJV from '@/assets/logo-jv.png';

const businessTypes = [
  { value: 'bakery', label: 'Pâtisserie / Boulangerie' },
  { value: 'florist', label: 'Fleuriste' },
  { value: 'jewelry', label: 'Bijouterie' },
  { value: 'fashion', label: 'Mode / Vêtements' },
  { value: 'beauty', label: 'Beauté / Spa' },
  { value: 'restaurant', label: 'Restaurant / Traiteur' },
  { value: 'electronics', label: 'Électronique' },
  { value: 'home_decor', label: 'Décoration / Maison' },
  { value: 'toys', label: 'Jouets / Enfants' },
  { value: 'experiences', label: 'Expériences / Activités' },
  { value: 'other', label: 'Autre' },
];

const benefits = [
  {
    icon: Gift,
    title: 'Visibilité sur les wishlists',
    description: 'Vos produits apparaissent dans les listes de souhaits des utilisateurs'
  },
  {
    icon: Users,
    title: 'Cagnottes collectives',
    description: 'Bénéficiez des cagnottes créées pour offrir vos produits'
  },
  {
    icon: TrendingUp,
    title: 'Alertes anniversaire',
    description: 'Recevez des alertes quand un client potentiel fête son anniversaire'
  },
  {
    icon: Sparkles,
    title: 'Dashboard complet',
    description: 'Gérez vos produits, commandes et statistiques facilement'
  }
];

export default function BusinessWaitlist() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    business_name: '',
    business_type: '',
    phone: '',
    contact_first_name: '',
    contact_last_name: '',
    city: '',
    motivation: '',
  });

  // Celebration effect on success
  useEffect(() => {
    if (submitted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.business_name || !formData.contact_first_name || !formData.contact_last_name) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_waitlist')
        .insert({
          email: formData.email.toLowerCase().trim(),
          business_name: formData.business_name.trim(),
          business_type: formData.business_type || null,
          phone: formData.phone || null,
          contact_first_name: formData.contact_first_name.trim(),
          contact_last_name: formData.contact_last_name.trim(),
          city: formData.city || null,
          motivation: formData.motivation || null,
        })
        .select('position')
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Cette adresse email est déjà inscrite sur la liste d\'attente');
        } else {
          throw error;
        }
        return;
      }

      setPosition(data.position);
      setSubmitted(true);
      toast.success('Inscription réussie !');

      // Notify super admins via Edge Function
      try {
        await supabase.functions.invoke('notify-waitlist-registration', {
          body: {
            waitlist_entry: {
              email: formData.email.toLowerCase().trim(),
              business_name: formData.business_name.trim(),
              business_type: formData.business_type || null,
              contact_first_name: formData.contact_first_name.trim(),
              contact_last_name: formData.contact_last_name.trim(),
              city: formData.city || null,
              motivation: formData.motivation || null,
              phone: formData.phone || null,
              position: data.position
            }
          }
        });
        console.log('Super admins notified of new waitlist registration');
      } catch (notifyError) {
        console.error('Failed to notify super admins:', notifyError);
      }
    } catch (error: any) {
      console.error('Error submitting waitlist:', error);
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const message = `🎁 Je viens de m'inscrire sur JOIE DE VIVRE pour développer mon activité ! Rejoins-moi : ${window.location.href}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md w-full text-center shadow-lg">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <CardTitle className="text-2xl">Inscription réussie ! 🎉</CardTitle>
              <CardDescription className="text-base">
                Merci pour votre intérêt à rejoindre JOIE DE VIVRE
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {position && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-primary/10 rounded-xl p-4"
                >
                  <p className="text-sm text-muted-foreground">Votre position dans la file d'attente</p>
                  <p className="text-4xl font-bold text-primary">#{position}</p>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-muted/50 rounded-xl p-4 text-left space-y-2"
              >
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Prochaines étapes
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nous examinons votre demande</li>
                  <li>• Vous recevrez un email d'invitation</li>
                  <li>• Créez votre compte et accédez à votre espace</li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Button onClick={handleShare} variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button onClick={() => navigate('/')} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-4">
        <div className="container max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate('/')} className="flex items-center">
              <img src={logoJV} alt="JOIE DE VIVRE" className="h-8 sm:h-10" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/business-auth')}>
            <LogIn className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Déjà inscrit ?</span>
          </Button>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-6 sm:py-8">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Form first on mobile */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="order-1 md:order-2"
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-primary">Liste d'attente</span>
                </div>
                <CardTitle>Inscrivez-vous</CardTitle>
                <CardDescription>
                  Remplissez ce formulaire pour rejoindre notre liste d'attente. 
                  Nous vous contacterons rapidement.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_first_name">Prénom *</Label>
                      <Input
                        id="contact_first_name"
                        value={formData.contact_first_name}
                        onChange={(e) => setFormData({ ...formData, contact_first_name: e.target.value })}
                        placeholder="Votre prénom"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_last_name">Nom *</Label>
                      <Input
                        id="contact_last_name"
                        value={formData.contact_last_name}
                        onChange={(e) => setFormData({ ...formData, contact_last_name: e.target.value })}
                        placeholder="Votre nom"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contact@votrebusiness.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+225 XX XX XX XX XX"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_name">Nom de votre entreprise *</Label>
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="Ex: Pâtisserie Délices d'Abidjan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_type">Type d'activité</Label>
                    <Select
                      value={formData.business_type}
                      onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre activité" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ex: Abidjan, Cocody"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivation">Pourquoi voulez-vous rejoindre JDV ?</Label>
                    <Textarea
                      id="motivation"
                      value={formData.motivation}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      placeholder="Parlez-nous de votre activité et de vos attentes..."
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Inscription en cours...' : 'Rejoindre la liste d\'attente'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En vous inscrivant, vous acceptez nos conditions d'utilisation 
                    et notre politique de confidentialité.
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Benefits second on mobile */}
          <div className="order-2 md:order-1 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-poppins mb-3">
                Devenez partenaire <span className="text-primary">JOIE DE VIVRE</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground">
                Rejoignez notre réseau de prestataires et touchez des milliers de clients 
                à la recherche du cadeau parfait.
              </p>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex gap-3 sm:gap-4 items-start bg-card rounded-xl p-3 sm:p-4 border 
                             shadow-sm hover:shadow-md transition-all cursor-default"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary/20 to-primary/5 
                                  rounded-xl flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm sm:text-base">{benefit.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust badge */}
            <motion.div 
              className="flex items-center gap-2 text-sm text-muted-foreground pt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Rejoignez les entreprises qui nous font confiance</span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
