import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Receipt, Gift, TrendingUp, Package, ShoppingCart, MapPin, Truck, Phone, Bell, Check, X, Edit, Trash2, Download, Plus, AlertCircle, DollarSign, Star, BarChart3, Users, Calendar, FileText, CreditCard, Clock, UserPlus, Target, PieChart, Settings } from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
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
    id: string | number;
    name: string;
    category: string;
    price: number;
    stock: number;
    sales: number;
    status: string;
  }>>([{
    id: 1,
    name: "Bracelet Doré Élégance",
    category: "Bijoux",
    price: 15000,
    stock: 8,
    sales: 24,
    status: "active"
  }, {
    id: 2,
    name: "Parfum Roses de Yamoussoukro",
    category: "Parfums",
    price: 35000,
    stock: 5,
    sales: 12,
    status: "active"
  }]);
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
  }, []);
  const loadProducts = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('business_owner_id', user.id).eq('is_active', true).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error loading products:', error);
        return;
      }
      if (data && data.length > 0) {
        const formattedProducts = data.map(product => ({
          id: product.id,
          name: product.name,
          category: "Produit",
          price: product.price,
          stock: product.stock_quantity || 0,
          sales: 0,
          // This would need to be calculated from orders
          status: "active"
        }));
        setProducts(formattedProducts);
      } else {
        setProducts([]); // Clear products if none found
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadBusinesses = async () => {
    if (!user) return;
    
    setLoadingBusinesses(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading businesses:', error);
        return;
      }

      setBusinesses((data || []).map(business => ({
        ...business,
        opening_hours: business.opening_hours as Record<string, { open: string; close: string; closed?: boolean; }>,
        delivery_zones: business.delivery_zones as Array<{ name: string; radius: number; cost: number; active?: boolean; }>,
        payment_info: business.payment_info as { mobile_money?: string; account_holder?: string; },
        delivery_settings: business.delivery_settings as { free_delivery_threshold: number; standard_cost: number; }
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingBusinesses(false);
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce produit ? Il sera supprimé de vos produits et retiré de la boutique.')) {
      return;
    }
    
    try {
      // Delete product from database - this removes it from everywhere (My Products + Shop)
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', String(productId))
        .eq('business_owner_id', user?.id);
      
      if (error) {
        console.error('Error deleting product:', error);
        
        // Handle foreign key constraint violation (product referenced in orders/favorites/etc)
        if (error.code === '23503') {
          toast.error('Impossible de supprimer ce produit car il fait partie de commandes existantes.', {
            duration: 4000
          });
          
          // Offer to deactivate the product instead
          if (confirm('Ce produit ne peut pas être supprimé car il est référencé dans des commandes. Voulez-vous le désactiver à la place ? Il restera dans vos produits mais sera masqué de la boutique.')) {
            try {
              const { error: updateError } = await supabase
                .from('products')
                .update({ is_active: false })
                .eq('id', String(productId))
                .eq('business_owner_id', user?.id);
              
              if (updateError) {
                console.error('Error deactivating product:', updateError);
                toast.error('Erreur lors de la désactivation du produit');
                return;
              }
              
              toast.success('Produit désactivé avec succès - Il est maintenant masqué de la boutique');
              loadProducts(); // Reload to show updated status
            } catch (deactivateError) {
              console.error('Error deactivating product:', deactivateError);
              toast.error('Erreur lors de la désactivation du produit');
            }
          }
        } else {
          toast.error('Erreur lors de la suppression du produit');
        }
        return;
      }
      
      // Success - product deleted from database (removed from My Products AND Shop)
      toast.success('Produit supprimé avec succès de vos produits et de la boutique');
      loadProducts(); // Reload the products list
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de la suppression du produit');
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-orange-500";
      case "confirmed":
        return "bg-blue-500";
      case "preparing":
        return "bg-yellow-500";
      case "ready":
        return "bg-green-500";
      case "delivered":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "Nouvelle";
      case "confirmed":
        return "Confirmée";
      case "preparing":
        return "En préparation";
      case "ready":
        return "Prêt";
      case "delivered":
        return "Livré";
      default:
        return status;
    }
  };
  return <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Compte Business</h1>
              <p className="text-sm text-muted-foreground">Boutique Élégance - Cocody, Abidjan</p>
            </div>
            <Badge className="ml-auto bg-green-500">Actif</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Statut du compte */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Produits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Commandes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
              <div className="text-sm text-muted-foreground">Revenus (F)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.rating}</div>
              <div className="text-sm text-muted-foreground">Note</div>
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
              <h3 className="font-medium mb-4">Mes produits ({products.length})</h3>
              <div className="space-y-3">
                {products.map(product => <div key={product.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                        <div className="text-sm font-medium text-primary mt-1">
                          {product.price.toLocaleString()} F
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Stock: {product.stock}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} ventes</div>
                        <Badge variant="secondary" className="mt-1">En stock</Badge>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>)}
              </div>
            </Card>
          </TabsContent>

          {/* Onglet Commandes */}
          <TabsContent value="commandes" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Gestion des commandes</h2>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="new">Nouvelles</SelectItem>
                    <SelectItem value="confirmed">Confirmées</SelectItem>
                    <SelectItem value="preparing">En préparation</SelectItem>
                    <SelectItem value="ready">Prêtes</SelectItem>
                    <SelectItem value="delivered">Livrées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conseils pour les modes de retrait/livraison */}
            <Card className="p-4 mb-6 border-blue-200 bg-blue-50/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900 mb-2">Conseils pour la gestion des commandes</h3>
                  <div className="text-sm text-blue-800 space-y-2">
                    <div><strong>Retrait sur place:</strong> Appelez immédiatement le client pour confirmer et indiquer l'adresse exacte de votre boutique.</div>
                    <div><strong>Livraison:</strong> Contactez le client pour confirmer l'adresse. Livraison gratuite si montant &gt; 25 000 FCFA.</div>
                    <div><strong>Délais:</strong> Préparez les commandes dans les 24h pour maintenir votre réputation.</div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              {recentOrders.map(order => <Card key={order.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-lg">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{order.date}</div>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2">Détails de la commande</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Produit:</strong> {order.product}</div>
                        <div><strong>Montant:</strong> {order.amount.toLocaleString()} F</div>
                        <div><strong>Client:</strong> {order.customer}</div>
                        <div><strong>Donateur:</strong> {order.donor}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Mode de récupération</h4>
                      <div className="flex items-center gap-2 mb-2">
                        {order.type === "pickup" ? <>
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">Retrait sur place</span>
                          </> : <>
                            <Truck className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              Livraison {order.amount > 25000 && "(Gratuite)"}
                            </span>
                          </>}
                      </div>
                      {order.type === "delivery" && order.amount <= 25000 && <div className="text-xs text-orange-600">
                          Frais de livraison à la charge du donateur
                        </div>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {order.status === "new" && <>
                        <Button size="sm" className="flex-1">
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler le client
                        </Button>
                        <Button size="sm" variant="outline">
                          <Check className="h-4 w-4 mr-2" />
                          Confirmer
                        </Button>
                      </>}
                    {order.status === "confirmed" && <Button size="sm" className="flex-1">
                        Marquer en préparation
                      </Button>}
                    {order.status === "preparing" && <Button size="sm" className="flex-1">
                        Marquer comme prêt
                      </Button>}
                    {order.status === "ready" && <Button size="sm" className="flex-1">
                        Marquer comme livré/retiré
                      </Button>}
                  </div>
                </Card>)}
            </div>
          </TabsContent>

          {/* Onglet Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Analytics & Statistiques</h2>
            
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
              <h2 className="font-semibold text-base text-gray-500">Configuration des business</h2>
              <Button 
                onClick={() => setIsAddBusinessModalOpen(true)} 
                className="gap-2 bg-rose-500 hover:bg-rose-400 px-[8px]"
              >
                <Plus className="h-4 w-4" />
                Ajouter son business
              </Button>
            </div>

            {/* Liste des business existants */}
            <div className="space-y-4">
              {loadingBusinesses ? (
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground">Chargement des business...</div>
                </Card>
              ) : businesses.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-muted-foreground mb-4">
                    Aucun business configuré pour le moment
                  </div>
                  <Button 
                    onClick={() => setIsAddBusinessModalOpen(true)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Créer votre premier business
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  <h3 className="font-medium">Mes business ({businesses.length})</h3>
                  {businesses.map((business) => (
                    <BusinessCard
                      key={business.id}
                      business={business}
                      onEdit={handleEditBusiness}
                      onDeleted={handleBusinessChanged}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>

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
    </div>;
}