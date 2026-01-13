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
import { cn } from "@/lib/utils";
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
  CheckCircle2,
  Database,
  Coins,
  ShieldAlert
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

// Configuration des cartes de données avec couleurs distinctes
const dataCardConfig = {
  contacts: {
    icon: Users,
    bgGradient: "from-violet-50 to-white dark:from-violet-950/30 dark:to-background",
    borderColor: "border-l-violet-500",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  fundsCreated: {
    icon: Gift,
    bgGradient: "from-amber-50 to-white dark:from-amber-950/30 dark:to-background",
    borderColor: "border-l-amber-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  fundsContributed: {
    icon: Coins,
    bgGradient: "from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background",
    borderColor: "border-l-emerald-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  posts: {
    icon: FileText,
    bgGradient: "from-blue-50 to-white dark:from-blue-950/30 dark:to-background",
    borderColor: "border-l-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  favorites: {
    icon: Heart,
    bgGradient: "from-pink-50 to-white dark:from-pink-950/30 dark:to-background",
    borderColor: "border-l-pink-500",
    iconBg: "bg-pink-100 dark:bg-pink-900/50",
    iconColor: "text-pink-600 dark:text-pink-400",
  },
  notifications: {
    icon: Bell,
    bgGradient: "from-purple-50 to-white dark:from-purple-950/30 dark:to-background",
    borderColor: "border-l-purple-500",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
};

// Composant de carte de données stylisée
interface DataCardProps {
  type: keyof typeof dataCardConfig;
  count: number;
  label: string;
  description: string;
}

function DataCard({ type, count, label, description }: DataCardProps) {
  const config = dataCardConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl border border-l-4 transition-all duration-200 hover:shadow-md",
      `bg-gradient-to-r ${config.bgGradient}`,
      config.borderColor,
      "border-gray-100 dark:border-gray-800"
    )}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
        config.iconBg
      )}>
        <Icon className={cn("h-5 w-5", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{count} {label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Composant d'indicateur de progression
interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300",
            s < currentStep 
              ? "bg-primary text-primary-foreground" 
              : s === currentStep 
                ? "bg-gradient-to-r from-pink-500 to-primary text-white shadow-lg" 
                : "bg-muted text-muted-foreground"
          )}>
            {s < currentStep ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              s
            )}
          </div>
          {s < 3 && (
            <div className={cn(
              "w-8 h-1 rounded-full transition-all duration-300",
              s < currentStep ? "bg-primary" : "bg-muted"
            )} />
          )}
        </div>
      ))}
    </div>
  );
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
      <StepIndicator currentStep={1} />
      
      <DialogHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-950/50 dark:to-pink-950/50 flex items-center justify-center mb-3">
          <Trash2 className="h-7 w-7 text-destructive" />
        </div>
        <DialogTitle className="text-xl font-semibold text-foreground">
          Supprimer le compte
        </DialogTitle>
        <p className="text-primary font-medium">"{userName}"</p>
        <DialogDescription className="mt-2">
          Cette action supprimera définitivement le compte et impactera les données suivantes.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Chargement des données...</p>
          </div>
        ) : linkedData ? (
          <div className="space-y-2">
            <DataCard 
              type="contacts"
              count={linkedData.contacts}
              label="contact(s)"
              description="Seront orphelins"
            />
            <DataCard 
              type="fundsCreated"
              count={linkedData.fundsCreated}
              label="cagnotte(s) créée(s)"
              description="Seront marquées sans créateur"
            />
            <DataCard 
              type="fundsContributed"
              count={linkedData.fundsContributed}
              label="contribution(s)"
              description="Restent liées aux cagnottes"
            />
            <DataCard 
              type="posts"
              count={linkedData.posts}
              label="publication(s)"
              description="Seront masquées"
            />
            <DataCard 
              type="favorites"
              count={linkedData.favorites}
              label="favori(s)"
              description="Seront supprimés"
            />
            <DataCard 
              type="notifications"
              count={linkedData.notifications}
              label="notification(s)"
              description="Seront supprimées"
            />
          </div>
        ) : null}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
          Annuler
        </Button>
        <Button 
          onClick={() => setStep(2)}
          disabled={loading}
          className="flex-1 sm:flex-none group bg-gradient-to-r from-pink-500 to-primary hover:from-pink-600 hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep2 = () => (
    <>
      <StepIndicator currentStep={2} />
      
      <DialogHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center mb-3">
          <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <DialogTitle className="text-xl font-semibold text-foreground">
          Confirmation des conséquences
        </DialogTitle>
        <DialogDescription className="mt-2">
          Cochez chaque case pour confirmer que vous comprenez les conséquences.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-4">
        <div className={cn(
          "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
          confirmations.data 
            ? "bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-200 dark:border-blue-800" 
            : "bg-card border-border hover:border-blue-200 dark:hover:border-blue-800"
        )}>
          <Checkbox 
            id="confirm-data"
            checked={confirmations.data}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, data: checked === true }))
            }
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-foreground">Données personnelles</span>
            </div>
            <Label htmlFor="confirm-data" className="cursor-pointer text-sm text-muted-foreground leading-relaxed">
              Les <strong className="text-foreground">contacts, publications et favoris</strong> de cet utilisateur 
              seront impactés ou supprimés.
            </Label>
          </div>
        </div>

        <div className={cn(
          "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
          confirmations.funds 
            ? "bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/30 dark:to-background border-amber-200 dark:border-amber-800" 
            : "bg-card border-border hover:border-amber-200 dark:hover:border-amber-800"
        )}>
          <Checkbox 
            id="confirm-funds"
            checked={confirmations.funds}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, funds: checked === true }))
            }
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Coins className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-foreground">Cagnottes & Contributions</span>
            </div>
            <Label htmlFor="confirm-funds" className="cursor-pointer text-sm text-muted-foreground leading-relaxed">
              Les <strong className="text-foreground">cagnottes créées</strong> seront marquées sans créateur 
              et les contributions restent liées.
            </Label>
          </div>
        </div>

        <div className={cn(
          "flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-200",
          confirmations.irreversible 
            ? "bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-red-300 dark:border-red-700" 
            : "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
        )}>
          <Checkbox 
            id="confirm-irreversible"
            checked={confirmations.irreversible}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, irreversible: checked === true }))
            }
            className="mt-0.5 border-destructive data-[state=checked]:bg-destructive"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">Action irréversible</span>
            </div>
            <Label htmlFor="confirm-irreversible" className="cursor-pointer text-sm text-destructive/80 leading-relaxed">
              Cette action est <strong className="text-destructive">définitive</strong> et ne peut pas être annulée.
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 sm:flex-none">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button 
          onClick={() => setStep(3)}
          disabled={!allConfirmationsChecked}
          className="flex-1 sm:flex-none group bg-gradient-to-r from-pink-500 to-primary hover:from-pink-600 hover:to-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          Continuer
          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderStep3 = () => (
    <>
      <StepIndicator currentStep={3} />
      
      <DialogHeader className="text-center pb-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-3 shadow-lg">
          <Trash2 className="h-7 w-7 text-white" />
        </div>
        <DialogTitle className="text-xl font-semibold text-destructive">
          CONFIRMATION FINALE
        </DialogTitle>
        <DialogDescription className="mt-2">
          Dernière étape avant la suppression définitive.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {isProcessing ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-950/50 dark:to-pink-950/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-destructive" />
              </div>
              <p className="font-medium text-foreground">Suppression en cours...</p>
            </div>
            <Progress value={50} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Ne fermez pas cette fenêtre
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="delete-reason" className="text-foreground font-medium">
                Raison de la suppression *
              </Label>
              <Textarea
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi ce compte est supprimé (min. 10 caractères)..."
                rows={3}
                className="resize-none"
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  La raison doit contenir au moins 10 caractères
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pour confirmer la suppression, tapez le nom exact de l'utilisateur :
              </p>
              <div className="p-4 bg-gradient-to-r from-muted to-muted/50 rounded-xl text-center">
                <p className="font-mono font-semibold text-lg text-foreground">
                  {userName}
                </p>
              </div>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder="Tapez le nom de l'utilisateur..."
                className="text-center font-medium"
              />
              {confirmName && !nameMatches && (
                <p className="text-sm text-destructive text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Le nom ne correspond pas exactement
                </p>
              )}
              {nameMatches && (
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg">
                  <CheckCircle2 className="h-4 w-4" />
                  Nom confirmé
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          disabled={isProcessing}
          className="flex-1 sm:flex-none"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button 
          variant="destructive"
          onClick={handleDelete}
          disabled={!canDelete || isProcessing}
          className="flex-1 sm:flex-none shadow-lg hover:shadow-xl transition-all duration-300"
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
