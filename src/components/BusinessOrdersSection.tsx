import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, MapPin, CreditCard, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CollectiveOrder {
  id: string;
  fund_id: string;
  order_summary: any;
  total_amount: number;
  currency: string;
  donor_phone: string;
  beneficiary_phone: string;
  delivery_address: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface IndividualOrder {
  id: string;
  fund_id: string;
  order_summary: any;
  total_amount: number;
  currency: string;
  donor_phone: string;
  beneficiary_phone: string;
  delivery_address: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export function BusinessOrdersSection() {
  const [collectiveOrders, setCollectiveOrders] = useState<CollectiveOrder[]>([]);
  const [individualOrders, setIndividualOrders] = useState<IndividualOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load collective fund orders
      const { data: collectiveData, error: collectiveError } = await supabase
        .from('collective_fund_orders')
        .select(`
          id,
          fund_id,
          order_summary,
          total_amount,
          currency,
          donor_phone,
          beneficiary_phone,
          delivery_address,
          payment_method,
          status,
          created_at,
          collective_funds!inner (
            business_product_id,
            products!collective_funds_business_product_id_fkey (
              business_owner_id
            )
          )
        `)
        .eq('collective_funds.products.business_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (collectiveError) throw collectiveError;
      setCollectiveOrders(collectiveData || []);

      // Load individual business orders
      const { data: individualData, error: individualError } = await supabase
        .from('business_orders')
        .select(`
          id,
          fund_id,
          order_summary,
          total_amount,
          currency,
          donor_phone,
          beneficiary_phone,
          delivery_address,
          payment_method,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (individualError) throw individualError;
      setIndividualOrders(individualData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, isIndividual = false) => {
    try {
      const tableName = isIndividual ? 'business_orders' : 'collective_fund_orders';
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Commande marquée comme ${newStatus === 'processed' ? 'traitée' : newStatus}`,
      });

      loadOrders(); // Recharger les commandes
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'processed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Traitée</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Package className="h-3 w-3 mr-1" />Livrée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const renderOrderCard = (order: CollectiveOrder | IndividualOrder, isIndividual = false) => {
    const orderSummary = order.order_summary;
    const items = orderSummary?.items || [];
    
    return (
      <Card key={order.id} className="p-4">
        {/* Header avec statut */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium">
              {isIndividual ? 'Commande individuelle' : 'Commande collective'} #{order.id.slice(-6)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(order.created_at)}
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>

        {/* Articles commandés */}
        <div className="space-y-2 mb-4">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  Quantité: {item.quantity} • {item.price?.toLocaleString()} {order.currency}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Montant total */}
        <div className="border-t pt-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <span className="font-bold text-lg text-primary">
              {order.total_amount.toLocaleString()} {order.currency}
            </span>
          </div>
        </div>

        {/* Informations de livraison */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Donateur:</span>
            <span>{order.donor_phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Bénéficiaire:</span>
            <span>{order.beneficiary_phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Adresse:</span>
            <span>{order.delivery_address}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Paiement:</span>
            <span className="capitalize">{order.payment_method}</span>
          </div>
        </div>

        {/* Actions */}
        {order.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => updateOrderStatus(order.id, 'processed', isIndividual)}
              className="flex-1"
            >
              Marquer comme traitée
            </Button>
          </div>
        )}

        {order.status === 'processed' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateOrderStatus(order.id, 'delivered', isIndividual)}
              className="flex-1"
            >
              Marquer comme livrée
            </Button>
          </div>
        )}
      </Card>
    );
  };

  return (
    <Tabs defaultValue="individual" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="individual">Commandes individuelles</TabsTrigger>
        <TabsTrigger value="collective">Commandes collectives</TabsTrigger>
      </TabsList>

      <TabsContent value="individual" className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : individualOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune commande individuelle</h3>
            <p className="text-sm text-muted-foreground">
              Les commandes individuelles apparaîtront ici
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {individualOrders.map((order) => renderOrderCard(order, true))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="collective" className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : collectiveOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune commande collective</h3>
            <p className="text-sm text-muted-foreground">
              Les commandes de cotisations collectives apparaîtront ici
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {collectiveOrders.map((order) => renderOrderCard(order, false))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}