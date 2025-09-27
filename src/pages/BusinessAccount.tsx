import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Receipt, Gift, TrendingUp, Package, ShoppingCart, MapPin, Truck, Phone, Bell, Check, X, Edit, Trash2, Download, Plus, AlertCircle, DollarSign, Star, BarChart3, Users, Calendar, FileText, CreditCard, Clock, UserPlus, Target, PieChart, Settings, Smartphone, EyeOff, Eye } from "lucide-react";
import { BusinessInitiatedFundsSection } from "@/components/BusinessInitiatedFundsSection";
import { BusinessOrdersSection } from "@/components/BusinessOrdersSection";
import { AddProductModal } from "@/components/AddProductModal";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
import { BusinessProductCard } from "@/components/BusinessProductCard";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { Business } from "@/types/business";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
export default function BusinessAccount() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
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
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: ""
  });
  useEffect(() => {
    document.title = "Compte Business | JOIE DE VIVRE";
    loadProducts();
    loadBusinesses();
    loadOrders();
  }, []);
  const loadProducts = async () => {
    if (!user) return;
    setLoadingProducts(true);
    console.log('🔄 Loading products for user:', user.id);
    try {
      // Load ALL products (active and inactive) to show complete list
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('business_owner_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('❌ Error loading products:', error);
        toast.error('Erreur lors du chargement des produits');
        return;
      }
      console.log('✅ Products loaded from database:', data?.length || 0);
      if (data && data.length > 0) {
        const formattedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          category: "Produit",
          price: product.price,
          stock: product.stock_quantity || 0,
          sales: 0,
          // This would need to be calculated from orders
          status: product.is_active ? "active" : "inactive"
        }));
        setProducts(formattedProducts);
        console.log('✅ Products formatted and set in state:', formattedProducts.length);
      } else {
        setProducts([]);
        console.log('ℹ️ No products found');
      }
    } catch (error) {
      console.error('❌ Error in loadProducts:', error);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoadingProducts(false);
    }
  };
  const loadBusinesses = async () => {
    if (!user) return;
    setLoadingBusinesses(true);
    try {
      const {
        data,
        error
      } = await supabase.from('businesses').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error loading businesses:', error);
        return;
      }
      setBusinesses((data || []).map(business => ({
        ...business,
        opening_hours: business.opening_hours as Record<string, {
          open: string;
          close: string;
          closed?: boolean;
        }>,
        delivery_zones: business.delivery_zones as Array<{
          name: string;
          radius: number;
          cost: number;
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
      })));
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
      // We need to find orders that contain products from this business owner
      const {
        data,
        error
      } = await supabase.from('orders').select(`
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
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error loading orders:', error);
        return;
      }

      // Filter orders that contain products from this business owner
      const businessOrders = (data || []).filter(order => order.order_items.some(item => item.products && item.products.business_owner_id === user.id)).map(order => ({
        ...order,
        order_items: order.order_items.filter(item => item.products && item.products.business_owner_id === user.id).map(item => ({
          ...item,
          product_name: item.products?.name || 'Produit supprimé'
        }))
      }));
      setOrders(businessOrders);
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
  };
  const handleEditProduct = (productId: string | number) => {
    // Find the product to edit
    const productToEdit = products.find(p => p.id === productId);
    if (productToEdit) {
      // For now, we'll use a simple prompt - can be expanded to a full modal later
      const newName = prompt("Nouveau nom du produit:", productToEdit.name);
      const newPrice = prompt("Nouveau prix (FCFA):", productToEdit.price.toString());
      if (newName && newPrice) {
        updateProduct(productId, {
          name: newName,
          price: parseFloat(newPrice)
        });
      }
    }
  };
  const updateProduct = async (productId: string | number, updates: any) => {
    try {
      const {
        error
      } = await supabase.from('products').update(updates).eq('id', String(productId));
      if (error) {
        console.error('Error updating product:', error);
        return;
      }

      // Reload products to reflect the change
      loadProducts();
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const handleDeleteProduct = async (productId: string | number) => {
    const productIdStr = String(productId);
    console.log('🗑️ Attempting to delete product:', productIdStr);
    console.log('👤 Current user ID:', user?.id);
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce produit ? Il sera supprimé de vos produits et retiré de la boutique.')) {
      return;
    }
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }
    setDeletingProductId(productIdStr);
    try {
      console.log('🔄 Executing delete query...');

      // Delete product from database - this removes it from everywhere (My Products + Shop)
      const {
        error,
        data
      } = await supabase.from('products').delete().eq('id', productIdStr).eq('business_owner_id', user.id).select(); // Add select to see what would be deleted

      console.log('📊 Delete query result:', {
        error,
        data
      });
      if (error) {
        console.error('❌ Error deleting product:', error);

        // Handle foreign key constraint violation (product referenced in orders/favorites/etc)
        if (error.code === '23503') {
          toast.error('Impossible de supprimer ce produit car il fait partie de commandes existantes.', {
            duration: 4000
          });

          // Offer to deactivate the product instead
          if (confirm('Ce produit ne peut pas être supprimé car il est référencé dans des commandes. Voulez-vous le désactiver à la place ? Il restera dans vos produits mais sera masqué de la boutique.')) {
            try {
              console.log('🔄 Deactivating product instead...');
              const {
                error: updateError
              } = await supabase.from('products').update({
                is_active: false,
                updated_at: new Date().toISOString()
              }).eq('id', productIdStr).eq('business_owner_id', user.id);
              
              if (updateError) {
                console.error('❌ Error deactivating product:', updateError);
                toast.error('Erreur lors de la désactivation du produit');
                return;
              }
              console.log('✅ Product deactivated successfully');
              toast.success('Produit désactivé avec succès - Il est maintenant masqué de la boutique');
              await loadProducts(); // Reload to show updated status
            } catch (deactivateError) {
              console.error('❌ Error deactivating product:', deactivateError);
              toast.error('Erreur lors de la désactivation du produit');
            }
          }
        } else {
          toast.error(`Erreur lors de la suppression: ${error.message}`);
        }
        return;
      }
      if (!data || data.length === 0) {
        console.log('⚠️ No product was deleted - might not exist or not owned by user');
        toast.error('Produit introuvable ou non autorisé');
        return;
      }

      // Success - product deleted from database (removed from My Products AND Shop)
      console.log('✅ Product deleted successfully:', data);
      toast.success('Produit supprimé avec succès de vos produits et de la boutique');
      await loadProducts(); // Reload the products list
    } catch (error) {
      console.error('❌ Unexpected error in handleDeleteProduct:', error);
      toast.error('Erreur inattendue lors de la suppression du produit');
    } finally {
      setDeletingProductId(null);
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };
  const handleProductSubmit = () => {
    console.log("Adding product:", newProduct);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: ""
    });
  };
  const stats = {
    totalProducts: 12,
    totalOrders: 8,
    totalRevenue: 340000,
    rating: 4.8,
    commission: 27200,
    netRevenue: 312800
  };
  const recentOrders = [{
    id: "CMD-001",
    product: "Bracelet Doré Élégance",
    customer: "Fatou Bamba",
    donor: "Kofi Asante",
    amount: 15000,
    status: "new",
    type: "pickup",
    date: "2025-01-11 14:30"
  }, {
    id: "CMD-002",
    product: "Parfum Roses de Yamoussoukro",
    customer: "Aisha Traoré",
    donor: "Mamadou Diallo",
    amount: 35000,
    status: "confirmed",
    type: "delivery",
    date: "2025-01-11 10:15"
  }];
  const getStatusColor = (status: string, createdAt?: string) => {
    // Calculer si 72 heures se sont écoulées
    const isExpired = createdAt ? new Date().getTime() - new Date(createdAt).getTime() > 72 * 60 * 60 * 1000 : false;
    if (isExpired && status === "pending") {
      return "bg-gray-500";
    }
    switch (status) {
      case "confirmed":
        return "bg-green-500";
      case "pending":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusText = (status: string, createdAt?: string) => {
    // Calculer si 72 heures se sont écoulées
    const isExpired = createdAt ? new Date().getTime() - new Date(createdAt).getTime() > 72 * 60 * 60 * 1000 : false;
    if (isExpired && status === "pending") {
      return "Non confirmée";
    }
    switch (status) {
      case "confirmed":
        return "Confirmée";
      case "pending":
        return "En cours";
      default:
        return status;
    }
  };
  const handleOrderConfirmed = async (orderId: string) => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        status: 'confirmed'
      }).eq('id', orderId);
      if (error) {
        console.error('Error confirming order:', error);
        toast.error('Erreur lors de la confirmation');
        return;
      }
      toast.success('Commande confirmée avec succès');
      await loadOrders(); // Recharger les commandes
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };
  const handleHideOrder = (orderId: string) => {
    setHiddenOrders(prev => new Set([...prev, orderId]));
    toast.success('Commande masquée');
  };
  const handleUnhideAllOrders = () => {
    setHiddenOrders(new Set());
    toast.success('Toutes les commandes sont maintenant visibles');
  };
  const visibleOrders = orders.filter(order => !hiddenOrders.has(order.id));
  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Mon Espace Business</h1>
              <p className="text-sm text-muted-foreground">
                {businesses.length > 0 
                  ? `Gérez ${businesses[0].business_name} et vos ventes`
                  : 'Gérez votre business et vos ventes'
                }
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Connecté en tant que : {user?.email}
              </p>
            </div>
            <Badge className="ml-auto bg-green-500">Actif</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Statut du compte */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalProducts}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Produits</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalOrders}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Commandes</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Revenus (F)</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-primary">{stats.rating}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Note</div>
            </div>
          </div>
        </Card>

        {/* Dashboard avec onglets */}
        <Tabs defaultValue="vue-ensemble" className="w-full">
          <TabsList className="grid grid-cols-5 text-xs">
            <TabsTrigger value="vue-ensemble" className="flex flex-col gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Vue d'ens.</span>
            </TabsTrigger>
            <TabsTrigger value="produits" className="flex flex-col gap-1">
              <Package className="h-4 w-4" />
              <span className="text-xs">Produits</span>
            </TabsTrigger>
            <TabsTrigger value="commandes" className="flex flex-col gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex flex-col gap-1">
              <Settings className="h-4 w-4" />
              <span className="text-xs">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Vue d'ensemble */}
          <TabsContent value="vue-ensemble" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenus totaux</p>
                    <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} F</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes du mois</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits actifs</p>
                    <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Résumé financier */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold mb-4">Résumé financier</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ventes brutes</span>
                  <span className="font-medium">{stats.totalRevenue.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission JOIE DE VIVRE (8%)</span>
                  <span className="font-medium text-red-600">-{stats.commission.toLocaleString()} F</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Revenus nets</span>
                  <span className="font-medium text-green-600">{stats.netRevenue.toLocaleString()} F</span>
                </div>
              </div>
            </Card>

            {/* Commandes récentes */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Commandes récentes</h3>
                <Button size="sm" variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
              </div>
              <div className="space-y-3">
                {recentOrders.map(order => <div key={order.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.product}</div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Client:</strong> {order.customer}</div>
                      <div><strong>Donateur:</strong> {order.donor}</div>
                      <div><strong>Montant:</strong> {order.amount.toLocaleString()} F</div>
                      <div className="flex items-center gap-2">
                        <strong>Type:</strong> 
                        {order.type === "pickup" ? <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Retrait sur place
                          </span> : <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Livraison {order.amount > 25000 && "(Gratuite)"}
                          </span>}
                      </div>
                    </div>
                    {order.status === "new" && <Button size="sm" className="w-full mt-2">
                        <Phone className="h-4 w-4 mr-2" />
                        Appeler le client
                      </Button>}
                  </div>)}
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Produits */}
          <TabsContent value="produits" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-base text-gray-500">Gestion des produits</h2>
              <Button onClick={() => setIsAddProductModalOpen(true)} className="gap-2 bg-rose-500 hover:bg-rose-400 px-[8px]">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>


            {/* Liste des produits existants */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Mes produits ({products.length})</h3>
                
              </div>
              
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Chargement des produits...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun produit ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour créer votre premier produit</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => {
                    // Transform product data to match BusinessProductCard interface
                    const transformedProduct = {
                      id: product.id,
                      name: product.name,
                      description: product.category, // Use category as description for now
                      price: product.price,
                      currency: 'XOF',
                      business_owner_id: user?.id || '',
                      category_name: product.category,
                      stock: product.stock,
                      is_active: product.status === 'active'
                    };
                    
                    return (
                      <BusinessProductCard
                        key={product.id}
                        product={transformedProduct}
                        businessId={user?.id}
                        onEdit={(product) => handleEditProduct(product.id)}
                        onDelete={(productId) => handleDeleteProduct(productId)}
                      />
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="commandes" className="mt-6">
            {/* Section des cotisations initiées par le prestataire */}
            <div className="mb-6">
              <BusinessInitiatedFundsSection />
            </div>

            {/* Section Autres Commandes */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-primary" />
                Autres Commandes
              </h2>
              
              {/* Commandes de cotisations collectives */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Commandes de Cotisations Collectives</h3>
                <BusinessOrdersSection />
              </div>

              {/* Commandes individuelles */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Commandes Individuelles</h3>
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Commandes clients</h4>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="rounded-none mx-[2px] my-px px-0 py-0">{visibleOrders.length} commandes</Badge>
                      {hiddenOrders.size > 0 && <Button variant="outline" size="sm" onClick={handleUnhideAllOrders} className="flex items-center gap-2 text-primary hover:text-primary text-xs px-[4px]">
                          <Eye className="h-4 w-4" />
                          Démasquer toutes
                        </Button>}
                    </div>
                  </div>
              
              {loadingOrders ? <div className="text-center py-8">
                  <div className="text-muted-foreground">Chargement des commandes...</div>
                </div> : orders.length === 0 ? <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <div className="text-muted-foreground">Aucune commande reçue</div>
                </div> : <div className="space-y-4">
                    {visibleOrders.map(order => <Card key={order.id} className="p-4 border border-border/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">Commande #{order.id.slice(0, 8)}</h3>
                              <p className="text-sm text-muted-foreground">
                                {order.order_items.map(item => item.product_name).join(', ')}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(order.status, order.created_at)}>
                            {getStatusText(order.status, order.created_at)}
                          </Badge>
                        </div>

                        {/* Informations avec icônes */}
                        <div className="space-y-3 mb-4">
                          {/* Téléphone donateur */}
                          {order.delivery_address?.donorPhone && <div className="flex items-center gap-3 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-green-600">{order.delivery_address.donorPhone}</span>
                            </div>}

                          {/* Téléphone bénéficiaire */}
                          {order.delivery_address?.beneficiaryPhone && <div className="flex items-center gap-3 text-sm">
                              <Smartphone className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-purple-600">{order.delivery_address.beneficiaryPhone}</span>
                            </div>}

                          {/* Date */}
                          <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(order.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                          </div>

                          {/* Type de livraison */}
                          {order.delivery_address?.deliveryType && <div className="flex items-center gap-3 text-sm">
                              {order.delivery_address.deliveryType === 'pickup' ? <MapPin className="h-4 w-4 text-muted-foreground" /> : <Truck className="h-4 w-4 text-muted-foreground" />}
                              <span>{order.delivery_address.deliveryType === 'pickup' ? 'Retrait sur place' : 'Livraison à domicile'}</span>
                            </div>}

                          {/* Montant total */}
                          <div className="flex items-center gap-3 text-sm">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-primary text-lg">{order.total_amount.toLocaleString()} {order.currency}</span>
                          </div>
                        </div>

                        {/* Résumé des produits (condensé) */}
                        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            {order.order_items.length} article{order.order_items.length > 1 ? 's' : ''} - {order.order_items.map(item => `${item.product_name} (x${item.quantity})`).join(', ')}
                          </p>
                        </div>

                        {/* Boutons Voir Détail et Masquer */}
                        <div className="flex justify-between items-center pt-4 border-t border-border/50">
                          <div className="text-xs text-muted-foreground">
                            Mode de paiement: {order.notes?.includes('Mobile Money') ? 'Mobile Money' : 'À la livraison/retrait'}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {
                      setSelectedOrder(order);
                      setIsOrderDetailsModalOpen(true);
                    }} className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Voir Détail
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleHideOrder(order.id)} className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                       </Card>)}
                   </div>}
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
                  Ventes par produit
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bracelet Doré Élégance</span>
                      <span>24 ventes (67%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{
                      width: '67%'
                    }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Parfum Roses de Yamoussoukro</span>
                      <span>12 ventes (33%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-secondary h-2 rounded-full" style={{
                      width: '33%'
                    }}></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Modes de livraison
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Retrait sur place
                    </span>
                    <span className="font-medium">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      Livraison
                    </span>
                    <span className="font-medium">30%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance mensuelle */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Performance mensuelle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-muted-foreground">Revenus (F)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.rating}</div>
                  <div className="text-sm text-muted-foreground">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">98%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Configuration */}
          <TabsContent value="configuration" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-base text-gray-500 mx-[17px]">Configuration des business</h2>
              <Button onClick={() => setIsAddBusinessModalOpen(true)} className="gap-2 bg-rose-500 hover:bg-rose-400 px-[8px]">
                <Plus className="h-4 w-4" />
                Ajouter son business
              </Button>
            </div>

            {/* Liste des business existants */}
            <div className="space-y-4">
              {loadingBusinesses ? <Card className="p-8 text-center">
                  <div className="text-muted-foreground">Chargement des business...</div>
                </Card> : businesses.length === 0 ? <Card className="p-8 text-center">
                  <div className="text-muted-foreground mb-4">
                    Aucun business configuré pour le moment
                  </div>
                  <Button onClick={() => setIsAddBusinessModalOpen(true)} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Créer votre premier business
                  </Button>
                </Card> : <div className="grid gap-4">
                  <h3 className="font-medium">Mes business ({businesses.length})</h3>
                  {businesses.map(business => <BusinessCard key={business.id} business={business} onEdit={handleEditBusiness} onDeleted={handleBusinessChanged} />)}
                </div>}
            </div>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>

      <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} onProductAdded={loadProducts} />
      <AddBusinessModal isOpen={isAddBusinessModalOpen} onClose={handleBusinessModalClose} onBusinessAdded={handleBusinessChanged} editingBusiness={editingBusiness} />
      <OrderDetailsModal isOpen={isOrderDetailsModalOpen} onClose={() => {
      setIsOrderDetailsModalOpen(false);
      setSelectedOrder(null);
    }} order={selectedOrder} onOrderConfirmed={handleOrderConfirmed} />
    </div>;
}