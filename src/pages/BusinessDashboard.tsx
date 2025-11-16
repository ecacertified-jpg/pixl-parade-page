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
import { useCollectiveFunds } from "@/hooks/useCollectiveFunds";
import { useBusinessProducts } from "@/hooks/useBusinessProducts";
import { useBusinessCollectiveFunds } from "@/hooks/useBusinessCollectiveFunds";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { useBusinessOrderNotifications } from "@/hooks/useBusinessOrderNotifications";
import { ArrowLeft, BarChart3, Package, ShoppingCart, Eye, Upload, Save, Loader2, Store, Edit, Trash2, Phone, MapPin, Truck, DollarSign, TrendingUp, Users, Bell, Download, Plus, Check, X, AlertCircle, Star, Calendar, FileText, CreditCard, Clock, UserPlus, Target, PieChart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPC, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LocationSelector from "@/components/LocationSelector";
import DeliveryZoneManager from "@/components/DeliveryZoneManager";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
import { CollectiveFundBusinessCard } from "@/components/CollectiveFundBusinessCard";
import { BusinessProductCard } from "@/components/BusinessProductCard";
import { BusinessFundCard } from "@/components/BusinessFundCard";
import type { Business } from "@/types/business";
import { BusinessOrdersSection } from "@/components/BusinessOrdersSection";
import { BusinessInitiatedFundsSection } from "@/components/BusinessInitiatedFundsSection";
import { BusinessMetricsBar } from "@/components/BusinessMetricsBar";
import { BusinessMetricCards } from "@/components/BusinessMetricCards";
import { BusinessFinancialSummary } from "@/components/BusinessFinancialSummary";
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
  opening_hours: Record<string, {
    open: string;
    close: string;
    closed?: boolean;
  }>;
  delivery_zones: Array<{
    name: string;
    radius: number;
    cost: number;
  }>;
  payment_info: {
    mobile_money?: string;
    account_holder?: string;
  };
  delivery_settings: {
    free_delivery_threshold: number;
    standard_cost: number;
  };
}
export default function BusinessDashboard() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    funds,
    loading: fundsLoading
  } = useCollectiveFunds();
  const {
    products: businessProducts,
    loading: productsLoading,
    refreshProducts
  } = useBusinessProducts();
  const {
    funds: businessFunds,
    loading: businessFundsLoading
  } = useBusinessCollectiveFunds();
  
  // Enable real-time order notifications for this business
  useBusinessOrderNotifications(businessAccount.id);
  
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
      lundi: {
        open: "09:00",
        close: "18:00"
      },
      mardi: {
        open: "09:00",
        close: "18:00"
      },
      mercredi: {
        open: "09:00",
        close: "18:00"
      },
      jeudi: {
        open: "09:00",
        close: "18:00"
      },
      vendredi: {
        open: "09:00",
        close: "18:00"
      },
      samedi: {
        open: "09:00",
        close: "18:00"
      },
      dimanche: {
        open: "09:00",
        close: "18:00",
        closed: true
      }
    },
    delivery_zones: [{
      name: "Zone standard",
      radius: 15,
      cost: 2000
    }],
    payment_info: {
      mobile_money: "",
      account_holder: ""
    },
    delivery_settings: {
      free_delivery_threshold: 25000,
      standard_cost: 2000
    }
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingOpeningHours, setEditingOpeningHours] = useState(false);

  // Multi-business states
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  
  // Load real analytics with multi-business support
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | undefined>(undefined);
  const { stats, loading: analyticsLoading, businessAccounts: analyticsBusinessAccounts } = useBusinessAnalytics(selectedBusinessId || businessAccount?.id);
  
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
      console.log('📋 [BusinessDashboard] Loading business account for user:', user.id);
      const {
        data,
        error
      } = await supabase.rpc('get_business_account', {
        p_user_id: user.id
      });
      if (error) throw error;
      if (data && data.length > 0) {
        const businessData = data[0];
        const businessAccount = {
          id: businessData.id || user.id,
          // Ensure we always have an ID
          business_name: businessData.business_name || "",
          business_type: businessData.business_type || "",
          phone: businessData.phone || "",
          address: businessData.address || "",
          description: businessData.description || "",
          logo_url: businessData.logo_url || "",
          website_url: businessData.website_url || "",
          email: businessData.email || "",
          opening_hours: businessData.opening_hours && typeof businessData.opening_hours === 'object' ? businessData.opening_hours as Record<string, {
            open: string;
            close: string;
            closed?: boolean;
          }> : {
            lundi: {
              open: "09:00",
              close: "18:00"
            },
            mardi: {
              open: "09:00",
              close: "18:00"
            },
            mercredi: {
              open: "09:00",
              close: "18:00"
            },
            jeudi: {
              open: "09:00",
              close: "18:00"
            },
            vendredi: {
              open: "09:00",
              close: "18:00"
            },
            samedi: {
              open: "09:00",
              close: "18:00"
            },
            dimanche: {
              open: "09:00",
              close: "18:00",
              closed: true
            }
          },
          delivery_zones: businessData.delivery_zones && Array.isArray(businessData.delivery_zones) ? businessData.delivery_zones as Array<{
            name: string;
            radius: number;
            cost: number;
          }> : [{
            name: "Zone standard",
            radius: 15,
            cost: 2000
          }],
          payment_info: businessData.payment_info && typeof businessData.payment_info === 'object' ? businessData.payment_info as {
            mobile_money?: string;
            account_holder?: string;
          } : {
            mobile_money: "",
            account_holder: ""
          },
          delivery_settings: businessData.delivery_settings && typeof businessData.delivery_settings === 'object' ? businessData.delivery_settings as {
            free_delivery_threshold: number;
            standard_cost: number;
          } : {
            free_delivery_threshold: 25000,
            standard_cost: 2000
          }
        };
        console.log('✅ [BusinessDashboard] Business account loaded with ID:', businessAccount.id);
        setBusinessAccount(businessAccount);
      } else {
        console.log('⚠️ [BusinessDashboard] No business account found, using user ID as fallback');

        // Use user.id directly as businessId - simpler approach
        setBusinessAccount({
          id: user.id,
          business_name: 'Mon Commerce',
          business_type: 'commerce',
          phone: '',
          address: '',
          description: '',
          logo_url: '',
          website_url: '',
          email: '',
          opening_hours: {
            lundi: {
              open: "09:00",
              close: "18:00"
            },
            mardi: {
              open: "09:00",
              close: "18:00"
            },
            mercredi: {
              open: "09:00",
              close: "18:00"
            },
            jeudi: {
              open: "09:00",
              close: "18:00"
            },
            vendredi: {
              open: "09:00",
              close: "18:00"
            },
            samedi: {
              open: "09:00",
              close: "18:00"
            },
            dimanche: {
              open: "09:00",
              close: "18:00",
              closed: true
            }
          },
          delivery_zones: [{
            name: "Zone standard",
            radius: 15,
            cost: 2000
          }],
          payment_info: {
            mobile_money: "",
            account_holder: ""
          },
          delivery_settings: {
            free_delivery_threshold: 25000,
            standard_cost: 2000
          }
        });
      }
    } catch (error) {
      console.error('Error loading business account:', error);
      // Even on error, ensure we have a business account with user ID
      if (user?.id) {
        setBusinessAccount({
          id: user.id,
          business_name: 'Mon Commerce',
          business_type: 'commerce',
          phone: '',
          address: '',
          description: '',
          logo_url: '',
          website_url: '',
          email: '',
          opening_hours: {
            lundi: {
              open: "09:00",
              close: "18:00"
            },
            mardi: {
              open: "09:00",
              close: "18:00"
            },
            mercredi: {
              open: "09:00",
              close: "18:00"
            },
            jeudi: {
              open: "09:00",
              close: "18:00"
            },
            vendredi: {
              open: "09:00",
              close: "18:00"
            },
            samedi: {
              open: "09:00",
              close: "18:00"
            },
            dimanche: {
              open: "09:00",
              close: "18:00",
              closed: true
            }
          },
          delivery_zones: [{
            name: "Zone standard",
            radius: 15,
            cost: 2000
          }],
          payment_info: {
            mobile_money: "",
            account_holder: ""
          },
          delivery_settings: {
            free_delivery_threshold: 25000,
            standard_cost: 2000
          }
        });
      }
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
      const {
        error
      } = await supabase.rpc('upsert_business_account', {
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
        description: `${section ? `Paramètres ${section}` : 'Paramètres business'} sauvegardés avec succès`
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
    setBusinessAccount(prev => ({
      ...prev,
      ...updates
    }));
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
      const {
        data,
        error
      } = await supabase.from('business_accounts').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
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
        opening_hours: business.opening_hours && typeof business.opening_hours === 'object' ? business.opening_hours as Record<string, {
          open: string;
          close: string;
          closed?: boolean;
        }> : {
          lundi: {
            open: "09:00",
            close: "18:00"
          },
          mardi: {
            open: "09:00",
            close: "18:00"
          },
          mercredi: {
            open: "09:00",
            close: "18:00"
          },
          jeudi: {
            open: "09:00",
            close: "18:00"
          },
          vendredi: {
            open: "09:00",
            close: "18:00"
          },
          samedi: {
            open: "09:00",
            close: "18:00"
          },
          dimanche: {
            open: "09:00",
            close: "18:00",
            closed: true
          }
        },
        delivery_zones: business.delivery_zones && Array.isArray(business.delivery_zones) ? business.delivery_zones as Array<{
          name: string;
          radius: number;
          cost: number;
          active?: boolean;
        }> : [{
          name: "Zone standard",
          radius: 15,
          cost: 2000,
          active: true
        }],
        payment_info: business.payment_info && typeof business.payment_info === 'object' ? business.payment_info as {
          mobile_money?: string;
          account_holder?: string;
        } : {
          mobile_money: "",
          account_holder: ""
        },
        delivery_settings: business.delivery_settings && typeof business.delivery_settings === 'object' ? business.delivery_settings as {
          free_delivery_threshold: number;
          standard_cost: number;
        } : {
          free_delivery_threshold: 25000,
          standard_cost: 2000
        },
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
    setNewProduct({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: ""
    });
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
        const {
          data: orders,
          error: ordersError
        } = await supabase.from('orders').select(`
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
                business_id
              )
            )
          `).eq('order_items.products.business_id', businessAccount?.id).order('created_at', {
          ascending: false
        }).limit(10);
        if (ordersError) {
          console.error('Error querying orders:', ordersError);
          throw ordersError;
        }
        console.log('Found orders:', orders?.length || 0);
        if (orders && orders.length > 0) {
          // Get user profiles for all user_ids in the orders
          const userIds = orders.map(order => order.user_id);
          const {
            data: profiles,
            error: profilesError
          } = await supabase.from('profiles').select('user_id, first_name, last_name, phone').in('user_id', userIds);
          if (profilesError) {
            console.error('Error loading profiles:', profilesError);
          }
          const formattedOrders: OrderItem[] = orders.map(order => {
            const deliveryInfo = order.delivery_address as any;
            const userProfile = profiles?.find(p => p.user_id === order.user_id);
            const customerName = userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : 'Client';
            const customerPhone = deliveryInfo?.phone || userProfile?.phone || '';
            const products = order.order_items?.map(item => item.products?.name || `Produit #${item.product_id}`).join(', ') || 'Produits commandés';
            return {
              id: `CMD-${order.id.substring(0, 8)}`,
              orderId: order.id,
              product: products,
              customer: customerName,
              customerPhone: customerPhone,
              donor: customerName,
              // Same as customer for now
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
    const channel = supabase.channel('orders-updates').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders'
    }, payload => {
      console.log('Nouvelle commande reçue:', payload);
      loadOrders(); // Reload to get complete data with joins
    }).on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'orders'
    }, payload => {
      console.log('Commande mise à jour:', payload);
      loadOrders(); // Reload to reflect status changes
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Function to update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const {
        error
      } = await supabase.from('orders').update({
        status: newStatus
      }).eq('id', orderId);
      if (error) throw error;

      // Update local state
      setRecentOrders(prev => prev.map(order => order.orderId === orderId ? {
        ...order,
        status: newStatus
      } : order));
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
              <h1 className="text-xl font-semibold">Dashboard Business</h1>
              <p className="text-sm text-muted-foreground">Boutique Élégance - Cocody, Abidjan</p>
            </div>
            <Badge className="ml-auto bg-green-500">Actif</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Business Selector - if multiple businesses */}
        {analyticsBusinessAccounts.length > 1 && (
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-4">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label htmlFor="business-selector" className="text-sm font-medium">
                  Business actif
                </Label>
                <Select 
                  value={selectedBusinessId || businessAccount?.id} 
                  onValueChange={setSelectedBusinessId}
                >
                  <SelectTrigger id="business-selector" className="mt-1">
                    <SelectValue placeholder="Sélectionner un business" />
                  </SelectTrigger>
                  <SelectContent>
                    {analyticsBusinessAccounts.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 text-xs">
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
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="mt-6">
            {/* New Metrics Display */}
            <BusinessMetricsBar stats={stats} />
            <BusinessMetricCards stats={stats} />
            <BusinessFinancialSummary stats={stats} />

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
                     {order.status === "new" && <Button size="sm" className="w-full mt-2" onClick={() => handleCallCustomer(order)}>
                         <Phone className="h-4 w-4 mr-2" />
                         Appeler le client ({order.customerPhone || 'Non disponible'})
                       </Button>}
                  </div>)}
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
                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full" style={{
                        width: '57%'
                      }}></div>
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
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{
                        width: '29%'
                      }}></div>
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
                  <Input value={newProduct.name} onChange={e => setNewProduct({
                  ...newProduct,
                  name: e.target.value
                })} placeholder="Ex: Bracelet Doré Élégance" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Catégorie</label>
                  <Select value={newProduct.category} onValueChange={value => setNewProduct({
                  ...newProduct,
                  category: value
                })}>
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
                  <Input type="number" value={newProduct.price} onChange={e => setNewProduct({
                  ...newProduct,
                  price: e.target.value
                })} placeholder="15000" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Stock</label>
                  <Input type="number" value={newProduct.stock} onChange={e => setNewProduct({
                  ...newProduct,
                  stock: e.target.value
                })} placeholder="10" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={newProduct.description} onChange={e => setNewProduct({
                ...newProduct,
                description: e.target.value
              })} placeholder="Description détaillée du produit..." rows={3} />
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium mb-1 block">Images du produit</label>
                <Input type="file" multiple accept="image/*" onChange={handleFileUpload} />
                {selectedFiles && <p className="text-sm text-green-600 mt-1">
                    {selectedFiles.length} fichier(s) sélectionné(s)
                  </p>}
              </div>
              <Button onClick={handleProductSubmit} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Ajouter le produit
              </Button>
            </Card>

            {/* Liste des produits existants */}
            <div>
              <h3 className="font-medium mb-4">Mes produits ({businessProducts.length})</h3>
              
              {(() => {
              console.log('🎯 [BusinessDashboard] Rendering products section');
              console.log('📊 [BusinessDashboard] Products loading state:', productsLoading);
              console.log('📦 [BusinessDashboard] Business products array:', businessProducts);
              console.log('📦 [BusinessDashboard] Business products length:', businessProducts.length);
              console.log('🏢 [BusinessDashboard] Business account:', businessAccount);
              console.log('👤 [BusinessDashboard] User ID:', user?.id);
              console.log('🆔 [BusinessDashboard] Business ID being passed:', businessAccount.id || user?.id || '');
              return null;
            })()}
              
              {productsLoading ? <Card className="p-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Chargement des produits...</span>
                  </div>
                </Card> : businessProducts.length === 0 ? <Card className="p-8 text-center">
                  <div className="space-y-4">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-lg">Aucun produit ajouté</h3>
                      <p className="text-muted-foreground">
                        Ajoutez vos premiers produits pour commencer à créer des cotisations
                      </p>
                    </div>
                  </div>
                </Card> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessProducts.map(product => {
                console.log('🎨 [BusinessDashboard] === PRODUCT CARD DEBUG ===');
                console.log('🎨 [BusinessDashboard] Product:', product.name);
                console.log('🎨 [BusinessDashboard] businessAccount:', businessAccount);
                console.log('🎨 [BusinessDashboard] businessAccount.id:', businessAccount?.id);
                console.log('🎨 [BusinessDashboard] user:', user);
                console.log('🎨 [BusinessDashboard] user?.id:', user?.id);

                // Force use user.id as businessId - simplify logic
                const finalBusinessId = user?.id || '';
                console.log('🎨 [BusinessDashboard] FORCED businessId (user.id):', finalBusinessId);
                console.log('🎨 [BusinessDashboard] === END DEBUG ===');
                return <BusinessProductCard key={product.id} product={product} businessId={finalBusinessId} onEdit={product => console.log('Edit product:', product)} onDelete={productId => console.log('Delete product:', productId)} />;
              })}
                </div>}
            </div>
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
                    <div><strong>Cotisations:</strong> Les cotisations à 100% apparaissent ci-dessous avec toutes les infos de livraison.</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section Business Collective Funds */}
            {businessFundsLoading ? <Card className="p-4 mb-6">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Chargement des cotisations business...</span>
                </div>
              </Card> : businessFunds.length > 0 && <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Cotisations créées par votre business ({businessFunds.length})
                </h3>
                <div className="space-y-4">
                  {businessFunds.map(fund => <BusinessFundCard key={fund.id} fund={fund} />)}
                </div>
              </div>}

            {/* Section Cotisations initiées */}
            <div className="mb-8">
              <BusinessInitiatedFundsSection />
            </div>

            {/* Section Autres Commandes */}
            <div className="space-y-6">
              
              
              {/* Commandes de cotisations collectives */}
              <div>
                
                <BusinessOrdersSection />
              </div>

              {/* Commandes individuelles */}
              
          </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="mt-6">
            <h2 className="text-xl font-semibold mb-6">Analytics & Statistiques</h2>
            
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Métriques clés */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {stats.averageOrderValue.toLocaleString()} F
                      </div>
                      <div className="text-sm text-muted-foreground">Panier moyen</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taux de conversion</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.monthlyOrders}
                      </div>
                      <div className="text-sm text-muted-foreground">Commandes ce mois</div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.activeProducts}
                      </div>
                      <div className="text-sm text-muted-foreground">Produits actifs</div>
                    </div>
                  </Card>
                </div>

                {/* Graphique des ventes sur 30 jours */}
                <Card className="p-4 mb-6">
                  <h3 className="font-medium mb-4">Évolution des ventes (30 derniers jours)</h3>
                  {stats.dailySales.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.dailySales}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => `${Number(value).toLocaleString()} F`}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Ventes (F)"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Commandes"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Aucune donnée de vente disponible
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Top 5 produits */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-4">Top 5 Produits les plus vendus</h3>
                    {stats.topProducts.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.topProducts} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} F`} />
                          <Bar dataKey="revenue" fill="#8b5cf6" name="Revenus" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Aucune vente de produit enregistrée
                      </div>
                    )}
                  </Card>

                  {/* Répartition par catégorie */}
                  <Card className="p-4">
                    <h3 className="font-medium mb-4">Ventes par catégorie</h3>
                    {stats.salesByCategory.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={250}>
                          <RechartsPC>
                            <Pie
                              data={stats.salesByCategory}
                              dataKey="revenue"
                              nameKey="category"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={(entry) => `${entry.category.substring(0, 15)}${entry.category.length > 15 ? '...' : ''}`}
                            >
                              {stats.salesByCategory.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => `${Number(value).toLocaleString()} F`} />
                          </RechartsPC>
                        </ResponsiveContainer>
                        <div className="mt-4 space-y-2">
                          {stats.salesByCategory.slice(0, 5).map((cat, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ 
                                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5] 
                                  }}
                                />
                                <span>{cat.category}</span>
                              </div>
                              <span className="font-medium">{cat.revenue.toLocaleString()} F</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        Aucune catégorie avec des ventes
                      </div>
                    )}
                  </Card>
                </div>

                {/* Détails des top produits */}
                {stats.topProducts.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-medium mb-4">Détails des produits les plus performants</h3>
                    <div className="space-y-3">
                      {stats.topProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                              {index + 1}
                            </div>
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{product.sales} ventes</div>
                            <div className="text-xs text-muted-foreground">
                              {product.revenue.toLocaleString()} F
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

        </Tabs>

        <div className="pb-20" />
      </main>

      {/* Modals */}
      <AddBusinessModal isOpen={isAddBusinessModalOpen} onClose={handleBusinessModalClose} onBusinessAdded={handleBusinessChanged} editingBusiness={editingBusiness} />
    </div>;
}