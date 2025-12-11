import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, X, MapPin, Phone, CreditCard, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { CustomerOrder } from "@/hooks/useCustomerOrders";

interface OrderInvoiceModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">En attente</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
    case 'delivered':
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Livrée</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Annulée</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Paiement à la livraison';
    case 'mobile_money':
      return 'Mobile Money';
    case 'card':
      return 'Carte bancaire';
    default:
      return method;
  }
};

export const OrderInvoiceModal = ({ order, isOpen, onClose }: OrderInvoiceModalProps) => {
  if (!order) return null;

  const handleDownload = () => {
    // Simple text-based invoice for now
    const invoiceText = `
JOIE DE VIVRE - FACTURE
========================

N° Commande: ${order.orderNumber.substring(0, 8).toUpperCase()}
Date: ${format(order.date, "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
Statut: ${order.status}

ARTICLES
--------
${order.items.map(item => `${item.name} x${item.quantity} - ${item.price.toLocaleString()} ${order.currency}`).join('\n')}

TOTAL: ${order.totalAmount.toLocaleString()} ${order.currency}

LIVRAISON
---------
Adresse: ${order.deliveryAddress}
Téléphone donneur: ${order.donorPhone}
Téléphone bénéficiaire: ${order.beneficiaryPhone}
Paiement: ${getPaymentMethodLabel(order.paymentMethod)}

Merci pour votre confiance !
    `;

    const blob = new Blob([invoiceText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${order.orderNumber.substring(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">JOIE DE VIVRE</DialogTitle>
          <p className="text-muted-foreground text-sm">FACTURE</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">N° Commande</span>
              <span className="font-mono text-sm font-medium">#{order.orderNumber.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Date</span>
              <span className="text-sm">{format(order.date, "dd MMM yyyy 'à' HH:mm", { locale: fr })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Statut</span>
              {getStatusBadge(order.status)}
            </div>
            {order.businessName && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Boutique</span>
                <span className="text-sm font-medium">{order.businessName}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles
            </h4>
            <div className="space-y-3">
              {order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center bg-muted/20 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm">{(item.price * item.quantity).toLocaleString()} {order.currency}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">Détails non disponibles</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sous-total</span>
              <span className="text-sm">{order.totalAmount.toLocaleString()} {order.currency}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm text-muted-foreground">Livraison</span>
              <span className="text-sm text-green-600">Gratuite</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground">TOTAL</span>
              <span className="font-bold text-lg text-primary">{order.totalAmount.toLocaleString()} {order.currency}</span>
            </div>
          </div>

          <Separator />

          {/* Delivery Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Informations de livraison</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{order.deliveryAddress}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Donneur: {order.donorPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>Bénéficiaire: {order.beneficiaryPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
