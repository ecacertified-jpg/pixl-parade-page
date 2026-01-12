import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, Check, ArrowRight, Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface MergeAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrimaryUser?: UserProfile | null;
  onMergeComplete: () => void;
}

interface TransferLog {
  table: string;
  count: number;
  success: boolean;
  error?: string;
}

export function MergeAccountsModal({ 
  isOpen, 
  onClose, 
  initialPrimaryUser,
  onMergeComplete 
}: MergeAccountsModalProps) {
  const [step, setStep] = useState<'search' | 'confirm' | 'result'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [primaryUser, setPrimaryUser] = useState<UserProfile | null>(initialPrimaryUser || null);
  const [secondaryUser, setSecondaryUser] = useState<UserProfile | null>(null);
  const [mergeResult, setMergeResult] = useState<{
    success: boolean;
    totalTransferred: number;
    details: TransferLog[];
  } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, phone, avatar_url, created_at')
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .eq('is_suspended', false)
        .limit(10);

      if (error) throw error;

      // Filter out already selected users
      const filtered = (data || []).filter(u => 
        u.user_id !== primaryUser?.user_id && 
        u.user_id !== secondaryUser?.user_id
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const selectUser = (user: UserProfile, role: 'primary' | 'secondary') => {
    if (role === 'primary') {
      setPrimaryUser(user);
    } else {
      setSecondaryUser(user);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const swapUsers = () => {
    const temp = primaryUser;
    setPrimaryUser(secondaryUser);
    setSecondaryUser(temp);
  };

  const handleMerge = async () => {
    if (!primaryUser || !secondaryUser) return;
    
    setIsMerging(true);
    try {
      const { data, error } = await supabase.functions.invoke('merge-user-accounts', {
        body: {
          primary_user_id: primaryUser.user_id,
          secondary_user_id: secondaryUser.user_id
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMergeResult({
        success: data.success,
        totalTransferred: data.total_items_transferred,
        details: data.transfer_details
      });
      setStep('result');
      
      if (data.success) {
        toast.success('Comptes fusionnés avec succès');
        onMergeComplete();
      }
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Erreur lors de la fusion des comptes');
    } finally {
      setIsMerging(false);
    }
  };

  const resetModal = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setPrimaryUser(initialPrimaryUser || null);
    setSecondaryUser(null);
    setMergeResult(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderUserCard = (user: UserProfile | null, label: string, onRemove?: () => void) => (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{label}</Label>
        {onRemove && user && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Changer
          </Button>
        )}
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-muted-foreground">{user.phone || 'Pas de téléphone'}</p>
            <p className="text-xs text-muted-foreground">
              Créé: {new Date(user.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun utilisateur sélectionné</p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fusionner des comptes
          </DialogTitle>
          <DialogDescription>
            {step === 'search' && 'Sélectionnez les deux comptes à fusionner. Le compte secondaire sera désactivé.'}
            {step === 'confirm' && 'Vérifiez les comptes sélectionnés avant de confirmer la fusion.'}
            {step === 'result' && 'Résultat de la fusion des comptes.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            {/* Primary User */}
            {renderUserCard(primaryUser, 'Compte principal (conservé)', () => setPrimaryUser(null))}

            {/* Arrow between users */}
            {primaryUser && secondaryUser && (
              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={swapUsers}>
                  <ArrowRight className="h-4 w-4 rotate-90" />
                  Inverser
                </Button>
              </div>
            )}

            {/* Secondary User */}
            {renderUserCard(secondaryUser, 'Compte secondaire (à fusionner)', () => setSecondaryUser(null))}

            {/* Search */}
            {(!primaryUser || !secondaryUser) && (
              <div className="space-y-2">
                <Label>Rechercher un utilisateur</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nom, prénom ou téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-muted-foreground">{user.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          {!primaryUser && (
                            <Button size="sm" variant="outline" onClick={() => selectUser(user, 'primary')}>
                              Principal
                            </Button>
                          )}
                          {!secondaryUser && (
                            <Button size="sm" variant="secondary" onClick={() => selectUser(user, 'secondary')}>
                              Secondaire
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action irréversible</AlertTitle>
              <AlertDescription>
                Toutes les données du compte secondaire seront transférées vers le compte principal.
                Le compte secondaire sera désactivé.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              {renderUserCard(primaryUser, 'Compte principal (conservé)')}
              <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />
              </div>
              {renderUserCard(secondaryUser, 'Compte secondaire (sera désactivé)')}
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Données qui seront transférées :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Contacts</li>
                <li>Cagnottes (créées et contributions)</li>
                <li>Publications et commentaires</li>
                <li>Notifications</li>
                <li>Favoris et badges</li>
                <li>Compte business (si existant)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'result' && mergeResult && (
          <div className="space-y-4">
            <Alert variant={mergeResult.success ? 'default' : 'destructive'}>
              {mergeResult.success ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertTitle>
                {mergeResult.success ? 'Fusion réussie' : 'Fusion terminée avec des erreurs'}
              </AlertTitle>
              <AlertDescription>
                {mergeResult.totalTransferred} éléments transférés
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg divide-y max-h-48 overflow-auto">
              {mergeResult.details.map((log, index) => (
                <div key={index} className="p-2 flex items-center justify-between text-sm">
                  <span className="capitalize">{log.table.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={log.success ? 'default' : 'destructive'}>
                      {log.count} transférés
                    </Badge>
                    {log.success ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'search' && (
            <>
              <Button variant="outline" onClick={handleClose}>Annuler</Button>
              <Button 
                onClick={() => setStep('confirm')} 
                disabled={!primaryUser || !secondaryUser}
              >
                Continuer
              </Button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('search')}>Retour</Button>
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
                  'Confirmer la fusion'
                )}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>Fermer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
