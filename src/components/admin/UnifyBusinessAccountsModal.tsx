import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Search, Phone, Mail, MapPin, Store, Loader2, CheckCircle, 
  AlertTriangle, Star, GitMerge, Package, ShoppingBag, Gift,
  Shield, Power
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UnifyBusinessAccountsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMergeComplete?: () => void;
}

interface AccountData {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  birthday: string | null;
  avatar_url: string | null;
  created_at: string;
  is_suspended: boolean;
  email?: string;
  auth_provider?: string;
}

interface BusinessData {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  is_verified: boolean;
  status: string | null;
  created_at: string;
}

interface DataCount {
  contacts: number;
  funds: number;
  contributions: number;
  posts: number;
  orders: number;
  products: number;
}

interface DuplicateAccount {
  user_id: string;
  profile: AccountData;
  business?: BusinessData;
  auth_methods: string[];
  data_count: DataCount;
  created_at: string;
  last_active: string | null;
}

interface DuplicateGroup {
  confidence: 'high' | 'medium';
  match_criteria: string[];
  accounts: DuplicateAccount[];
  recommended_primary: string;
}

interface TransferLog {
  table: string;
  count: number;
  success: boolean;
  error?: string;
}

export function UnifyBusinessAccountsModal({ 
  open, 
  onOpenChange,
  onMergeComplete 
}: UnifyBusinessAccountsModalProps) {
  const [step, setStep] = useState<'search' | 'select' | 'confirm' | 'result'>('search');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<string | null>(null);
  const [mergeResult, setMergeResult] = useState<{
    success: boolean;
    totalTransferred: number;
    transferDetails: TransferLog[];
  } | null>(null);

  const resetModal = () => {
    setStep('search');
    setBusinessName('');
    setBusinessPhone('');
    setDuplicates([]);
    setSelectedPrimary(null);
    setMergeResult(null);
  };

  const handleClose = () => {
    resetModal();
    onOpenChange(false);
  };

  const handleSearch = async () => {
    if (!businessName && !businessPhone) {
      toast.error('Veuillez remplir au moins un critère de recherche');
      return;
    }

    setIsSearching(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Session expirée');
        return;
      }

      const response = await supabase.functions.invoke('detect-duplicate-accounts', {
        body: {
          type: 'business',
          business_name: businessName || undefined,
          business_phone: businessPhone || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      
      if (!result.duplicates || result.duplicates.length === 0) {
        toast.info(result.message || 'Aucun doublon trouvé');
        return;
      }

      setDuplicates(result.duplicates);
      setSelectedPrimary(result.duplicates[0].recommended_primary);
      setStep('select');
      toast.success(`${result.duplicates[0].accounts.length} comptes business correspondants trouvés`);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedPrimary || duplicates.length === 0) return;

    const accounts = duplicates[0].accounts;
    const secondaryAccounts = accounts.filter(a => a.user_id !== selectedPrimary);

    if (secondaryAccounts.length === 0) {
      toast.error('Sélectionnez au moins un compte secondaire à fusionner');
      return;
    }

    setIsMerging(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Session expirée');
        return;
      }

      let totalTransferred = 0;
      const allTransferDetails: TransferLog[] = [];

      // Merge each secondary account into the primary
      for (const secondary of secondaryAccounts) {
        const response = await supabase.functions.invoke('merge-user-accounts', {
          body: {
            primary_user_id: selectedPrimary,
            secondary_user_id: secondary.user_id,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        if (response.data?.total_items_transferred) {
          totalTransferred += response.data.total_items_transferred;
        }
        if (response.data?.transfer_details) {
          allTransferDetails.push(...response.data.transfer_details);
        }
      }

      setMergeResult({
        success: true,
        totalTransferred,
        transferDetails: allTransferDetails,
      });
      setStep('result');
      toast.success('Comptes business fusionnés avec succès');
      onMergeComplete?.();
    } catch (error: any) {
      console.error('Merge error:', error);
      toast.error(error.message || 'Erreur lors de la fusion');
    } finally {
      setIsMerging(false);
    }
  };

  const getAuthMethodIcon = (method: string) => {
    switch (method) {
      case 'phone':
        return <Phone className="h-3 w-3" />;
      case 'google':
        return <Mail className="h-3 w-3 text-blue-500" />;
      case 'email':
        return <Mail className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getAuthMethodLabel = (method: string) => {
    switch (method) {
      case 'phone': return 'Téléphone';
      case 'google': return 'Google';
      case 'email': return 'Email';
      default: return method;
    }
  };

  const renderBusinessCard = (account: DuplicateAccount, isRecommended: boolean) => {
    const isSelected = selectedPrimary === account.user_id;
    const profile = account.profile;
    const business = account.business;

    return (
      <div
        key={account.user_id}
        onClick={() => setSelectedPrimary(account.user_id)}
        className={cn(
          "p-4 rounded-lg border-2 cursor-pointer transition-all",
          isSelected 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-muted-foreground/50"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
              <Store className="h-6 w-6 text-muted-foreground" />
            </div>
            {isSelected && (
              <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5">
                <CheckCircle className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {business?.business_name || 'Sans nom'}
              </span>
              {isRecommended && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  <Star className="h-3 w-3 mr-1" />
                  Recommandé
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1">
              {business?.is_verified && (
                <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Shield className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              )}
              {business?.is_active ? (
                <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <Power className="h-3 w-3 mr-1" />
                  Actif
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  En attente
                </Badge>
              )}
              {business?.business_type && (
                <Badge variant="outline" className="text-xs">
                  {business.business_type}
                </Badge>
              )}
            </div>

            <div className="mt-3 p-2 rounded bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Propriétaire</p>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {(profile.first_name?.[0] || '') + (profile.last_name?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{profile.first_name} {profile.last_name}</span>
                <div className="flex gap-1 ml-auto">
                  {account.auth_methods.map(method => (
                    <Badge key={method} variant="outline" className="text-xs px-1">
                      {getAuthMethodIcon(method)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              {business?.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {business.phone}
                </div>
              )}
              {business?.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {business.email}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Package className="h-3 w-3" />
                {account.data_count.products} produits
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <ShoppingBag className="h-3 w-3" />
                {account.data_count.orders} commandes
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Gift className="h-3 w-3" />
                {account.data_count.funds} cagnottes
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-2">
              Créé le {format(new Date(account.created_at), 'dd/MM/yyyy', { locale: fr })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Unifier des comptes prestataires
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && "Recherchez des comptes business en double par nom ou téléphone"}
            {step === 'select' && "Sélectionnez le compte principal vers lequel fusionner les autres"}
            {step === 'confirm' && "Confirmez la fusion des comptes business"}
            {step === 'result' && "Résultat de la fusion"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-1">
          {step === 'search' && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom du business</Label>
                <Input
                  id="businessName"
                  placeholder="Ex: Pâtisserie Délices"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Téléphone du propriétaire</Label>
                <Input
                  id="businessPhone"
                  placeholder="Ex: +225 07 XX XX XX"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Critères de détection</p>
                    <p className="text-muted-foreground mt-1">
                      Les comptes business seront identifiés comme doublons s'ils partagent un nom 
                      similaire ou le même numéro de téléphone. Vous pouvez remplir un ou les deux critères.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'select' && duplicates.length > 0 && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-4 w-4" />
                {duplicates[0].accounts.length} compte(s) business correspondant(s) trouvé(s)
              </div>

              <div className="space-y-3">
                {duplicates[0].accounts.map((account) => 
                  renderBusinessCard(account, account.user_id === duplicates[0].recommended_primary)
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Action de fusion</p>
                    <p className="text-muted-foreground mt-1">
                      Toutes les données (produits, commandes, cagnottes) seront transférées vers le compte 
                      business sélectionné. Les comptes secondaires et leurs utilisateurs seront désactivés.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'confirm' && duplicates.length > 0 && selectedPrimary && (
            <div className="space-y-4 py-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">Confirmation requise</p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Vous allez fusionner {duplicates[0].accounts.length - 1} compte(s) business secondaire(s) 
                      vers le compte principal. Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Compte business principal :</p>
                {renderBusinessCard(
                  duplicates[0].accounts.find(a => a.user_id === selectedPrimary)!,
                  true
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Comptes à fusionner (seront désactivés) :</p>
                {duplicates[0].accounts
                  .filter(a => a.user_id !== selectedPrimary)
                  .map(account => (
                    <div key={account.user_id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Store className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {account.business?.business_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {account.profile.first_name} {account.profile.last_name} • 
                            {account.auth_methods.map(getAuthMethodLabel).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {step === 'result' && mergeResult && (
            <div className="space-y-4 py-4">
              <div className={cn(
                "rounded-lg p-4 border",
                mergeResult.success 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              )}>
                <div className="flex items-center gap-2">
                  {mergeResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <p className="font-medium">
                    {mergeResult.success ? 'Fusion réussie' : 'Fusion terminée avec des erreurs'}
                  </p>
                </div>
                <p className="text-sm mt-2 text-muted-foreground">
                  {mergeResult.totalTransferred} élément(s) transféré(s) au total
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-medium text-sm">Détails des transferts :</p>
                <div className="space-y-1">
                  {mergeResult.transferDetails
                    .filter(log => log.count > 0)
                    .map((log, index) => (
                      <div key={index} className="flex items-center justify-between text-sm py-1">
                        <span className="text-muted-foreground capitalize">{log.table.replace(/_/g, ' ')}</span>
                        <Badge variant={log.success ? "secondary" : "destructive"}>
                          {log.count}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'search' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleSearch} disabled={isSearching || (!businessName && !businessPhone)}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Rechercher
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>
                Retour
              </Button>
              <Button onClick={() => setStep('confirm')} disabled={!selectedPrimary}>
                Continuer
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                Retour
              </Button>
              <Button 
                onClick={handleMerge} 
                disabled={isMerging}
                variant="destructive"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fusion en cours...
                  </>
                ) : (
                  <>
                    <GitMerge className="mr-2 h-4 w-4" />
                    Confirmer la fusion
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
