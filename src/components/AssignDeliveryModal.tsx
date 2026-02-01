import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { 
  Truck, 
  Phone, 
  Star, 
  MapPin, 
  Bike, 
  Car, 
  CheckCircle,
  Loader2,
  Package
} from 'lucide-react';
import { useDeliveryPartners } from '@/hooks/useDeliveryPartners';
import { useOrderDelivery } from '@/hooks/useOrderDelivery';
import { DeliveryPartner, VEHICLE_TYPE_LABELS } from '@/types/delivery';

interface AssignDeliveryModalProps {
  orderId: string;
  orderAddress?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentComplete?: () => void;
}

export function AssignDeliveryModal({
  orderId,
  orderAddress,
  open,
  onOpenChange,
  onAssignmentComplete
}: AssignDeliveryModalProps) {
  const { partners, loading: loadingPartners } = useDeliveryPartners();
  const { assignPartner, loading: assigning } = useOrderDelivery();
  
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');

  const handleAssign = async () => {
    if (!selectedPartnerId) return;

    const success = await assignPartner({
      orderId,
      partnerId: selectedPartnerId,
      deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined,
      deliveryNotes: deliveryNotes || undefined,
      estimatedDeliveryTime: estimatedTime || undefined
    });

    if (success) {
      onOpenChange(false);
      onAssignmentComplete?.();
      // Reset form
      setSelectedPartnerId(null);
      setDeliveryFee('');
      setDeliveryNotes('');
      setEstimatedTime('');
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'moto':
        return <Bike className="h-4 w-4" />;
      case 'voiture':
        return <Car className="h-4 w-4" />;
      case 'camionnette':
        return <Truck className="h-4 w-4" />;
      default:
        return <Bike className="h-4 w-4" />;
    }
  };

  const renderPartnerCard = (partner: DeliveryPartner) => {
    const isSelected = selectedPartnerId === partner.id;
    
    return (
      <Card
        key={partner.id}
        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected 
            ? 'ring-2 ring-primary bg-primary/5' 
            : 'hover:border-primary/50'
        }`}
        onClick={() => setSelectedPartnerId(partner.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{partner.company_name}</span>
              {partner.is_verified && (
              <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Vérifié
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              {partner.contact_name}
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="flex items-center gap-1">
                {getVehicleIcon(partner.vehicle_type)}
                {VEHICLE_TYPE_LABELS[partner.vehicle_type] || partner.vehicle_type}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 text-gratitude fill-gratitude" />
                {partner.rating.toFixed(1)}
              </Badge>
              
              <Badge variant="outline" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {partner.total_deliveries} livraisons
              </Badge>
            </div>

            {partner.coverage_zones.length > 0 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {partner.coverage_zones.map(z => z.name).join(', ')}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <a 
              href={`tel:${partner.phone}`}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="h-3 w-3" />
              {partner.phone}
            </a>
            
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Assigner un livreur
          </DialogTitle>
          <DialogDescription>
            Sélectionnez un livreur partenaire pour cette commande
            {orderAddress && (
              <span className="block mt-1 text-xs">
                <MapPin className="h-3 w-3 inline mr-1" />
                {orderAddress}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loadingPartners ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement des livreurs...</span>
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun livreur disponible</p>
              <p className="text-sm">Ajoutez des livreurs partenaires pour commencer</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {partners.map(renderPartnerCard)}
              </div>
            </ScrollArea>
          )}
        </div>

        {selectedPartnerId && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-fee">Frais de livraison (XOF)</Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  placeholder="Ex: 1500"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimated-time">Temps estimé</Label>
                <Input
                  id="estimated-time"
                  type="text"
                  placeholder="Ex: 30-45 min"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-notes">Instructions pour le livreur</Label>
              <Textarea
                id="delivery-notes"
                placeholder="Instructions spéciales, code d'accès, etc."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selectedPartnerId || assigning}
          >
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Assignation...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Assigner le livreur
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
