import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, 
  BarChart3,
  Package,
  ShoppingCart,
  Settings,
  Eye,
  Upload,
  Save,
  Loader2,
  Store,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Truck,
  DollarSign,
  TrendingUp,
  Users,
  Bell,
  Download,
  Plus,
  Check,
  X,
  AlertCircle,
  Star,
  Calendar,
  FileText,
  CreditCard,
  Clock,
  UserPlus,
  Target,
  PieChart
} from "lucide-react";
import LocationSelector from "@/components/LocationSelector";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
import type { Business } from "@/types/business";


interface OrderItem {
  id: string;
  orderId: string;
  product: string;
  customer: string;
  customerPhone: string;
  donor: string;
  amount: number;
  status: string;
  type: "pickup" | "delivery";
  address: string;
  date: string;
  rawDate: string;
  notes: string;
}

interface BusinessAccount {
  id?: string;
  business_name: string;
  business_type?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  email?: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  delivery_zones: Array<{ name: string; radius: number; cost: number }>;
  payment_info: { mobile_money?: string; account_holder?: string };
  delivery_settings: { free_delivery_threshold: number; standard_cost: number };
}

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: ""
  });

  // Business settings states
  const [businessAccount, setBusinessAccount] = useState<BusinessAccount>({
    business_name: "",
    business_type: "",
    phone: "",
    address: "",
    description: "",
    logo_url: "",
    website_url: "",
    email: "",
    opening_hours: {
      lundi: { open: "09:00", close: "18:00" },
      mardi: { open: "09:00", close: "18:00" },
      mercredi: { open: "09:00", close: "18:00" },
      jeudi: { open: "09:00", close: "18:00" },
      vendredi: { open: "09:00", close: "18:00" },
      samedi: { open: "09:00", close: "18:00" },
      dimanche: { open: "09:00", close: "18:00", closed: true }
    },
    delivery_zones: [{ name: "Zone standard", radius: 15, cost: 2000 }],
    payment_info: { mobile_money: "", account_holder: "" },
    delivery_settings: { free_delivery_threshold: 25000, standard_cost: 2000 }
  });
  
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingOpeningHours, setEditingOpeningHours] = useState(false);

  // Multi-business states
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  useEffect(() => {
    document.title = "Dashboard Business | JOIE DE VIVRE";
    loadBusinessAccount();
    loadBusinesses();
  }, [user]);

  // Load business account data
  const loadBusinessAccount = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_business_account', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const businessData = data[0];
        setBusinessAccount({
          id: businessData.id,
          business_name: businessData.business_name || "",
          business_type: businessData.business_type || "",
          phone: businessData.phone || "",
          address: businessData.address || "",
          description: businessData.description || "",
          logo_url: businessData.logo_url || "",
          website_url: businessData.website_url || "",
          email: businessData.email || "",
          opening_hours: (businessData.opening_hours && typeof businessData.opening_hours === 'object') 
            ? businessData.opening_hours as Record<string, { open: string; close: string; closed?: boolean }>
            : {
                lundi: { open: "09:00", close: "18:00" },
                mardi: { open: "09:00", close: "18:00" },
                mercredi: { open: "09:00", close: "18:00" },
                jeudi: { open: "09:00", close: "18:00" },
                vendredi: { open: "09:00", close: "18:00" },
                samedi: { open: "09:00", close: "18:00" },
                dimanche: { open: "09:00", close: "18:00", closed: true }
              },
          delivery_zones: (businessData.delivery_zones && Array.isArray(businessData.delivery_zones)) 
            ? businessData.delivery_zones as Array<{ name: string; radius: number; cost: number }>
            : [{ name: "Zone standard", radius: 15, cost: 2000 }],
          payment_info: (businessData.payment_info && typeof businessData.payment_info === 'object') 
            ? businessData.payment_info as { mobile_money?: string; account_holder?: string }
            : { mobile_money: "", account_holder: "" },
          delivery_settings: (businessData.delivery_settings && typeof businessData.delivery_settings === 'object') 
            ? businessData.delivery_settings as { free_delivery_threshold: number; standard_cost: number }
            : { free_delivery_threshold: 25000, standard_cost: 2000 }
        });
      }
    } catch (error) {
      console.error('Error loading business account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations business",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Save business account data
  const saveBusinessAccount = async (section?: string) => {
    if (!user?.id) return;

    try {
      setSaving(section || 'all');
      const { error } = await supabase.rpc('upsert_business_account', {
        p_user_id: user.id,
        p_business_name: businessAccount.business_name,
        p_business_type: businessAccount.business_type,
        p_phone: businessAccount.phone,
        p_address: businessAccount.address,
        p_description: businessAccount.description,
        p_logo_url: businessAccount.logo_url,
        p_website_url: businessAccount.website_url,
        p_email: businessAccount.email,
        p_opening_hours: businessAccount.opening_hours,
        p_delivery_zones: businessAccount.delivery_zones,
        p_payment_info: businessAccount.payment_info,
        p_delivery_settings: businessAccount.delivery_settings
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: `${section ? `Paramètres ${section}` : 'Paramètres business'} sauvegardés avec succès`,
      });
    } catch (error) {
      console.error('Error saving business account:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  // Update business account state
  const updateBusinessAccount = (updates: Partial<BusinessAccount>) => {
    setBusinessAccount(prev => ({ ...prev, ...updates }));
  };

  // Update opening hours
  const updateOpeningHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setBusinessAccount(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }));
  };

  // Load businesses
  const loadBusinesses = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingBusinesses(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Cast and format the data properly
      const formattedBusinesses: Business[] = (data || []).map(business => ({
        id: business.id,
        business_name: business.business_name,
        business_type: business.business_type || "",
        phone: business.phone,
        address: business.address,
        description: business.description,
        logo_url: business.logo_url,
        website_url: business.website_url,
        email: business.email,
        opening_hours: (business.opening_hours && typeof business.opening_hours === 'object') 
          ? business.opening_hours as Record<string, { open: string; close: string; closed?: boolean }>
          : {
              lundi: { open: "09:00", close: "18:00" },
              mardi: { open: "09:00", close: "18:00" },
              mercredi: { open: "09:00", close: "18:00" },
              jeudi: { open: "09:00", close: "18:00" },
              vendredi: { open: "09:00", close: "18:00" },
              samedi: { open: "09:00", close: "18:00" },
              dimanche: { open: "09:00", close: "18:00", closed: true }
            },
        delivery_zones: (business.delivery_zones && Array.isArray(business.delivery_zones)) 
          ? business.delivery_zones as Array<{ name: string; radius: number; cost: number; active?: boolean }>
          : [{ name: "Zone standard", radius: 15, cost: 2000, active: true }],
        payment_info: (business.payment_info && typeof business.payment_info === 'object') 
          ? business.payment_info as { mobile_money?: string; account_holder?: string }
          : { mobile_money: "", account_holder: "" },
        delivery_settings: (business.delivery_settings && typeof business.delivery_settings === 'object') 
          ? business.delivery_settings as { free_delivery_threshold: number; standard_cost: number }
          : { free_delivery_threshold: 25000, standard_cost: 2000 },
        is_active: business.is_active,
        created_at: business.created_at,
        updated_at: business.updated_at
      }));
      
      setBusinesses(formattedBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les business",
        variant: "destructive"
      });
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // Handle edit business
  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setIsAddBusinessModalOpen(true);
  };

  // Handle business modal close
  const handleBusinessModalClose = () => {
    setIsAddBusinessModalOpen(false);
    setEditingBusiness(null);
  };

  // Handle business added/updated
  const handleBusinessChanged = () => {
    loadBusinesses();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleProductSubmit = () => {
    // Logic to add new product
    console.log("Adding product:", newProduct);
    setNewProduct({ name: "", description: "", price: "", category: "", stock: "" });
  };

  const stats = {
    totalSales: 850000,
    monthlyOrders: 42,
    activeProducts: 12,
    rating: 4.8,
    commission: 127500,
    netRevenue: 722500
  };

  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Load real orders from database with customer info
  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.id) {
        console.log('No user ID available, skipping orders load');
        return;
      }

      try {
        setLoadingOrders(true);
        setOrdersError(null);
        console.log('Loading orders for business owner:', user.id);

        // First get orders for products owned by this business
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            id,
            total_amount,
            currency,
            status,
            delivery_address,
            created_at,
            notes,
            user_id,
            order_items!inner(
              id,
              product_id,
              quantity,
              unit_price,
              products!inner(
                name, 
                description,
                business_owner_id
              )
            )
          `)
          .eq('order_items.products.business_owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (ordersError) {
          console.error('Error querying orders:', ordersError);
          throw ordersError;
        }

        console.log('Found orders:', orders?.length || 0);

        if (orders && orders.length > 0) {
          // Get user profiles for all user_ids in the orders
          const userIds = orders.map(order => order.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, phone')
            .in('user_id', userIds);

          if (profilesError) {
            console.error('Error loading profiles:', profilesError);
          }

          const formattedOrders: OrderItem[] = orders.map(order => {
            const deliveryInfo = order.delivery_address as any;
            const userProfile = profiles?.find(p => p.user_id === order.user_id);
            
            const customerName = userProfile 
              ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
              : 'Client';
            const customerPhone = deliveryInfo?.phone || userProfile?.phone || '';
            
            const products = order.order_items?.map(item => 
              item.products?.name || `Produit #${item.product_id}`
            ).join(', ') || 'Produits commandés';

            return {
              id: `CMD-${order.id.substring(0, 8)}`,
              orderId: order.id,
              product: products,
              customer: customerName,
              customerPhone: customerPhone,
              donor: customerName, // Same as customer for now
              amount: order.total_amount,
              status: order.status === "pending" ? "new" : order.status,
              type: (deliveryInfo?.address ? "delivery" : "pickup") as "pickup" | "delivery",
              address: deliveryInfo?.address || '',
              date: new Date(order.created_at).toLocaleString('fr-FR'),
              rawDate: order.created_at,
              notes: order.notes || ''
            };
          });

          setRecentOrders(formattedOrders);
          console.log('Loaded orders successfully:', formattedOrders.length);
        } else {
          setRecentOrders([]);
          console.log('No orders found for this business owner');
        }
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrdersError('Impossible de charger les commandes. Veuillez réessayer.');
        toast({
          title: "Erreur",
          description: "Impossible de charger les commandes",
          variant: "destructive"
        });
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();

    // Subscribe to real-time updates for new orders
    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Nouvelle commande reçue:', payload);
          loadOrders(); // Reload to get complete data with joins
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Commande mise à jour:', payload);
          loadOrders(); // Reload to reflect status changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setRecentOrders(prev => 
        prev.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Function to call customer
  const handleCallCustomer = (order: OrderItem) => {
    if (order.customerPhone) {
      window.open(`tel:${order.customerPhone}`, '_self');
    }
  };

  const products = [
    {
      id: 1,
      name: "Bracelet Doré Élégance",
      category: "Bijoux",
      price: 15000,
      stock: 8,
      sales: 24,
      status: "active"
    },
    {
      id: 2,
      name: "Parfum Roses de Yamoussoukro",
      category: "Parfums",
      price: 35000,
      stock: 5,
      sales: 12,
      status: "active"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-orange-500";
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-green-500";
      case "delivered": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Nouvelle";
      case "confirmed": return "Confirmée";
      case "preparing": return "En préparation";
      case "ready": return "Prêt";
      case "delivered": return "Livré";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Dashboard Business</h1>
              <p className="text-sm text-muted-foreground">Boutique Élégance - Cocody, Abidjan</p>
            </div>
            <Badge className="ml-auto bg-green-500">Actif</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 text-xs">
            <TabsTrigger value="overview" className="flex flex-col gap-1">
              <Eye className="h-4 w-4" />
              <span>Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex flex-col gap-1">
              <Package className="h-4 w-4" />
              <span>Produits</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex flex-col gap-1">
              <ShoppingCart className="h-4 w-4" />
              <span>Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1">
              <Settings className="h-4 w-4" />
              <span>Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ventes totales</p>
                    <p className="text-2xl font-bold">{stats.totalSales.toLocaleString()} F</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes du mois</p>
                    <p className="text-2xl font-bold">{stats.monthlyOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits actifs</p>
                    <p className="text-2xl font-bold">{stats.activeProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Commission et revenus */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold mb-4">Résumé financier</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ventes brutes</span>
                  <span className="font-medium">{stats.totalSales.toLocaleString()} F</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission JOIE DE VIVRE (15%)</span>
                  <span className="font-medium text-red-600">-{stats.commission.toLocaleString()} F</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-medium">Revenus nets</span>
                  <span className="font-medium text-green-600">{stats.netRevenue.toLocaleString()} F</span>
                </div>
              </div>
            </Card>

            {/* Commandes et Cagnottes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Commandes récentes</h3>
                  <Button size="sm" variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </Button>
                </div>
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-3">
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
                        {order.type === "pickup" ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Retrait sur place
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            Livraison {order.amount > 25000 && "(Gratuite)"}
                          </span>
                        )}
                      </div>
                    </div>
                     {order.status === "new" && (
                       <Button 
                         size="sm" 
                         className="w-full mt-2"
                         onClick={() => handleCallCustomer(order)}
                       >
                         <Phone className="h-4 w-4 mr-2" />
                         Appeler le client ({order.customerPhone || 'Non disponible'})
                       </Button>
                     )}
                  </div>
                ))}
              </div>
              </Card>

              {/* Cagnottes en cours */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Cagnottes en cours</h3>
                  <Button size="sm" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Voir toutes
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">Bracelet pour Fatou</div>
                        <div className="text-xs text-muted-foreground">Créé par Kofi Asante</div>
                      </div>
                      <Badge className="bg-orange-500">En cours</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Objectif:</span>
                        <span className="font-medium">15 000 F</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Collecté:</span>
                        <span className="font-medium text-green-600">8 500 F</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full" style={{width: '57%'}}></div>
                      </div>
                      <div className="text-xs text-muted-foreground">5 contributeurs • 3 jours restants</div>
                      <div className="text-xs text-orange-600 font-medium mt-1">Besoin de 6 500 F pour atteindre l'objectif</div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-3 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">Parfum pour Aisha</div>
                        <div className="text-xs text-muted-foreground">Créé par Mamadou Diallo</div>
                      </div>
                      <Badge className="bg-green-500">Objectif atteint!</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Objectif:</span>
                        <span className="font-medium">35 000 F</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Collecté:</span>
                        <span className="font-medium text-green-600">35 000 F</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full w-full"></div>
                      </div>
                      <div className="text-xs text-muted-foreground">8 contributeurs</div>
                    </div>
                    <Button size="sm" className="w-full mt-2 bg-green-500 hover:bg-green-600">
                      <Phone className="h-4 w-4 mr-2" />
                      Contacter la bénéficiaire
                    </Button>
                  </div>

                  <div className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-sm">Montre connectée pour Koffi</div>
                        <div className="text-xs text-muted-foreground">Créé par Sarah Kouadio</div>
                      </div>
                      <Badge className="bg-purple-500">Nouveau</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Objectif:</span>
                        <span className="font-medium">85 000 F</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Collecté:</span>
                        <span className="font-medium text-purple-600">25 000 F</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '29%'}}></div>
                      </div>
                      <div className="text-xs text-muted-foreground">3 contributeurs • 5 jours restants</div>
                      <div className="text-xs text-purple-600 font-medium mt-1">Progression: 29%</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Gestion des produits */}
          <TabsContent value="products" className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Gestion des produits</h2>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un produit
              </Button>
            </div>

            {/* Formulaire d'ajout de produit */}
            <Card className="p-4 mb-6">
              <h3 className="font-medium mb-4">Ajouter un nouveau produit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom du produit</label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    placeholder="Ex: Bracelet Doré Élégance"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie</label>
                  <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bijoux">Bijoux</SelectItem>
                      <SelectItem value="parfums">Parfums</SelectItem>
                      <SelectItem value="tech">Tech</SelectItem>
                      <SelectItem value="mode">Mode</SelectItem>
                      <SelectItem value="artisanat">Artisanat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Prix (FCFA)</label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock</label>
                  <Input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Images du produit</label>
                <Input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                {selectedFiles && (
                  <p className="text-sm text-green-600 mt-1">
                    {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>
                )}
              </div>
              <Button onClick={handleProductSubmit} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter le produit
              </Button>
            </Card>

            {/* Liste des produits existants */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Mes produits ({products.length})</h3>
              <div className="space-y-3">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4">
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
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Gestion des commandes */}
          <TabsContent value="orders" className="mt-6">
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
              {loadingOrders ? (
                <Card className="p-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Chargement des commandes...</span>
                  </div>
                </Card>
              ) : ordersError ? (
                <Card className="p-8">
                  <div className="flex items-center justify-center text-red-600">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span>{ordersError}</span>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    className="mt-4 mx-auto block"
                  >
                    Réessayer
                  </Button>
                </Card>
              ) : recentOrders.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="space-y-4">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-lg">Aucune commande pour le moment</h3>
                      <p className="text-muted-foreground">
                        Les commandes pour vos produits apparaîtront ici. Assurez-vous d'avoir ajouté des produits actifs.
                      </p>
                    </div>
                    <Button onClick={() => window.location.hash = '#products'} variant="outline">
                      <Package className="h-4 w-4 mr-2" />
                      Gérer mes produits
                    </Button>
                  </div>
                </Card>
              ) : (
                recentOrders.map((order) => (
                <Card key={order.id} className="p-4">
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
                       <h4 className="font-medium mb-2">Informations client</h4>
                       <div className="space-y-1 text-sm">
                         <div><strong>Nom:</strong> {order.customer}</div>
                         <div className="flex items-center gap-2">
                           <strong>Téléphone:</strong> 
                           <span>{order.customerPhone || 'Non disponible'}</span>
                           {order.customerPhone && (
                             <Button 
                               size="sm" 
                               variant="ghost" 
                               className="h-6 p-1"
                               onClick={() => handleCallCustomer(order)}
                             >
                               <Phone className="h-3 w-3" />
                             </Button>
                           )}
                         </div>
                         {order.type === "delivery" && order.address && (
                           <div><strong>Adresse:</strong> {order.address}</div>
                         )}
                         {order.notes && (
                           <div><strong>Notes:</strong> {order.notes}</div>
                         )}
                       </div>
                     </div>
                  </div>

                   <div className="flex gap-2">
                     {order.status === "new" && (
                       <>
                         <Button 
                           size="sm" 
                           className="flex-1"
                           onClick={() => handleCallCustomer(order)}
                         >
                           <Phone className="h-4 w-4 mr-2" />
                           Appeler le client
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={() => updateOrderStatus(order.orderId, "confirmed")}
                         >
                           <Check className="h-4 w-4 mr-2" />
                           Confirmer
                         </Button>
                       </>
                     )}
                     {order.status === "confirmed" && (
                       <Button 
                         size="sm" 
                         className="flex-1"
                         onClick={() => updateOrderStatus(order.orderId, "preparing")}
                       >
                         Marquer en préparation
                       </Button>
                     )}
                     {order.status === "preparing" && (
                       <Button 
                         size="sm" 
                         className="flex-1"
                         onClick={() => updateOrderStatus(order.orderId, "ready")}
                       >
                         Marquer comme prêt
                       </Button>
                     )}
                     {order.status === "ready" && (
                       <Button 
                         size="sm" 
                         className="flex-1"
                         onClick={() => updateOrderStatus(order.orderId, "delivered")}
                       >
                         Marquer comme livré/retiré
                       </Button>
                     )}
                   </div>
                 </Card>
               ))
              )}
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Analytics & Statistiques</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Statistiques des ventes par produit */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Ventes par produit</h3>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <span className="text-sm">{product.name}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{product.sales} ventes</div>
                        <div className="text-xs text-muted-foreground">
                          {(product.sales * product.price).toLocaleString()} F
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Répartition des modes de livraison */}
              <Card className="p-4">
                <h3 className="font-medium mb-4">Modes de récupération</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Retrait sur place</span>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Livraison</span>
                    </div>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Performance mensuelle */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Performance mensuelle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">42</div>
                  <div className="text-sm text-muted-foreground">Commandes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">850K</div>
                  <div className="text-sm text-muted-foreground">Revenus (F)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">4.8</div>
                  <div className="text-sm text-muted-foreground">Note moyenne</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">97%</div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Paramètres du compte</h2>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Informations de base */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Informations de la boutique</h3>
                    <Button 
                      size="sm" 
                      onClick={() => saveBusinessAccount('boutique')}
                      disabled={saving === 'boutique'}
                    >
                      {saving === 'boutique' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="business_name">Nom de la boutique</Label>
                      <Input
                        id="business_name"
                        value={businessAccount.business_name}
                        onChange={(e) => updateBusinessAccount({ business_name: e.target.value })}
                        placeholder="Ex: Boutique Élégance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_type">Type d'activité</Label>
                      <Select 
                        value={businessAccount.business_type || ""} 
                        onValueChange={(value) => updateBusinessAccount({ business_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bijoux">Bijoux & Accessoires</SelectItem>
                          <SelectItem value="parfums">Parfums & Cosmétiques</SelectItem>
                          <SelectItem value="mode">Mode & Vêtements</SelectItem>
                          <SelectItem value="tech">Tech & Électronique</SelectItem>
                          <SelectItem value="artisanat">Artisanat</SelectItem>
                          <SelectItem value="gastronomie">Gastronomie</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={businessAccount.phone || ""}
                        onChange={(e) => updateBusinessAccount({ phone: e.target.value })}
                        placeholder="+225 01 23 45 67 89"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={businessAccount.email || ""}
                        onChange={(e) => updateBusinessAccount({ email: e.target.value })}
                        placeholder="contact@boutique-elegance.ci"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <LocationSelector
                        value={businessAccount.address || ""}
                        onChange={(value) => updateBusinessAccount({ address: value })}
                        label="Adresse complète"
                        placeholder="Sélectionner ou ajouter un lieu"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="description">Description de votre boutique</Label>
                      <Textarea
                        id="description"
                        value={businessAccount.description || ""}
                        onChange={(e) => updateBusinessAccount({ description: e.target.value })}
                        placeholder="Décrivez votre boutique, vos spécialités..."
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>

                {/* Horaires d'ouverture */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Horaires d'ouverture</h3>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingOpeningHours(!editingOpeningHours)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {editingOpeningHours ? "Arrêter" : "Modifier les horaires"}
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => saveBusinessAccount('horaires')}
                        disabled={saving === 'horaires'}
                      >
                        {saving === 'horaires' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Clock className="h-4 w-4 mr-2" />
                        )}
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries({
                      lundi: "Lundi",
                      mardi: "Mardi", 
                      mercredi: "Mercredi",
                      jeudi: "Jeudi",
                      vendredi: "Vendredi",
                      samedi: "Samedi",
                      dimanche: "Dimanche"
                    }).map(([key, day]) => (
                      <div key={key} className="flex items-center gap-4">
                        <div className="w-20 text-sm font-medium">{day}</div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={businessAccount.opening_hours[key]?.open || "09:00"}
                            onChange={(e) => updateOpeningHours(key, 'open', e.target.value)}
                            className="w-32"
                            disabled={!editingOpeningHours || businessAccount.opening_hours[key]?.closed}
                            style={{ 
                              pointerEvents: (!editingOpeningHours || businessAccount.opening_hours[key]?.closed) ? 'none' : 'auto',
                              opacity: (!editingOpeningHours || businessAccount.opening_hours[key]?.closed) ? 0.6 : 1
                            }}
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={businessAccount.opening_hours[key]?.close || "18:00"}
                            onChange={(e) => updateOpeningHours(key, 'close', e.target.value)}
                            className="w-32"
                            disabled={!editingOpeningHours || businessAccount.opening_hours[key]?.closed}
                            style={{ 
                              pointerEvents: (!editingOpeningHours || businessAccount.opening_hours[key]?.closed) ? 'none' : 'auto',
                              opacity: (!editingOpeningHours || businessAccount.opening_hours[key]?.closed) ? 0.6 : 1
                            }}
                          />
                          <Label className="flex items-center gap-2 ml-4">
                            <input
                              type="checkbox"
                              checked={businessAccount.opening_hours[key]?.closed || false}
                              onChange={(e) => updateOpeningHours(key, 'closed', e.target.checked)}
                              className="w-4 h-4 rounded border border-input bg-background"
                              disabled={!editingOpeningHours}
                              style={{ 
                                pointerEvents: !editingOpeningHours ? 'none' : 'auto',
                                opacity: !editingOpeningHours ? 0.6 : 1
                              }}
                            />
                            Fermé
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                  {editingOpeningHours && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Mode d'édition activé. Modifiez vos horaires puis cliquez sur "Sauvegarder".
                      </p>
                    </div>
                  )}
                </Card>

                {/* Paramètres de livraison */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Paramètres de livraison</h3>
                    <Button 
                      size="sm" 
                      onClick={() => saveBusinessAccount('livraison')}
                      disabled={saving === 'livraison'}
                    >
                      {saving === 'livraison' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Zones de livraison configurables */}
                    <DeliveryZoneManager
                      zones={businessAccount.delivery_zones}
                      onChange={(zones) => updateBusinessAccount({ delivery_zones: zones })}
                    />
                    
                    {/* Paramètres globaux de livraison */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-4">Paramètres globaux</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="delivery_cost">Frais de livraison par défaut (FCFA)</Label>
                          <Input
                            id="delivery_cost"
                            type="number"
                            value={businessAccount.delivery_settings.standard_cost}
                            onChange={(e) => updateBusinessAccount({
                              delivery_settings: {
                                ...businessAccount.delivery_settings,
                                standard_cost: parseInt(e.target.value) || 0
                              }
                            })}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="free_threshold">Livraison gratuite à partir de (FCFA)</Label>
                          <Input
                            id="free_threshold"
                            type="number"
                            value={businessAccount.delivery_settings.free_delivery_threshold}
                            onChange={(e) => updateBusinessAccount({
                              delivery_settings: {
                                ...businessAccount.delivery_settings,
                                free_delivery_threshold: parseInt(e.target.value) || 0
                              }
                            })}
                            min="0"
                          />
                          <div className="text-sm text-muted-foreground mt-1">
                            Les frais de livraison seront gratuits pour les commandes dépassant ce montant
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Informations de paiement */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Informations de paiement</h3>
                    <Button 
                      size="sm" 
                      onClick={() => saveBusinessAccount('paiement')}
                      disabled={saving === 'paiement'}
                    >
                      {saving === 'paiement' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mobile_money">Numéro Mobile Money</Label>
                      <Input
                        id="mobile_money"
                        value={businessAccount.payment_info.mobile_money || ""}
                        onChange={(e) => updateBusinessAccount({
                          payment_info: {
                            ...businessAccount.payment_info,
                            mobile_money: e.target.value
                          }
                        })}
                        placeholder="+225 01 23 45 67 89"
                      />
                      <div className="text-sm text-muted-foreground mt-1">
                        Orange Money, MTN Mobile Money, Moov Money acceptés
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="account_holder">Nom du titulaire du compte</Label>
                      <Input
                        id="account_holder"
                        value={businessAccount.payment_info.account_holder || ""}
                        onChange={(e) => updateBusinessAccount({
                          payment_info: {
                            ...businessAccount.payment_info,
                            account_holder: e.target.value
                          }
                        })}
                        placeholder="Nom complet du titulaire"
                      />
                    </div>
                  </div>
                </Card>

                {/* Actions globales */}
                <div className="flex gap-4">
                  <Button 
                    className="flex-1" 
                    onClick={() => saveBusinessAccount()}
                    disabled={saving !== null}
                  >
                    {saving === 'all' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Sauvegarder tout
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => {
                      // Export business data logic would go here
                      toast({
                        title: "Export",
                        description: "Fonctionnalité d'export en cours de développement"
                      });
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Exporter les données
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pb-20" />
      </main>

      {/* Modals */}
      <AddBusinessModal
        isOpen={isAddBusinessModalOpen}
        onClose={handleBusinessModalClose}
        onBusinessAdded={handleBusinessChanged}
        editingBusiness={editingBusiness}
      />
    </div>
  );
}