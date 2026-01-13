import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Users,
  Gift, 
  Heart,
  Bell,
  FileText,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSecureAdminActions } from "@/hooks/useSecureAdminActions";

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  onDeleted: () => void;
}

interface LinkedData {
  contacts: number;
  fundsCreated: number;
  fundsContributed: number;
  posts: number;
  favorites: number;
  notifications: number;
}

export function DeleteClientModal({ 
  open, 
  onOpenChange, 
  userId,
  userName,
  onDeleted 
}: DeleteClientModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [linkedData, setLinkedData] = useState<LinkedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  
  const [confirmations, setConfirmations] = useState({
    data: false,
    funds: false,
    irreversible: false,
  });
  
  const [confirmName, setConfirmName] = useState("");
  
  const { manageUser, isProcessing } = useSecureAdminActions();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open && userId) {
      setStep(1);
      setConfirmations({ data: false, funds: false, irreversible: false });
      setConfirmName("");
      setReason("");
      loadLinkedData();
    }
  }, [open, userId]);

  const loadLinkedData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Fetch contacts
      const { count: contactsCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch funds created
      const { count: fundsCreatedCount } = await supabase
        .from('collective_funds')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      // Fetch contributions
      const { count: contributionsCount } = await supabase
        .from('fund_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', userId);

      // Fetch posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch favorites
      const { count: favoritesCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Fetch notifications
      const { count: notificationsCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setLinkedData({
        contacts: contactsCount || 0,
        fundsCreated: fundsCreatedCount || 0,
        fundsContributed: contributionsCount || 0,
        posts: postsCount || 0,
        favorites: favoritesCount || 0,
        notifications: notificationsCount || 0,
      });
    } catch (error) {
      console.error('Error loading linked data:', error);
      toast.error("Erreur lors du chargement des données liées");
    } finally {
      setLoading(false);
    }
  };

  const allConfirmationsChecked = 
    confirmations.data && 
    confirmations.funds && 
    confirmations.irreversible;

  const nameMatches = confirmName.trim().toLowerCase() === userName.trim().toLowerCase();
  const canDelete = nameMatches && reason.trim().length >= 10;

  const handleDelete = () => {
    if (!userId || !canDelete) return;
    
    manageUser.mutate(
      {
        user_id: userId,
        action: 'delete',
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDeleted();
        }
      }
    );
  };

  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Supprimer le compte de "{userName}"
        </DialogTitle>
        <DialogDescription>
          Cette action supprimera définitivement le compte et impactera les données suivantes.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : linkedData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.contacts} contact(s)</p>
                <p className="text-sm text-muted-foreground">Seront orphelins</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Gift className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.fundsCreated} cagnotte(s) créée(s)</p>
                <p className="text-sm text-muted-foreground">Seront marquées sans créateur</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Gift className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.fundsContributed} contribution(s)</p>
                <p className="text-sm text-muted-foreground">Restent liées aux cagnottes</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.posts} publication(s)</p>
                <p className="text-sm text-muted-foreground">Seront masquées</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Heart className="h-5 w-5 text-pink-500" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.favorites} favori(s)</p>
                <p className="text-sm text-muted-foreground">Seront supprimés</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.notifications} notification(s)</p>
                <p className="text-sm text-muted-foreground">Seront supprimées</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Annuler
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => setStep(2)}
          disabled={loading}
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep2 = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Confirmation des conséquences
        </DialogTitle>
        <DialogDescription>
          Cochez chaque case pour confirmer que vous comprenez les conséquences.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox 
            id="confirm-data"
            checked={confirmations.data}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, data: checked === true }))
            }
          />
          <Label htmlFor="confirm-data" className="cursor-pointer leading-relaxed">
            Je comprends que les <strong>contacts, publications et favoris</strong> de cet utilisateur 
            seront impactés ou supprimés.
          </Label>
        </div>

        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox 
            id="confirm-funds"
            checked={confirmations.funds}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, funds: checked === true }))
            }
          />
          <Label htmlFor="confirm-funds" className="cursor-pointer leading-relaxed">
            Je comprends que les <strong>cagnottes créées</strong> seront marquées sans créateur 
            et que les contributions restent liées.
          </Label>
        </div>

        <div className="flex items-start gap-3 p-3 border border-destructive/50 bg-destructive/5 rounded-lg">
          <Checkbox 
            id="confirm-irreversible"
            checked={confirmations.irreversible}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, irreversible: checked === true }))
            }
          />
          <Label htmlFor="confirm-irreversible" className="cursor-pointer leading-relaxed text-destructive">
            Je comprends que cette action est <strong>définitive</strong> et ne peut pas être annulée.
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button 
          variant="destructive"
          onClick={() => setStep(3)}
          disabled={!allConfirmationsChecked}
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep3 = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          🗑️ CONFIRMATION FINALE
        </DialogTitle>
        <DialogDescription>
          Dernière étape avant la suppression définitive.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {isProcessing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Suppression en cours...
            </div>
            <Progress value={50} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Ne fermez pas cette fenêtre
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Raison de la suppression *</Label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi ce compte est supprimé (min. 10 caractères)..."
                rows={3}
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-sm text-destructive">
                  La raison doit contenir au moins 10 caractères
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Pour confirmer la suppression, tapez le nom exact de l'utilisateur :
              </p>
              <div className="p-3 bg-muted rounded-lg text-center font-mono font-medium">
                {userName}
              </div>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Tapez le nom de l'utilisateur..."
                className="text-center"
              />
              {confirmName && !nameMatches && (
                <p className="text-sm text-destructive text-center">
                  Le nom ne correspond pas exactement
                </p>
              )}
              {nameMatches && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Nom confirmé
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          disabled={isProcessing}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button 
          variant="destructive"
          onClick={handleDelete}
          disabled={!canDelete || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}
