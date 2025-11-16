import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, MapPin, CreditCard, Clock, CheckCircle, Users, Target, Filter, XCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBusinessCollectiveFunds } from "@/hooks/useBusinessCollectiveFunds";

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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const { funds: businessFunds, loading: loadingBusinessFunds } = useBusinessCollectiveFunds();

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Set up realtime listener for business_orders
  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up realtime listener for business_orders');
    
    const channel = supabase
      .channel('business-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_orders'
        },
        (payload) => {
          console.log('🆕 New business order detected:', payload);
          // Reload orders when a new one is inserted
          loadOrders();
          toast({
            title: "Nouvelle commande",
            description: "Une nouvelle commande individuelle a été reçue",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_orders'
        },
        (payload) => {
          console.log('📝 Business order updated:', payload);
          // Reload orders when one is updated
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Cleaning up realtime listener');
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Helper function to normalize image URLs
  const normalizeImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl || imageUrl === '/placeholder.svg') return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `${window.location.origin}${imageUrl}`;
    return imageUrl;
  };

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

      // Load individual business orders with product information
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
          created_at,
          business_accounts!inner (
            user_id
          )
        `)
        .eq('business_accounts.user_id', user.id)
        .order('created_at', { ascending: false });

      if (individualError) throw individualError;

      // Enrich individual orders with product images by matching product names
      const enrichedIndividualOrders = await Promise.all(
        (individualData || []).map(async (order) => {
          const orderSummary = order.order_summary as any;
          const items = orderSummary?.items || [];
          const enrichedItems = await Promise.all(
            items.map(async (item: any) => {
              if (item.name) {
                // Match by product name since individual orders don't have product_id
                const { data: productData } = await supabase
                  .from('products')
                  .select('image_url')
                  .eq('name', item.name)
                  .limit(1)
                  .maybeSingle();
                
                return {
                  ...item,
                  image: normalizeImageUrl(productData?.image_url)
                };
              }
              return item;
            })
          );
          
          return {
            ...order,
            order_summary: {
              ...(orderSummary || {}),
              items: enrichedItems
            }
          };
        })
      );

      setIndividualOrders(enrichedIndividualOrders);

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
      case 'confirmed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Confirmée</Badge>;
      case 'processed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Traitée</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Package className="h-3 w-3 mr-1" />Livrée</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter orders by status
  const filterOrdersByStatus = (orders: CollectiveOrder[] | IndividualOrder[]) => {
    if (statusFilter === 'all') return orders;
    return orders.filter(order => order.status === statusFilter);
  };

  const filteredIndividualOrders = filterOrdersByStatus(individualOrders);
  const filteredCollectiveOrders = filterOrdersByStatus(collectiveOrders);

  const statusOptions = [
    { value: 'all', label: 'Tous', count: individualOrders.length + collectiveOrders.length },
    { value: 'pending', label: 'En attente', count: [...individualOrders, ...collectiveOrders].filter(o => o.status === 'pending').length },
    { value: 'confirmed', label: 'Confirmées', count: [...individualOrders, ...collectiveOrders].filter(o => o.status === 'confirmed').length },
    { value: 'delivered', label: 'Livrées', count: [...individualOrders, ...collectiveOrders].filter(o => o.status === 'delivered').length },
    { value: 'cancelled', label: 'Annulées', count: [...individualOrders, ...collectiveOrders].filter(o => o.status === 'cancelled').length },
  ];

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
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
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

  const renderBusinessFundCard = (fund: any) => {
    const progress = fund.fund?.target_amount ? (fund.fund.current_amount / fund.fund.target_amount) * 100 : 0;
    
    return (
      <Card key={fund.id} className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Cotisation business #{fund.fund_id.slice(-6)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(fund.created_at)}
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Target className="h-3 w-3 mr-1" />
            {fund.fund?.status || 'active'}
          </Badge>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <div className="font-semibold text-lg">{fund.fund?.title}</div>
            <div className="text-sm text-muted-foreground">
              Pour: {fund.beneficiary?.first_name} {fund.beneficiary?.last_name}
            </div>
          </div>

          {fund.product && (
            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                {fund.product.image_url ? (
                  <img 
                    src={fund.product.image_url} 
                    alt={fund.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{fund.product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {fund.product.price?.toLocaleString()} {fund.product.currency}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{fund.fund?.current_amount?.toLocaleString() || 0} {fund.fund?.currency}</span>
              <span>{fund.fund?.target_amount?.toLocaleString()} {fund.fund?.currency}</span>
            </div>
          </div>

          {fund.beneficiary?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Bénéficiaire:</span>
              <span>{fund.beneficiary.phone}</span>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrer par statut:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {statusOptions.map(option => (
              <Button
                key={option.value}
                variant={statusFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(option.value)}
                className="gap-2"
              >
                {option.label}
                <Badge 
                  variant="secondary" 
                  className={statusFilter === option.value ? "bg-white text-primary" : ""}
                >
                  {option.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Tabs defaultValue="individual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual">
            Individuelles ({filteredIndividualOrders.length})
          </TabsTrigger>
          <TabsTrigger value="collective">
            Collectives ({filteredCollectiveOrders.length})
          </TabsTrigger>
          <TabsTrigger value="business-funds">Initiées</TabsTrigger>
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
        ) : filteredIndividualOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {statusFilter === 'all' ? 'Aucune commande individuelle' : `Aucune commande ${statusOptions.find(o => o.value === statusFilter)?.label.toLowerCase()}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? 'Les commandes individuelles apparaîtront ici' : 'Aucune commande ne correspond à ce filtre'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredIndividualOrders.map((order) => renderOrderCard(order, true))}
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
        ) : filteredCollectiveOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">
              {statusFilter === 'all' ? 'Aucune commande collective' : `Aucune commande ${statusOptions.find(o => o.value === statusFilter)?.label.toLowerCase()}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusFilter === 'all' ? 'Les commandes de cotisations collectives apparaîtront ici' : 'Aucune commande ne correspond à ce filtre'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCollectiveOrders.map((order) => renderOrderCard(order, false))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="business-funds" className="space-y-4">
        {loadingBusinessFunds ? (
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
        ) : businessFunds.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune cotisation initiée</h3>
            <p className="text-sm text-muted-foreground">
              Les cotisations que vous avez créées pour vos clients apparaîtront ici
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {businessFunds.map((fund) => renderBusinessFundCard(fund))}
          </div>
        )}
      </TabsContent>
      </Tabs>
    </div>
  );
}