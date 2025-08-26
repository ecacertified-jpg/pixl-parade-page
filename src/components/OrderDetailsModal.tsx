import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, Smartphone, MapPin, Truck, DollarSign, Package, Check, FileText } from "lucide-react";
import { toast } from "sonner";

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    total_amount: number;
    currency: string;
    status: string;
    created_at: string;
    delivery_address: any;
    notes: string;
    order_items: Array<{
      id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
  } | null;
}

export function OrderDetailsModal({ isOpen, onClose, order }: OrderDetailsModalProps) {
  if (!order) return null;

  const handleConfirmOrder = () => {
    toast.success(`Commande ${order.id.slice(0, 8)} confirmée avec succès !`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Détails de la commande #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations de contact */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Contacts
            </h3>
            <div className="space-y-3">
              {order.delivery_address?.donorPhone && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Donateur</p>
                      <p className="text-green-600 font-semibold">{order.delivery_address.donorPhone}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {order.delivery_address?.beneficiaryPhone && (
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Bénéficiaire</p>
                      <p className="text-purple-600 font-semibold">{order.delivery_address.beneficiaryPhone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Informations de livraison */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {order.delivery_address?.deliveryType === 'pickup' ? (
                <MapPin className="h-4 w-4" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Livraison
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Mode de livraison</p>
                  <p className="text-muted-foreground">
                    {order.delivery_address?.deliveryType === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}
                  </p>
                </div>
              </div>
              
              {order.delivery_address?.location && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Lieu de livraison</p>
                    <p className="text-muted-foreground">{order.delivery_address.location}</p>
                  </div>
                </div>
              )}

              {order.delivery_address?.address && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Adresse de livraison</p>
                    <p className="text-muted-foreground">{order.delivery_address.address}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Mode de paiement */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Paiement
            </h3>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Mode de paiement</p>
                <p className="text-blue-600 font-semibold">
                  {order.notes?.includes('Mobile Money') ? 'Mobile Money' : 'À la livraison/retrait'}
                </p>
              </div>
            </div>
          </Card>

          {/* Résumé de la commande */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Résumé de la commande
            </h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.total_price.toLocaleString()} {order.currency}</p>
                    <p className="text-sm text-muted-foreground">{item.unit_price.toLocaleString()} F/unité</p>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-xl font-bold text-primary">{order.total_amount.toLocaleString()} {order.currency}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Bouton de confirmation */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            <Button onClick={handleConfirmOrder} className="flex-1 bg-green-600 hover:bg-green-700">
              <Check className="h-4 w-4 mr-2" />
              Confirmer la commande
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}