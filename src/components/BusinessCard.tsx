import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Store, MapPin, Phone, Clock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Business } from "@/types/business";
import { ManageFundsBeforeDeleteModal, type AssociatedFund } from "./ManageFundsBeforeDeleteModal";

interface BusinessCardProps {
  business: Business;
  onEdit: (business: Business) => void;
  onDeleted: () => void;
}

export function BusinessCard({ business, onEdit, onDeleted }: BusinessCardProps) {
  const [loading, setLoading] = useState(false);
  const [showFundsModal, setShowFundsModal] = useState(false);
  const [associatedFunds, setAssociatedFunds] = useState<AssociatedFund[]>([]);

  const getTodaySchedule = () => {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();
    const schedule = business.opening_hours[today];
    
    if (!schedule || schedule.closed) {
      return "Fermé aujourd'hui";
    }
    
    return `${schedule.open} - ${schedule.close}`;
  };

  const getActiveZones = () => {
    return business.delivery_zones.filter(zone => zone.active !== false).length;
  };

  const handleDelete = async () => {
    if (!confirm(
      `⚠️ ATTENTION\n\n` +
      `Êtes-vous sûr de vouloir supprimer "${business.business_name}" ?\n\n` +
      `Cette action sera bloquée si le business a :\n` +
      `- Des produits associés\n` +
      `- Des commandes associées\n` +
      `- Des cagnettes collectives associées\n\n` +
      `Cette action est IRRÉVERSIBLE.\n\n` +
      `Confirmez-vous la suppression ?`
    )) {
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Vérification des dépendances...");
    
    try {
      // Check if business has associated products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', business.id)
        .limit(1);

      if (productsError) throw productsError;

      // Check if business has associated orders
      const { data: orders, error: ordersError } = await supabase
        .from('business_orders')
        .select('id')
        .eq('business_account_id', business.id)
        .limit(1);

      if (ordersError) throw ordersError;

      // Check if business has associated collective funds with contribution counts
      const { data: funds, error: fundsError } = await supabase
        .from('collective_funds')
        .select(`
          id,
          title,
          current_amount,
          target_amount,
          status,
          fund_contributions(id)
        `)
        .eq('created_by_business_id', business.id);

      if (fundsError) throw fundsError;

      if (products && products.length > 0) {
        toast.error("Impossible de supprimer : ce business a des produits associés", { id: toastId });
        return;
      }

      if (orders && orders.length > 0) {
        toast.error("Impossible de supprimer : ce business a des commandes associées", { id: toastId });
        return;
      }

      if (funds && funds.length > 0) {
        // Map funds with contribution counts and open modal
        const mappedFunds: AssociatedFund[] = funds.map((f) => ({
          id: f.id,
          title: f.title,
          current_amount: f.current_amount || 0,
          target_amount: f.target_amount,
          status: f.status || 'active',
          contributions_count: Array.isArray(f.fund_contributions) ? f.fund_contributions.length : 0,
        }));
        setAssociatedFunds(mappedFunds);
        setShowFundsModal(true);
        toast.dismiss(toastId);
        setLoading(false);
        return;
      }

      toast.loading("Suppression du business...", { id: toastId });

      const { error } = await supabase
        .from('business_accounts')
        .delete()
        .eq('id', business.id);

      if (error) throw error;

      toast.success("✅ Business supprimé de Config et du sélecteur", { id: toastId });
      onDeleted();
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error("Erreur lors de la suppression", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFundsManaged = async () => {
    // After funds are managed, proceed to delete the business
    setLoading(true);
    const toastId = toast.loading("Suppression du business...");

    try {
      const { error } = await supabase
        .from('business_accounts')
        .delete()
        .eq('id', business.id);

      if (error) throw error;

      toast.success("✅ Business supprimé avec succès", { id: toastId });
      onDeleted();
    } catch (error) {
      console.error('Error deleting business:', error);
      toast.error("Erreur lors de la suppression", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => onEdit(business)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{business.business_name}</h3>
            <p className="text-sm text-muted-foreground">{business.business_type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={business.is_active ? "default" : "secondary"}>
            {business.is_active ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {business.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{business.address}</span>
          </div>
        )}
        
        {business.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{business.phone}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{getTodaySchedule()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{getActiveZones()} zone(s) de livraison</span>
        </div>
      </div>

      {business.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {business.description}
        </p>
      )}

      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(business)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          disabled={loading}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <ManageFundsBeforeDeleteModal
        open={showFundsModal}
        onOpenChange={setShowFundsModal}
        businessId={business.id}
        businessName={business.business_name}
        funds={associatedFunds}
        onComplete={handleFundsManaged}
      />
    </Card>
  );
}