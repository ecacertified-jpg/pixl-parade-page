import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Receipt, Gift, TrendingUp, Package, ShoppingCart, MapPin, Truck, Phone, Bell, Check, X, Edit, Trash2, Download, Plus, AlertCircle, DollarSign, Star, BarChart3, Users, Calendar, FileText, CreditCard, Clock, UserPlus, Target, PieChart, Settings, Smartphone, EyeOff, Eye } from "lucide-react";
import { BusinessInitiatedFundsSection } from "@/components/BusinessInitiatedFundsSection";
import { BusinessOrdersSection } from "@/components/BusinessOrdersSection";
import { AddProductModal } from "@/components/AddProductModal";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Business } from "@/types/business";


export default function BusinessAccount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    sales: number;
    status: string;
  }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Array<{
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
  }>>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [hiddenOrders, setHiddenOrders] = useState<Set<string>>(new Set());
  const [individualOrders, setIndividualOrders] = useState<Array<{
    id: string;
    total_amount: number;
    currency: string;
    status: string;
    delivery_address: any;
    notes: string;
    created_at: string;
    order_items: any[];
  }>>([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: ""
  });
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadBusinesses();
      loadProducts();
      loadOrders();
    }
  }, [user]);

  const loadBusinesses = async () => {
    if (!user) return;
    setLoadingBusinesses(true);
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const businessesWithFormattedData: Business[] = (data || []).map(business => ({
        id: business.id,
        business_name: business.business_name,
        business_type: business.business_type,
        phone: business.phone,
        address: business.address,
        description: business.description,
        logo_url: business.logo_url,
        website_url: business.website_url,
        email: business.email,
        opening_hours: business.opening_hours as {
          [key: string]: {
            open: string;
            close: string;
            closed?: boolean;
          };
        },
        delivery_zones: business.delivery_zones as Array<{
          name: string;
          cost: number;
          radius?: number;
          active?: boolean;
        }>,
        payment_info: business.payment_info as {
          mobile_money?: string;
          account_holder?: string;
        },
        delivery_settings: business.delivery_settings as {
          free_delivery_threshold: number;
          standard_cost: number;
        }
      }));
      
      setBusinesses(businessesWithFormattedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingBusinesses(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      // Load orders with their items for business owners
      const { data, error } = await supabase.from('orders').select(`
          id,
          total_amount,
          currency,
          status,
          created_at,
          delivery_address,
          notes,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            products (
              name,
              business_owner_id
            )
          )
        `).order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      // Filter orders that contain products from this business owner
      const businessOrders = (data || []).filter(order => 
        order.order_items.some(item => item.products && item.products.business_owner_id === user.id)
      ).map(order => ({
        ...order,
        order_items: order.order_items.filter(item => 
          item.products && item.products.business_owner_id === user.id
        ).map(item => ({
          ...item,
          product_name: item.products?.name || 'Produit supprimé'
        }))
      }));
      
      setOrders(businessOrders);

      // Load individual orders (orders marked as individual orders)
      const individualOrdersData = businessOrders.filter(order => 
        order.notes && order.notes.includes('Commande individuelle')
      );
      setIndividualOrders(individualOrdersData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setIsAddBusinessModalOpen(true);
  };

  const handleBusinessModalClose = () => {
    setIsAddBusinessModalOpen(false);
    setEditingBusiness(null);
  };

  const handleBusinessChanged = () => {
    loadBusinesses();
    handleBusinessModalClose();
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_owner_id', user?.id);

      if (error) throw error;

      const formattedProducts = (data || []).map(product => ({
        id: product.id,
        name: product.name,
        category: product.category_id || 'Non classé',
        price: product.price,
        stock: product.stock_quantity || 0,
        sales: 0,
        status: product.is_active ? 'active' : 'inactive'
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingProductId(productId);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleOrderConfirmed = async (orderId: string) => {
    try {
      await loadOrders();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la confirmation",
        variant: "destructive"
      });
    }
  };

  const handleHideOrder = (orderId: string) => {
    setHiddenOrders(prev => new Set([...prev, orderId]));
    toast({
      title: "Succès",
      description: "Commande masquée"
    });
  };

  const handleUnhideAllOrders = () => {
    setHiddenOrders(new Set());
    toast({
      title: "Succès", 
      description: "Toutes les commandes sont maintenant visibles"
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const visibleOrders = orders.filter(order => !hiddenOrders.has(order.id));

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Compte Business</h1>
              <p className="text-sm text-muted-foreground">Gérez votre activité commerciale</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="products">Produits</TabsTrigger>
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ventes totales</p>
                    <p className="text-2xl font-bold">125,000 F</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Commandes</p>
                    <p className="text-2xl font-bold">{orders.length}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Produits actifs</p>
                    <p className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Informations Business</h3>
                {businesses.length > 0 ? (
                  <div className="space-y-4">
                    {businesses.map((business) => (
                      <BusinessCard
                        key={business.id}
                        business={business}
                        onEdit={() => handleEditBusiness(business)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      Aucun compte business configuré
                    </div>
                    <Button onClick={() => setIsAddBusinessModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer un compte business
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Commandes récentes</h3>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">#{order.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.total_amount} {order.currency}</p>
                          <Badge variant={order.status === 'pending' ? 'secondary' : 'default'}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune commande pour le moment
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Produits */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Mes Produits</h2>
              <Button onClick={() => setIsAddProductModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>

            <Card className="p-6">
              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Chargement des produits...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground mb-4">Aucun produit ajouté</div>
                  <Button onClick={() => setIsAddProductModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter votre premier produit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm font-medium">{product.price.toLocaleString()} F</span>
                          <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                            {product.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={deletingProductId === product.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="orders" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Autres Commandes
              </h2>
              
              {/* Commandes de cotisations collectives */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Commandes de Cotisations Collectives</h3>
                <BusinessOrdersSection />
              </div>

              {/* Commandes individuelles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Commandes Individuelles</h3>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Commandes clients individuelles</h4>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="rounded-none mx-[2px] my-px px-0 py-0">
                        {individualOrders.length} commandes
                      </Badge>
                    </div>
                  </div>
              
                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">Chargement des commandes...</div>
                    </div>
                  ) : individualOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground flex items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Aucune commande individuelle pour le moment
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {individualOrders.map(order => (
                        <Card key={order.id} className="border border-muted">
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">Commande #{order.id.slice(-8)}</h4>
                                  <Badge variant={order.status === 'pending' ? 'secondary' : order.status === 'processed' ? 'default' : 'outline'} className="text-xs">
                                    {order.status === 'pending' ? 'En attente' : order.status === 'processed' ? 'Traité' : 'Livré'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(order.created_at)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div>
                                <p className="text-sm font-medium">Articles commandés:</p>
                                <div className="space-y-1">
                                  {order.order_items?.map((item: any, index: number) => (
                                    <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">{item.product_name}</span>
                                        <span>Qté: {item.quantity}</span>
                                      </div>
                                      <div className="text-xs font-medium text-primary">
                                        {item.unit_price?.toLocaleString()} F × {item.quantity} = {item.total_price?.toLocaleString()} F
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Total:</span>
                                <span className="font-bold text-primary">
                                  {order.total_amount?.toLocaleString()} {order.currency}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div>
                                <p className="font-medium text-muted-foreground">Donateur:</p>
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {order.delivery_address?.donorPhone || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="font-medium text-muted-foreground">Bénéficiaire:</p>
                                <p className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {order.delivery_address?.beneficiaryPhone || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <p className="font-medium text-muted-foreground text-sm">Adresse de livraison:</p>
                              <p className="text-sm flex items-start gap-1">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                {order.delivery_address?.address || 'N/A'}
                              </p>
                            </div>
                            
                            <div className="mb-3">
                              <p className="font-medium text-muted-foreground text-sm">Mode de paiement:</p>
                              <p className="text-sm flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {order.notes?.includes('Paiement à la livraison') ? 'Paiement à la livraison' : 'Mobile Money'}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Ventes par catégorie
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bijoux</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Accessoires</span>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autres</span>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Performance mensuelle
                </h3>
                <div className="text-center py-8 text-muted-foreground">
                  Graphique des ventes à venir
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={() => setIsAddProductModalOpen(false)} 
        onProductAdded={loadProducts} 
      />
      <AddBusinessModal 
        isOpen={isAddBusinessModalOpen} 
        onClose={handleBusinessModalClose} 
        onBusinessAdded={handleBusinessChanged} 
        editingBusiness={editingBusiness} 
      />
      <OrderDetailsModal 
        isOpen={isOrderDetailsModalOpen} 
        onClose={() => {
          setIsOrderDetailsModalOpen(false);
          setSelectedOrder(null);
        }} 
        order={selectedOrder} 
        onOrderConfirmed={handleOrderConfirmed} 
      />
    </div>
  );
}