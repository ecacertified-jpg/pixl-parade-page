import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  Store, 
  User, 
  Star,
  XCircle,
  RefreshCw,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AdminOrder, getOrderStatusLabel, getOrderStatusColor } from '@/hooks/useAdminOrders';
import { AdminRefundModal } from './AdminRefundModal';
import { AdminCancelOrderModal } from './AdminCancelOrderModal';
import { AdminUpdateStatusModal } from './AdminUpdateStatusModal';

interface AdminOrderDetailsModalProps {
  order: AdminOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, newStatus: string, reason?: string) => Promise<void>;
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;
  onRefundOrder: (orderId: string, reason: string, amount?: number) => Promise<void>;
  onApproveRefund: (orderId: string) => Promise<void>;
  onRejectRefund: (orderId: string, reason: string) => Promise<void>;
}

export function AdminOrderDetailsModal({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  onCancelOrder,
  onRefundOrder,
  onApproveRefund,
  onRejectRefund
}: AdminOrderDetailsModalProps) {
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  if (!order) return null;

  const orderItems = Array.isArray(order.order_summary?.items) 
    ? order.order_summary.items 
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const canCancel = ['pending', 'confirmed', 'processed'].includes(order.status);
  const canRefund = ['delivered', 'receipt_confirmed'].includes(order.status);
  const isRefundRequested = order.status === 'refund_requested';
  const canUpdateStatus = !['cancelled', 'refunded'].includes(order.status);

  const getNextStatuses = () => {
    switch (order.status) {
      case 'pending':
        return ['confirmed'];
      case 'confirmed':
        return ['processed'];
      case 'processed':
        return ['delivered'];
      case 'delivered':
        return ['receipt_confirmed'];
      default:
        return [];
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Commande #{order.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge className={getOrderStatusColor(order.status)}>
                {getOrderStatusLabel(order.status)}
              </Badge>
              <div className="flex flex-wrap gap-2">
                {canUpdateStatus && getNextStatuses().length > 0 && (
                  <Button size="sm" onClick={() => setStatusModalOpen(true)}>
                    <Clock className="h-4 w-4 mr-1" />
                    Modifier statut
                  </Button>
                )}
                {canCancel && (
                  <Button size="sm" variant="destructive" onClick={() => setCancelModalOpen(true)}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                )}
                {canRefund && (
                  <Button size="sm" variant="outline" onClick={() => setRefundModalOpen(true)}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Rembourser
                  </Button>
                )}
                {isRefundRequested && (
                  <>
                    <Button size="sm" variant="success" onClick={() => onApproveRefund(order.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approuver
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setRefundModalOpen(true)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Refuser
                    </Button>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Business Info */}
            <div className="flex items-center gap-3">
              {order.business_logo ? (
                <img 
                  src={order.business_logo} 
                  alt={order.business_name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">{order.business_name}</p>
                <p className="text-sm text-muted-foreground">Prestataire</p>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Articles commandés
              </h4>
              <div className="space-y-2">
                {orderItems.length > 0 ? (
                  orderItems.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="h-10 w-10 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{item.name || 'Article'}</p>
                          <p className="text-xs text-muted-foreground">Quantité: {item.quantity || 1}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price || 0)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Détails non disponibles</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

            <Separator />

            {/* Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Livraison
                </h4>
                <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Paiement
                </h4>
                <p className="text-sm text-muted-foreground capitalize">{order.payment_method}</p>
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Donneur
                </h4>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.donor_phone}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Bénéficiaire
                </h4>
                <p className="text-sm flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {order.beneficiary_phone}
                </p>
              </div>
            </div>

            <Separator />

            {/* Dates */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Créée le</p>
                <p className="font-medium">
                  {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                </p>
              </div>
              {order.processed_at && (
                <div>
                  <p className="text-muted-foreground">Traitée le</p>
                  <p className="font-medium">
                    {format(new Date(order.processed_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
              {order.customer_confirmed_at && (
                <div>
                  <p className="text-muted-foreground">Confirmée le</p>
                  <p className="font-medium">
                    {format(new Date(order.customer_confirmed_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
              {order.refund_requested_at && (
                <div>
                  <p className="text-muted-foreground">Remboursement demandé</p>
                  <p className="font-medium">
                    {format(new Date(order.refund_requested_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              )}
            </div>

            {/* Customer Review */}
            {order.customer_rating && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Avis client
                  </h4>
                  <div className="flex items-center gap-2 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < order.customer_rating! ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-sm">({order.customer_rating}/5)</span>
                  </div>
                  {order.customer_review_text && (
                    <p className="text-sm text-muted-foreground">{order.customer_review_text}</p>
                  )}
                </div>
              </>
            )}

            {/* Refund Reason */}
            {order.refund_reason && (
              <>
                <Separator />
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <h4 className="font-medium mb-1 text-orange-800 dark:text-orange-400">
                    Raison du remboursement
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">{order.refund_reason}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AdminRefundModal
        order={order}
        open={refundModalOpen}
        onOpenChange={setRefundModalOpen}
        onRefund={onRefundOrder}
        onRejectRefund={onRejectRefund}
        isRejection={isRefundRequested}
      />

      <AdminCancelOrderModal
        order={order}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        onCancel={onCancelOrder}
      />

      <AdminUpdateStatusModal
        order={order}
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        onUpdateStatus={onUpdateStatus}
        availableStatuses={getNextStatuses()}
      />
    </>
  );
}
