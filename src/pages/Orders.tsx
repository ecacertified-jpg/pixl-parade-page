import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Eye, Package, Clock, CheckCircle, XCircle, CheckCircle2, AlertTriangle, RefreshCw, Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCustomerOrders, type CustomerOrder } from "@/hooks/useCustomerOrders";
import { OrderInvoiceModal } from "@/components/OrderInvoiceModal";
import { ConfirmDeliveryModal } from "@/components/ConfirmDeliveryModal";
import { EditRatingModal } from "@/components/EditRatingModal";
import { useOrderConfirmation } from "@/hooks/useOrderConfirmation";
import { useEditRating } from "@/hooks/useEditRating";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Package className="h-3 w-3 mr-1" />En cours</Badge>;
    case 'delivered':
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Livrée</Badge>;
    case 'receipt_confirmed':
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3 w-3 mr-1" />Confirmée</Badge>;
    case 'refund_requested':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Remboursement demandé</Badge>;
    case 'refunded':
      return <Badge variant="secondary" className="bg-slate-100 text-slate-800"><RefreshCw className="h-3 w-3 mr-1" />Remboursée</Badge>;
    case 'cancelled':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

// Composant pour afficher les étoiles de notation
const RatingStars = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};

interface OrderCardProps {
  order: CustomerOrder;
  onViewInvoice: (order: CustomerOrder) => void;
  onConfirmDelivery: (order: CustomerOrder) => void;
  onEditRating: (order: CustomerOrder) => void;
}

const OrderCard = ({ order, onViewInvoice, onConfirmDelivery, onEditRating }: OrderCardProps) => {
  const { canEditReview, getRemainingDays } = useEditRating();
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0) || 1;
  const canConfirmDelivery = order.status === 'delivered' && !order.customerConfirmedAt;
  const isConfirmed = order.status === 'receipt_confirmed' || (order.customerConfirmedAt && order.status !== 'refund_requested');
  const isRefundRequested = order.status === 'refund_requested';
  const canEdit = isConfirmed && !isRefundRequested && order.customerConfirmedAt && canEditReview(order.customerConfirmedAt);
  const remainingDays = order.customerConfirmedAt ? getRemainingDays(order.customerConfirmedAt) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-sm font-medium text-foreground">
              #{order.orderNumber.substring(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(order.date, "dd MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {order.businessName && (
          <p className="text-sm text-muted-foreground mb-2">
            Boutique: <span className="font-medium text-foreground">{order.businessName}</span>
          </p>
        )}

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-foreground">
              {order.totalAmount.toLocaleString()} {order.currency}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Bouton cliquable pour confirmer */}
            {canConfirmDelivery && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onConfirmDelivery(order)}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirmer réception
              </Button>
            )}
            
            {/* État confirmé - bouton désactivé vert + étoiles + bouton modifier */}
            {isConfirmed && !isRefundRequested && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="bg-green-50 text-green-700 border-green-200 cursor-default dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Réception confirmée
                </Button>
                {order.customerRating && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-950/50 rounded-md border border-yellow-200 dark:border-yellow-800">
                    <RatingStars rating={order.customerRating} />
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 ml-1">
                      {order.customerRating}/5
                    </span>
                  </div>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditRating(order)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    <span className="text-xs">Modifier ({remainingDays}j)</span>
                  </Button>
                )}
              </div>
            )}
            
            {/* État remboursement demandé - bouton désactivé orange */}
            {isRefundRequested && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-full sm:w-auto bg-amber-50 text-amber-700 border-amber-200 cursor-default dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Remboursement demandé
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewInvoice(order)}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-1" />
              Voir la facture
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OrdersSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex justify-between mb-3">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-40 mt-3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

const Orders = () => {
  const navigate = useNavigate();
  const { data: orders, isLoading } = useCustomerOrders();
  const { confirmReceipt } = useOrderConfirmation();
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [orderToConfirm, setOrderToConfirm] = useState<CustomerOrder | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<CustomerOrder | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return order.status === "pending" || order.status === "processing";
    if (activeTab === "delivered") return order.status === "delivered" || order.status === "receipt_confirmed";
    if (activeTab === "cancelled") return order.status === "cancelled" || order.status === "refund_requested" || order.status === "refunded";
    return true;
  }) || [];

  const orderCounts = {
    all: orders?.length || 0,
    pending: orders?.filter(o => o.status === "pending" || o.status === "processing").length || 0,
    delivered: orders?.filter(o => o.status === "delivered" || o.status === "receipt_confirmed").length || 0,
    cancelled: orders?.filter(o => o.status === "cancelled" || o.status === "refund_requested" || o.status === "refunded").length || 0,
  };

  const handleConfirmDelivery = async (orderId: string, rating: number, reviewText: string) => {
    await confirmReceipt(orderId, rating, reviewText);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Mes Commandes</h1>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1">
            <TabsTrigger value="all" className="text-xs py-2">
              Toutes ({orderCounts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs py-2">
              En cours ({orderCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs py-2">
              Livrées ({orderCounts.delivered})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs py-2">
              Annulées ({orderCounts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {isLoading ? (
          <OrdersSkeleton />
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune commande</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {activeTab === "all"
                ? "Vous n'avez pas encore passé de commande."
                : "Aucune commande dans cette catégorie."}
            </p>
            <Button onClick={() => navigate("/shop")} className="mt-6">
              Découvrir la boutique
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onViewInvoice={setSelectedOrder}
                onConfirmDelivery={setOrderToConfirm}
                onEditRating={setOrderToEdit}
              />
            ))}
          </div>
        )}
      </main>

      {/* Invoice Modal */}
      <OrderInvoiceModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* Confirm Delivery Modal */}
      <ConfirmDeliveryModal
        order={orderToConfirm}
        isOpen={!!orderToConfirm}
        onClose={() => setOrderToConfirm(null)}
        onConfirm={handleConfirmDelivery}
      />

      {/* Edit Rating Modal */}
      <EditRatingModal
        order={orderToEdit}
        isOpen={!!orderToEdit}
        onClose={() => setOrderToEdit(null)}
      />
    </div>
  );
};

export default Orders;
