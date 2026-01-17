import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { 
  Building2, Mail, Phone, MapPin, Globe, Package, TrendingUp, 
  Star, DollarSign, ShoppingCart, CheckCircle, Clock, XCircle,
  AlertTriangle, Plus, Pencil, Settings, Tag, Video
} from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminAddProductModal } from "./AdminAddProductModal";
import { AdminEditProductModal } from "./AdminEditProductModal";
import { AdminManageCategoriesModal } from "./AdminManageCategoriesModal";

interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  address: string | null;
  description: string | null;
  email: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
  category_id: string | null;
  is_experience: boolean;
  experience_type: string | null;
  location_name: string | null;
  business_account_id: string;
  videos?: Json | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
}

interface BusinessStats {
  productsCount: number;
  activeProductsCount: number;
  ordersCount: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  ratingsCount: number;
  ordersByStatus: {
    pending: number;
    confirmed: number;
    delivered: number;
    cancelled: number;
  };
  conversionRate: number;
}

interface BusinessProfileModalProps {
  businessId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusinessUpdated?: () => void;
}

export function BusinessProfileModal({ businessId, open, onOpenChange, onBusinessUpdated }: BusinessProfileModalProps) {
  const { isSuperAdmin } = useAdmin();
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [stats, setStats] = useState<BusinessStats>({
    productsCount: 0,
    activeProductsCount: 0,
    ordersCount: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    ratingsCount: 0,
    ordersByStatus: { pending: 0, confirmed: 0, delivered: 0, cancelled: 0 },
    conversionRate: 0
  });
  
  useEffect(() => {
    if (open && businessId) {
      fetchBusinessProfile();
      fetchStats();
    }
  }, [open, businessId]);
  
  const fetchBusinessProfile = async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (error) throw error;
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStats = async () => {
    if (!businessId) return;
    
    try {
      // Fetch products with details
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description, price, currency, image_url, stock_quantity, is_active, category_id, is_experience, experience_type, location_name, business_account_id, videos, video_url, video_thumbnail_url')
        .eq('business_account_id', businessId);
      
      const productsList = productsData || [];
      setProducts(productsList);
      
      // Fetch orders with details
      const { data: ordersData } = await supabase
        .from('business_orders')
        .select('id, status, total_amount, created_at')
        .eq('business_account_id', businessId);
      
      const orders = ordersData || [];
      
      // Fetch ratings for all products
      const productIds = productsList.map(p => p.id);
      let ratingsData: { rating: number }[] = [];
      if (productIds.length > 0) {
        const { data: ratings } = await supabase
          .from('product_ratings')
          .select('rating')
          .in('product_id', productIds);
        ratingsData = ratings || [];
      }
      
      // Calculate statistics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const activeProducts = productsList.filter(p => p.is_active);
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const monthlyOrders = deliveredOrders.filter(o => new Date(o.created_at) >= startOfMonth);
      
      const ordersByStatus = {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        delivered: deliveredOrders.length,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      };
      
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      
      const avgRating = ratingsData.length > 0
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0;
      
      const conversionRate = orders.length > 0
        ? (deliveredOrders.length / orders.length) * 100
        : 0;
      
      setStats({
        productsCount: productsList.length,
        activeProductsCount: activeProducts.length,
        ordersCount: orders.length,
        totalRevenue,
        monthlyRevenue,
        averageRating: Math.round(avgRating * 10) / 10,
        ratingsCount: ratingsData.length,
        ordersByStatus,
        conversionRate: Math.round(conversionRate)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };
  
  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive" className="text-xs">Rupture</Badge>;
    if (stock <= 3) return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">Stock faible</Badge>;
    return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">En stock</Badge>;
  };

  const hasVideos = (product: Product): boolean => {
    return !!(
      (product.videos && Array.isArray(product.videos) && product.videos.length > 0) ||
      product.video_url
    );
  };

  const getVideoCount = (product: Product): number => {
    if (product.videos && Array.isArray(product.videos)) {
      return product.videos.length;
    }
    return product.video_url ? 1 : 0;
  };
  
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!business) return null;
  
  const totalOrders = stats.ordersCount;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Profil du prestataire
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="products">Produits ({stats.productsCount})</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Informations générales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{business.business_name}</h3>
                  <div className="flex gap-2">
                    {business.is_verified && (
                      <Badge variant="default">Vérifié</Badge>
                    )}
                    {business.is_active ? (
                      <Badge variant="default">Actif</Badge>
                    ) : (
                      <Badge variant="destructive">Inactif</Badge>
                    )}
                  </div>
                </div>
                
                {business.business_type && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{business.business_type}</span>
                  </div>
                )}
                
                {business.description && (
                  <p className="text-sm text-muted-foreground">{business.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {business.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${business.email}`} className="text-primary hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  
                  {business.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${business.phone}`} className="text-primary hover:underline">
                        {business.phone}
                      </a>
                    </div>
                  )}
                  
                  {business.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{business.address}</span>
                    </div>
                  )}
                  
                  {business.website_url && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a href={business.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Voir le site web
                      </a>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  Inscrit le {new Date(business.created_at).toLocaleDateString('fr-FR')}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>Produits et services ({stats.productsCount})</span>
                  </CardTitle>
                  {isSuperAdmin && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setManageCategoriesOpen(true)}>
                        <Tag className="h-4 w-4 mr-2" />
                        Catégories
                      </Button>
                      <Button size="sm" onClick={() => setAddProductOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Aucun produit disponible pour le moment
                    </p>
                    {isSuperAdmin && (
                      <Button variant="outline" size="sm" onClick={() => setAddProductOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un produit
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div 
                        key={product.id} 
                        className="flex gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow group"
                      >
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0 relative">
                          {(product.video_thumbnail_url || product.image_url) ? (
                            <>
                              <img 
                                src={product.video_thumbnail_url || product.image_url || ''} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                              {hasVideos(product) && (
                                <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded p-0.5">
                                  <Video className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm truncate">{product.name}</h4>
                            <div className="flex items-center gap-1">
                              {!product.is_active && (
                                <Badge variant="secondary" className="text-xs">Inactif</Badge>
                              )}
                              {isSuperAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setEditingProduct(product as any)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatCurrency(product.price)}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {getStockBadge(product.stock_quantity)}
                            <span className="text-xs text-muted-foreground">
                              {product.stock_quantity} en stock
                            </span>
                            {hasVideos(product) ? (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 bg-primary/10 text-primary">
                                <Video className="h-3 w-3" />
                                {getVideoCount(product)} vidéo{getVideoCount(product) > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs flex items-center gap-1 text-muted-foreground">
                                <Video className="h-3 w-3" />
                                Aucune
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Produits actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{stats.activeProductsCount}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ {stats.productsCount}</span>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ShoppingCart className="h-3 w-3" />
                    Commandes totales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{stats.ordersCount}</span>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    CA Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</span>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    CA du mois
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-xl font-bold">{formatCurrency(stats.monthlyRevenue)}</span>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Note moyenne
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold">{stats.averageRating || '-'}</span>
                    {stats.averageRating > 0 && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{stats.ratingsCount} avis</span>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Taux de conversion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{stats.conversionRate}%</span>
                </CardContent>
              </Card>
            </div>
            
            {/* Order Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Répartition des commandes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {totalOrders === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune commande pour le moment
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          <span>En attente</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.ordersByStatus.pending}</span>
                          <span className="text-muted-foreground text-xs">
                            ({Math.round((stats.ordersByStatus.pending / totalOrders) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(stats.ordersByStatus.pending / totalOrders) * 100} 
                        className="h-2 bg-muted"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-blue-500" />
                          <span>Confirmées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.ordersByStatus.confirmed}</span>
                          <span className="text-muted-foreground text-xs">
                            ({Math.round((stats.ordersByStatus.confirmed / totalOrders) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(stats.ordersByStatus.confirmed / totalOrders) * 100} 
                        className="h-2 bg-muted"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Livrées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.ordersByStatus.delivered}</span>
                          <span className="text-muted-foreground text-xs">
                            ({Math.round((stats.ordersByStatus.delivered / totalOrders) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(stats.ordersByStatus.delivered / totalOrders) * 100} 
                        className="h-2 bg-muted"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span>Annulées</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{stats.ordersByStatus.cancelled}</span>
                          <span className="text-muted-foreground text-xs">
                            ({Math.round((stats.ordersByStatus.cancelled / totalOrders) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(stats.ordersByStatus.cancelled / totalOrders) * 100} 
                        className="h-2 bg-muted"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Status Badge */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Statut du compte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant={business.is_active ? "default" : "destructive"}>
                    {business.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                  {business.is_verified && (
                    <Badge variant="outline" className="border-green-500 text-green-600">
                      Vérifié
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Admin Modals */}
      <AdminAddProductModal
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onProductAdded={() => {
          fetchStats();
          onBusinessUpdated?.();
        }}
        preselectedBusinessId={businessId || undefined}
      />

      <AdminEditProductModal
        product={editingProduct as any}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onProductUpdated={() => {
          fetchStats();
          onBusinessUpdated?.();
        }}
      />

      <AdminManageCategoriesModal
        businessId={business?.id || null}
        businessOwnerId={business?.user_id || null}
        businessName={business?.business_name || ''}
        open={manageCategoriesOpen}
        onOpenChange={setManageCategoriesOpen}
      />
    </Dialog>
  );
}
