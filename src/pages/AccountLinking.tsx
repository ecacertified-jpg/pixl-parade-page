import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountLinking, type AuthMethod } from '@/hooks/useAccountLinking';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Phone, 
  Mail, 
  Chrome, 
  Plus, 
  Check, 
  Shield, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Link2,
} from 'lucide-react';

const AccountLinking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { authMethods, loading, error, fetchAuthMethods, linkPhone } = useAccountLinking();
  
  const [showAddPhoneDialog, setShowAddPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [isLinking, setIsLinking] = useState(false);
  const [isGoogleLinking, setIsGoogleLinking] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAuthMethods();
    }
  }, [user, fetchAuthMethods]);

  const hasPhone = authMethods.some(m => m.type === 'phone');
  const hasGoogle = authMethods.some(m => m.type === 'google');

  const getMethodIcon = (type: AuthMethod['type']) => {
    switch (type) {
      case 'phone': return <Phone className="h-5 w-5" />;
      case 'google': return <Chrome className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
    }
  };

  const getMethodLabel = (type: AuthMethod['type']) => {
    switch (type) {
      case 'phone': return 'Téléphone';
      case 'google': return 'Google';
      case 'email': return 'Email';
    }
  };

  const handleAddPhone = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast({
        title: 'Numéro invalide',
        description: 'Veuillez entrer un numéro de téléphone valide',
        variant: 'destructive',
      });
      return;
    }

    setIsLinking(true);
    const fullPhone = `${countryCode}${phoneNumber}`;
    
    const result = await linkPhone(fullPhone);
    
    setIsLinking(false);
    
    if (result.success) {
      toast({
        title: 'Téléphone lié',
        description: 'Votre numéro de téléphone a été lié avec succès à votre compte',
      });
      setShowAddPhoneDialog(false);
      setPhoneNumber('');
    } else {
      toast({
        title: 'Erreur',
        description: result.error || 'Impossible de lier le numéro de téléphone',
        variant: 'destructive',
      });
    }
  };

  const handleAddGoogle = async () => {
    setIsGoogleLinking(true);
    
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/account-linking`,
        },
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.message || 'Impossible de lier le compte Google',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLinking(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <p>Veuillez vous connecter pour accéder à cette page.</p>
            <Button className="mt-4" onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Link2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Méthodes de connexion</CardTitle>
                <CardDescription>
                  Gérez les différentes façons de vous connecter à votre compte
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Méthodes actuelles */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Méthodes actives
                  </h3>
                  
                  {authMethods.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">
                      Aucune méthode de connexion configurée
                    </p>
                  ) : (
                    authMethods.map((method, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background rounded-lg">
                            {getMethodIcon(method.type)}
                          </div>
                          <div>
                            <p className="font-medium">{getMethodLabel(method.type)}</p>
                            {method.value && (
                              <p className="text-sm text-muted-foreground">
                                {method.type === 'phone' 
                                  ? method.value.replace(/(\+\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
                                  : method.value
                                }
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Vérifié
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                {/* Ajouter des méthodes */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Ajouter une méthode
                  </h3>
                  
                  <div className="grid gap-3">
                    {!hasPhone && (
                      <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-4"
                        onClick={() => setShowAddPhoneDialog(true)}
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Ajouter un téléphone</p>
                          <p className="text-sm text-muted-foreground">
                            Connectez-vous avec un code SMS
                          </p>
                        </div>
                        <Plus className="h-5 w-5 ml-auto" />
                      </Button>
                    )}

                    {!hasGoogle && (
                      <Button
                        variant="outline"
                        className="justify-start gap-3 h-auto py-4"
                        onClick={handleAddGoogle}
                        disabled={isGoogleLinking}
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Chrome className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Lier Google</p>
                          <p className="text-sm text-muted-foreground">
                            Connectez-vous avec votre compte Google
                          </p>
                        </div>
                        {isGoogleLinking ? (
                          <Loader2 className="h-5 w-5 ml-auto animate-spin" />
                        ) : (
                          <Plus className="h-5 w-5 ml-auto" />
                        )}
                      </Button>
                    )}

                    {hasPhone && hasGoogle && (
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">Compte sécurisé</p>
                        <p className="text-sm text-muted-foreground">
                          Vous avez configuré toutes les méthodes de connexion disponibles
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info sécurité */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex gap-3">
                    <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Conseil de sécurité</p>
                      <p className="text-sm text-muted-foreground">
                        Nous vous recommandons d'ajouter plusieurs méthodes de connexion 
                        pour sécuriser votre compte et éviter de perdre l'accès.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog pour ajouter un téléphone */}
      <Dialog open={showAddPhoneDialog} onOpenChange={setShowAddPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un numéro de téléphone</DialogTitle>
            <DialogDescription>
              Entrez votre numéro de téléphone pour le lier à votre compte
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+225">CI +225</SelectItem>
                    <SelectItem value="+33">FR +33</SelectItem>
                    <SelectItem value="+1">US +1</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="07 XX XX XX XX"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddPhoneDialog(false)}
              disabled={isLinking}
            >
              Annuler
            </Button>
            <Button onClick={handleAddPhone} disabled={isLinking}>
              {isLinking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Liaison en cours...
                </>
              ) : (
                'Lier le téléphone'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountLinking;
