import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, Eye, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useCustomerOrders, type CustomerOrder } from "@/hooks/useCustomerOrders";
import { OrderInvoiceModal } from "@/components/OrderInvoiceModal";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
    case 'processing':
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Package className="h-3 w-3 mr-1" />En cours</Badge>;
    case 'delivered':
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Livrée</Badge>;
    case 'cancelled':
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const OrderCard = ({ order, onViewInvoice }: { order: CustomerOrder; onViewInvoice: (order: CustomerOrder) => void }) => {
  const itemCount = order.items.reduce((acc, item) => acc + item.quantity, 0) || 1;

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

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {itemCount} article{itemCount > 1 ? 's' : ''}
            </span>
            <span className="font-semibold text-foreground">
              {order.totalAmount.toLocaleString()} {order.currency}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewInvoice(order)}
            className="text-primary hover:text-primary/80"
          >
            <Eye className="h-4 w-4 mr-1" />
            Facture
          </Button>
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
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = orders?.filter(order => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return order.status === "pending" || order.status === "processing";
    if (activeTab === "delivered") return order.status === "delivered";
    if (activeTab === "cancelled") return order.status === "cancelled";
    return true;
  }) || [];

  const orderCounts = {
    all: orders?.length || 0,
    pending: orders?.filter(o => o.status === "pending" || o.status === "processing").length || 0,
    delivered: orders?.filter(o => o.status === "delivered").length || 0,
    cancelled: orders?.filter(o => o.status === "cancelled").length || 0,
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
    </div>
  );
};

export default Orders;
