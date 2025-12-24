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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Gift, 
  FolderOpen,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Business } from "@/types/business";

interface CascadeDeleteBusinessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business;
  onDeleted: () => void;
}

interface LinkedData {
  products: { count: number; ids: string[] };
  orders: { count: number };
  funds: { 
    total: number; 
    withContributions: number; 
    withoutContributions: number;
    idsToDelete: string[];
    idsToDisassociate: string[];
  };
  categories: { count: number };
}

export function CascadeDeleteBusinessModal({ 
  open, 
  onOpenChange, 
  business, 
  onDeleted 
}: CascadeDeleteBusinessModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [linkedData, setLinkedData] = useState<LinkedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  
  const [confirmations, setConfirmations] = useState({
    orders: false,
    products: false,
    funds: false,
    irreversible: false,
  });
  
  const [confirmName, setConfirmName] = useState("");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep(1);
      setConfirmations({ orders: false, products: false, funds: false, irreversible: false });
      setConfirmName("");
      setDeleteProgress(0);
      setCurrentAction("");
      loadLinkedData();
    }
  }, [open, business.id]);

  const loadLinkedData = async () => {
    setLoading(true);
    try {
      // Fetch products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', business.id);

      // Fetch orders
      const { data: orders } = await supabase
        .from('business_orders')
        .select('id')
        .eq('business_account_id', business.id);

      // Fetch funds with contributions count
      const { data: funds } = await supabase
        .from('collective_funds')
        .select(`
          id,
          fund_contributions(id)
        `)
        .eq('created_by_business_id', business.id);

      // Fetch categories
      const { data: categories } = await supabase
        .from('business_categories')
        .select('id')
        .eq('business_owner_id', business.user_id);

      // Process funds data
      const fundsWithContributions: string[] = [];
      const fundsWithoutContributions: string[] = [];
      
      funds?.forEach(fund => {
        const contribCount = Array.isArray(fund.fund_contributions) ? fund.fund_contributions.length : 0;
        if (contribCount > 0) {
          fundsWithContributions.push(fund.id);
        } else {
          fundsWithoutContributions.push(fund.id);
        }
      });

      setLinkedData({
        products: { 
          count: products?.length || 0, 
          ids: products?.map(p => p.id) || [] 
        },
        orders: { count: orders?.length || 0 },
        funds: {
          total: funds?.length || 0,
          withContributions: fundsWithContributions.length,
          withoutContributions: fundsWithoutContributions.length,
          idsToDelete: fundsWithoutContributions,
          idsToDisassociate: fundsWithContributions,
        },
        categories: { count: categories?.length || 0 },
      });
    } catch (error) {
      console.error('Error loading linked data:', error);
      toast.error("Erreur lors du chargement des données liées");
    } finally {
      setLoading(false);
    }
  };

  const allConfirmationsChecked = 
    confirmations.orders && 
    confirmations.products && 
    confirmations.funds && 
    confirmations.irreversible;

  const nameMatches = confirmName.trim().toLowerCase() === business.business_name.trim().toLowerCase();

  const handleCascadeDelete = async () => {
    if (!linkedData) return;
    
    setIsDeleting(true);
    const toastId = toast.loading("Suppression en cascade en cours...");
    
    try {
      // Step 1: Delete product ratings (15%)
      setCurrentAction("Suppression des notes produits...");
      setDeleteProgress(5);
      
      if (linkedData.products.ids.length > 0) {
        await supabase
          .from('product_ratings')
          .delete()
          .in('product_id', linkedData.products.ids);
      }
      setDeleteProgress(15);

      // Step 2: Delete products (30%)
      setCurrentAction("Suppression des produits...");
      if (linkedData.products.count > 0) {
        await supabase
          .from('products')
          .delete()
          .eq('business_account_id', business.id);
      }
      setDeleteProgress(30);

      // Step 3: Delete categories (40%)
      setCurrentAction("Suppression des catégories...");
      if (linkedData.categories.count > 0) {
        await supabase
          .from('business_categories')
          .delete()
          .eq('business_owner_id', business.user_id);
      }
      setDeleteProgress(40);

      // Step 4: Disassociate funds with contributions (50%)
      setCurrentAction("Dissociation des cagnottes avec contributions...");
      if (linkedData.funds.idsToDisassociate.length > 0) {
        await supabase
          .from('collective_funds')
          .update({ created_by_business_id: null })
          .in('id', linkedData.funds.idsToDisassociate);
      }
      setDeleteProgress(50);

      // Step 5: Delete funds without contributions (60%)
      setCurrentAction("Suppression des cagnottes vides...");
      if (linkedData.funds.idsToDelete.length > 0) {
        // First delete fund comments
        await supabase
          .from('fund_comments')
          .delete()
          .in('fund_id', linkedData.funds.idsToDelete);
        
        // Then delete fund activities
        await supabase
          .from('fund_activities')
          .delete()
          .in('fund_id', linkedData.funds.idsToDelete);
        
        // Finally delete the funds
        await supabase
          .from('collective_funds')
          .delete()
          .in('id', linkedData.funds.idsToDelete);
      }
      setDeleteProgress(70);

      // Step 6: Delete orders (85%)
      setCurrentAction("Suppression des commandes...");
      if (linkedData.orders.count > 0) {
        await supabase
          .from('business_orders')
          .delete()
          .eq('business_account_id', business.id);
      }
      setDeleteProgress(85);

      // Step 7: Delete business account (100%)
      setCurrentAction("Suppression du business...");
      const { error } = await supabase
        .from('business_accounts')
        .delete()
        .eq('id', business.id);

      if (error) throw error;
      
      setDeleteProgress(100);
      setCurrentAction("Terminé !");
      
      toast.success(`✅ "${business.business_name}" et tous ses éléments ont été supprimés`, { id: toastId });
      
      setTimeout(() => {
        onOpenChange(false);
        onDeleted();
      }, 500);
      
    } catch (error) {
      console.error('Cascade delete error:', error);
      toast.error("Erreur lors de la suppression en cascade", { id: toastId });
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  };

  const renderStep1 = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Suppression en cascade de "{business.business_name}"
        </DialogTitle>
        <DialogDescription>
          Cette action supprimera DÉFINITIVEMENT tous les éléments liés à ce business.
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
              <Package className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.products.count} produit(s)</p>
                <p className="text-sm text-muted-foreground">Seront supprimés définitivement</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.orders.count} commande(s)</p>
                <p className="text-sm text-muted-foreground">Historique supprimé</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Gift className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.funds.total} cagnotte(s) collective(s)</p>
                {linkedData.funds.withContributions > 0 && (
                  <p className="text-sm text-amber-600">
                    ⚠️ {linkedData.funds.withContributions} avec contributions (seront dissociées, pas supprimées)
                  </p>
                )}
                {linkedData.funds.withoutContributions > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {linkedData.funds.withoutContributions} sans contributions (seront supprimées)
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FolderOpen className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{linkedData.categories.count} catégorie(s) personnalisée(s)</p>
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
            id="confirm-orders"
            checked={confirmations.orders}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, orders: checked === true }))
            }
          />
          <Label htmlFor="confirm-orders" className="cursor-pointer leading-relaxed">
            Je comprends que <strong>toutes les commandes</strong> seront supprimées et que 
            l'historique des ventes sera perdu.
          </Label>
        </div>

        <div className="flex items-start gap-3 p-3 border rounded-lg">
          <Checkbox 
            id="confirm-products"
            checked={confirmations.products}
            onCheckedChange={(checked) => 
              setConfirmations(prev => ({ ...prev, products: checked === true }))
            }
          />
          <Label htmlFor="confirm-products" className="cursor-pointer leading-relaxed">
            Je comprends que <strong>tous les produits</strong> et leurs notes/avis 
            seront supprimés définitivement.
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
            Je comprends que les <strong>cagnottes sans contributions</strong> seront 
            supprimées et celles avec contributions seront dissociées du business.
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
            Je comprends que cette action est <strong>IRRÉVERSIBLE</strong> et que 
            toutes les données seront perdues à jamais.
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
          🚨 CONFIRMATION FINALE
        </DialogTitle>
        <DialogDescription>
          Dernière étape avant la suppression définitive.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {isDeleting ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentAction}
            </div>
            <Progress value={deleteProgress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {deleteProgress}% - Ne fermez pas cette fenêtre
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Pour confirmer la suppression, tapez le nom exact du business :
            </p>
            <div className="p-3 bg-muted rounded-lg text-center font-mono font-medium">
              {business.business_name}
            </div>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Tapez le nom du business..."
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
          </>
        )}
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          disabled={isDeleting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleCascadeDelete}
          disabled={!nameMatches || isDeleting}
        >
          {isDeleting ? (
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
    <Dialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-destructive' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </DialogContent>
    </Dialog>
  );
}
