import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Store, CheckCircle, Clock, ArrowLeft, Sparkles, Gift, Users, TrendingUp } from 'lucide-react';
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
    } catch (error: any) {
      console.error('Error submitting waitlist:', error);
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Inscription réussie !</CardTitle>
            <CardDescription className="text-base">
              Merci pour votre intérêt à rejoindre JOIE DE VIVRE
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {position && (
              <div className="bg-primary/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Votre position dans la file d'attente</p>
                <p className="text-4xl font-bold text-primary">#{position}</p>
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Prochaines étapes
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Nous examinons votre demande</li>
                <li>• Vous recevrez un email d'invitation</li>
                <li>• Créez votre compte et accédez à votre espace</li>
              </ul>
            </div>

            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <img src={logoJV} alt="JOIE DE VIVRE" className="h-10" />
        </button>
        <Button variant="ghost" onClick={() => navigate('/business-auth')}>
          Déjà inscrit ? Se connecter
        </Button>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Benefits */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-poppins mb-3">
                Devenez partenaire <span className="text-primary">JOIE DE VIVRE</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Rejoignez notre réseau de prestataires et touchez des milliers de clients 
                à la recherche du cadeau parfait.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 items-start bg-card rounded-lg p-4 border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Visibilité sur les wishlists</h3>
                  <p className="text-sm text-muted-foreground">
                    Vos produits apparaissent dans les listes de souhaits des utilisateurs
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-card rounded-lg p-4 border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Cagnottes collectives</h3>
                  <p className="text-sm text-muted-foreground">
                    Bénéficiez des cagnottes créées pour offrir vos produits
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-card rounded-lg p-4 border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Alertes anniversaire</h3>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes quand un client potentiel fête son anniversaire
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-card rounded-lg p-4 border">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Dashboard complet</h3>
                  <p className="text-sm text-muted-foreground">
                    Gérez vos produits, commandes et statistiques facilement
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <Card>
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
                <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>
    </div>
  );
}
