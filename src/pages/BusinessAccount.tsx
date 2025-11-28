import { useEffect, useState, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Receipt, Gift, TrendingUp, Package, ShoppingCart, MapPin, Truck, Phone, Bell, Check, X, Edit, Trash2, Download, Plus, AlertCircle, DollarSign, Star, BarChart3, Users, Calendar, FileText, CreditCard, Clock, UserPlus, Target, PieChart, Settings, Smartphone, EyeOff, Eye } from "lucide-react";
import { BusinessProfileDropdown } from "@/components/BusinessProfileDropdown";
import { BusinessInitiatedFundsSection } from "@/components/BusinessInitiatedFundsSection";
import { BusinessOrdersSection } from "@/components/BusinessOrdersSection";
import { BusinessCategoriesSection } from "@/components/BusinessCategoriesSection";
import { AddProductModal } from "@/components/AddProductModal";
import { AddBusinessModal } from "@/components/AddBusinessModal";
import { BusinessCard } from "@/components/BusinessCard";
import { BusinessProductCard } from "@/components/BusinessProductCard";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import { BusinessSelector } from "@/components/BusinessSelector";
import { Business } from "@/types/business";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSelectedBusiness } from "@/contexts/SelectedBusinessContext";
import { useBusinessAnalytics } from "@/hooks/useBusinessAnalytics";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { toast } from "sonner";
export default function BusinessAccount() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBusinessId, selectedBusiness, businesses: contextBusinesses, loading: loadingSelector, selectBusiness, refetch } = useSelectedBusiness();
  
  // Check if business account is approved
  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (!user || loadingSelector) return;

      const { data: businessAccount } = await supabase
        .from('business_accounts')
        .select('is_active')
        .eq('user_id', user.id)
        .maybeSingle();

      if (businessAccount && !businessAccount.is_active) {
        navigate('/business-pending-approval', { replace: true });
      }
    };

    checkApprovalStatus();
  }, [user, loadingSelector, navigate]);
  const { stats: analyticsStats, loading: loadingAnalytics } = useBusinessAnalytics(selectedBusinessId || undefined);
  const { getSetting, settings, isLoading: loadingSettings } = usePlatformSettings();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    stock: number;
    sales: number;
    status: string;
    image_url?: string;
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
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    rating: 0,
    commission: 0,
    netRevenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Recent orders state
interface RecentOrderItem {
  id: string;
  product: string;
  productImage?: string;
  productPrice: number;
  productQuantity: number;
  customer: string;
  customerPhone: string;
  donor: string;
  donorPhone: string;
  amount: number;
  status: string;
  type: "pickup" | "delivery";
  deliveryAddress?: string;
  paymentMethod?: string;
  orderType: "individual" | "collective";
  date: string;
  rawDate: string;
}
  
  const [recentOrders, setRecentOrders] = useState<RecentOrderItem[]>([]);
  const [loadingRecentOrders, setLoadingRecentOrders] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const recentOrdersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('🔄 Business changed to:', selectedBusinessId);
    document.title = "Compte Business | JOIE DE VIVRE";
    if (selectedBusinessId) {
      // CRITICAL: Reset states immediately to prevent showing old data
      console.log('🧹 Resetting products, orders and stats...');
      setProducts([]);
      setOrders([]);
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        rating: 0,
        commission: 0,
        netRevenue: 0
      });
      
      // Then load new data
      loadProducts();
      loadOrders();
      loadRecentOrders();
      loadNewOrdersCount();
    } else {
      setRecentOrders([]);
      setNewOrdersCount(0);
    }
    loadBusinesses();

    // Real-time subscription for new orders
    if (selectedBusinessId) {
      const ordersChannel = supabase
        .channel('business-new-orders')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'business_orders',
          filter: `business_account_id=eq.${selectedBusinessId}`
        }, () => {
          loadRecentOrders();
          loadNewOrdersCount();
          toast.success('Nouvelle commande reçue !', {
            icon: '🎉',
            duration: 5000
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_orders',
          filter: `business_account_id=eq.${selectedBusinessId}`
        }, () => {
          loadRecentOrders();
          loadNewOrdersCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    console.log('📊 Stats calculation triggered', {
      selectedBusinessId,
      productsCount: products.length,
      ordersCount: orders.length,
      loadingProducts,
      loadingOrders
    });
    
    // Only calculate stats when we have a business selected
    // and both loadings are complete
    if (selectedBusinessId && !loadingProducts && !loadingOrders && !loadingSettings) {
      calculateStats();
    }
  }, [products, orders, selectedBusinessId, loadingProducts, loadingOrders, settings, loadingSettings]);
  const loadProducts = async () => {
    if (!user || !selectedBusinessId) return;
    setLoadingProducts(true);
    console.log('🔄 Loading products for user:', user.id, 'business:', selectedBusinessId);
    try {
      // Load ALL products (active and inactive) filtered by business
      const {
        data,
        error
      } = await supabase.from('products').select('*').eq('business_owner_id', user.id).eq('business_account_id', selectedBusinessId).order('created_at', {
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
          description: product.description,
          category: "Produit",
          price: product.price,
          stock: product.stock_quantity || 0,
          sales: 0,
          // This would need to be calculated from orders
          status: product.is_active ? "active" : "inactive",
          image_url: product.image_url
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
      } = await supabase.from('business_accounts').select('*').eq('user_id', user.id).order('created_at', {
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
    // CRITICAL: Validate both user AND selectedBusinessId before proceeding
    if (!user || !selectedBusinessId) {
      console.log('⚠️ Cannot load orders: missing user or business ID');
      return;
    }
    
    // Capture selectedBusinessId to avoid closure issues
    const currentBusinessId = selectedBusinessId;
    console.log('🔄 Loading orders for business:', currentBusinessId);
    
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
              business_owner_id,
              business_account_id
            )
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('❌ Error loading orders:', error);
        return;
      }

      console.log('📦 Total orders fetched from database:', data?.length || 0);
      console.log('🎯 Filtering for business:', currentBusinessId);

      // Filter orders that contain products from the selected business
      const businessOrders = (data || [])
        .filter(order => 
          order.order_items.some(item => 
            item.products && 
            item.products.business_account_id === currentBusinessId
          )
        )
        .map(order => ({
          ...order,
          order_items: order.order_items
            .filter(item => 
              item.products && 
              item.products.business_account_id === currentBusinessId
            )
            .map(item => ({
              ...item,
              product_name: item.products?.name || 'Produit supprimé'
            }))
        }));
      
      console.log('✅ Orders filtered for business', currentBusinessId, ':', businessOrders.length);
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
  // Recharger les données quand le business change
  const handleBusinessChanged = () => {
    loadBusinesses(); // Recharge Config (liste locale)
    refetch(); // ⚡ Recharge le Context global (met à jour le sélecteur automatiquement)
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
  const calculateStats = async () => {
    if (!selectedBusinessId) {
      console.log('⚠️ No business selected, resetting stats to 0');
      setStats({
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        rating: 0,
        commission: 0,
        netRevenue: 0
      });
      setLoadingStats(false);
      return;
    }
    
    console.log('📊 Calculating stats for business:', selectedBusinessId);
    setLoadingStats(true);
    try {
      // 1. Count active products for selected business (can be 0)
      const activeProducts = products.filter(p => p.status === 'active').length;
      console.log('   - Active products:', activeProducts);
      
      // 2. Calculate revenue and orders (can be 0)
      const totalRevenue = orders.reduce((sum, order) => {
        return sum + parseFloat(order.total_amount?.toString() || '0');
      }, 0);
      console.log('   - Total orders:', orders.length);
      console.log('   - Total revenue:', totalRevenue);
      
      const totalOrders = orders.length;
      
      // Get dynamic commission rate from platform settings
      const commissionRateValue = getSetting('commission_rate');
      const commissionRate = (typeof commissionRateValue === 'number' 
        ? commissionRateValue 
        : parseFloat(String(commissionRateValue || '15'))) / 100;
      
      const commission = totalRevenue * commissionRate;
      const netRevenue = totalRevenue - commission;
      
      // 3. Calculate average rating (can be 0)
      const { data: ratings } = await supabase
        .from('product_ratings')
        .select('rating, products!inner(business_account_id)')
        .eq('products.business_account_id', selectedBusinessId);
      
      const averageRating = ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      console.log('   - Average rating:', averageRating);
      
      const newStats = {
        totalProducts: activeProducts,
        totalOrders,
        totalRevenue,
        rating: parseFloat(averageRating.toFixed(1)),
        commission,
        netRevenue
      };
      
      console.log('✅ Stats calculated:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ Error calculating stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Load recent orders from database
  const loadRecentOrders = async () => {
    if (!user?.id || !selectedBusinessId) {
      setRecentOrders([]);
      return;
    }

    try {
      setLoadingRecentOrders(true);

      // Load individual orders
      const { data: individualOrders, error: individualError } = await supabase
        .from('business_orders')
        .select('id, order_summary, total_amount, currency, donor_phone, beneficiary_phone, delivery_address, status, created_at')
        .eq('business_account_id', selectedBusinessId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (individualError) throw individualError;

      // Load collective orders (3-step approach)
      // Step 1: Get product IDs for this business
      const { data: businessProducts, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', selectedBusinessId);

      if (productsError) throw productsError;

      const productIds = businessProducts?.map(p => p.id) || [];

      let collectiveOrders: any[] = [];
      if (productIds.length > 0) {
        // Step 2: Get fund IDs linked to these products
        const { data: funds, error: fundsError } = await supabase
          .from('collective_funds')
          .select('id')
          .in('business_product_id', productIds);

        if (fundsError) throw fundsError;

        const fundIds = funds?.map(f => f.id) || [];

        if (fundIds.length > 0) {
          // Step 3: Get collective fund orders
          const { data: cfOrders, error: cfError } = await supabase
            .from('collective_fund_orders')
            .select('id, order_summary, total_amount, currency, donor_phone, beneficiary_phone, delivery_address, status, created_at')
            .in('fund_id', fundIds)
            .order('created_at', { ascending: false })
            .limit(5);

          if (cfError) throw cfError;
          collectiveOrders = cfOrders || [];
        }
      }

      // Format and combine orders with product images
      const formattedIndividual = await Promise.all(
        (individualOrders || []).map(async (order): Promise<RecentOrderItem> => {
          const summary = order.order_summary as any;
          const productName = summary?.items?.[0]?.product_name || summary?.items?.[0]?.name || 'Produit';
          const productPrice = summary?.items?.[0]?.price || 0;
          const productQuantity = summary?.items?.[0]?.quantity || 1;
          const customerName = summary?.beneficiary_name || 'Client';
          const donorName = summary?.donor_name || 'Donateur';
          const deliveryType = order.delivery_address ? 'delivery' : 'pickup';
          
          // Get product image
          let productImage = undefined;
          const { data: productData } = await supabase
            .from('products')
            .select('image_url')
            .eq('name', productName)
            .eq('business_account_id', selectedBusinessId)
            .single();
          
          if (productData?.image_url) {
            productImage = productData.image_url;
          }
          
          return {
            id: order.id,
            product: productName,
            productImage,
            productPrice,
            productQuantity,
            customer: customerName,
            customerPhone: order.beneficiary_phone,
            donor: donorName,
            donorPhone: order.donor_phone,
            amount: order.total_amount,
            status: order.status,
            type: deliveryType,
            deliveryAddress: order.delivery_address || 'Retrait sur place',
            paymentMethod: 'cash_on_delivery',
            orderType: 'individual',
            date: new Date(order.created_at).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            rawDate: order.created_at
          };
        })
      );

      const formattedCollective = await Promise.all(
        collectiveOrders.map(async (order): Promise<RecentOrderItem> => {
          const summary = order.order_summary as any;
          const productName = summary?.items?.[0]?.product_name || summary?.items?.[0]?.name || 'Produit';
          const productPrice = summary?.items?.[0]?.price || 0;
          const productQuantity = summary?.items?.[0]?.quantity || 1;
          const customerName = summary?.beneficiary_name || 'Client';
          const donorName = summary?.donor_name || 'Donateur';
          const deliveryType = order.delivery_address ? 'delivery' : 'pickup';
          
          // Get product image
          let productImage = undefined;
          const { data: productData } = await supabase
            .from('products')
            .select('image_url')
            .eq('name', productName)
            .eq('business_account_id', selectedBusinessId)
            .single();
          
          if (productData?.image_url) {
            productImage = productData.image_url;
          }
          
          return {
            id: order.id,
            product: productName,
            productImage,
            productPrice,
            productQuantity,
            customer: customerName,
            customerPhone: order.beneficiary_phone,
            donor: donorName,
            donorPhone: order.donor_phone,
            amount: order.total_amount,
            status: order.status,
            type: deliveryType,
            deliveryAddress: order.delivery_address || 'Retrait sur place',
            paymentMethod: 'cash_on_delivery',
            orderType: 'collective',
            date: new Date(order.created_at).toLocaleString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            rawDate: order.created_at
          };
        })
      );

      // Combine and sort
      const allOrders = [...formattedIndividual, ...formattedCollective];
      allOrders.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
      
      setRecentOrders(allOrders.slice(0, 5));
    } catch (error) {
      console.error('❌ Error loading recent orders:', error);
      toast.error('Erreur lors du chargement des commandes récentes');
    } finally {
      setLoadingRecentOrders(false);
    }
  };

  const loadNewOrdersCount = async () => {
    if (!selectedBusinessId) {
      setNewOrdersCount(0);
      return;
    }

    try {
      // Count pending individual orders
      const { count: individualCount } = await supabase
        .from('business_orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_account_id', selectedBusinessId)
        .eq('status', 'pending');

      // Count pending collective orders
      const { data: businessProducts } = await supabase
        .from('products')
        .select('id')
        .eq('business_account_id', selectedBusinessId);

      const productIds = businessProducts?.map(p => p.id) || [];
      let collectiveCount = 0;

      if (productIds.length > 0) {
        const { data: funds } = await supabase
          .from('collective_funds')
          .select('id')
          .in('business_product_id', productIds);

        const fundIds = funds?.map(f => f.id) || [];

        if (fundIds.length > 0) {
          const { count } = await supabase
            .from('collective_fund_orders')
            .select('*', { count: 'exact', head: true })
            .in('fund_id', fundIds)
            .eq('status', 'pending');

          collectiveCount = count || 0;
        }
      }

      setNewOrdersCount((individualCount || 0) + collectiveCount);
    } catch (error) {
      console.error('Error loading new orders count:', error);
    }
  };

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
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="p-2 flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Mon Espace Business</h1>
                <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                  
                  <BusinessSelector />
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Statut du compte */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center">
              {loadingStats ? (
                <div className="animate-pulse h-6 bg-muted rounded w-12 mx-auto"></div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalProducts}</div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">Produits</div>
            </div>
            <div className="text-center">
              {loadingStats ? (
                <div className="animate-pulse h-6 bg-muted rounded w-12 mx-auto"></div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-primary">{stats.totalOrders}</div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">Commandes</div>
            </div>
            <div className="text-center">
              {loadingStats ? (
                <div className="animate-pulse h-6 bg-muted rounded w-16 mx-auto"></div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-primary">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">Revenus (F)</div>
            </div>
            <div className="text-center">
              {loadingStats ? (
                <div className="animate-pulse h-6 bg-muted rounded w-10 mx-auto"></div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-primary">{stats.rating || '—'}</div>
              )}
              <div className="text-xs sm:text-sm text-muted-foreground">Note</div>
            </div>
          </div>
        </Card>

        {/* Dashboard avec onglets */}
        <Tabs defaultValue="vue-ensemble" className="w-full">
          <TabsList className="grid grid-cols-5 text-xs mx-0 my-0 px-0 py-0">
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
                    {loadingStats ? (
                      <div className="animate-pulse h-8 bg-muted rounded w-24 mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} F</p>
                    )}
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commandes du mois</p>
                    {loadingStats ? (
                      <div className="animate-pulse h-8 bg-muted rounded w-16 mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    )}
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Produits actifs</p>
                    {loadingStats ? (
                      <div className="animate-pulse h-8 bg-muted rounded w-16 mt-1"></div>
                    ) : (
                      <p className="text-2xl font-bold">{stats.totalProducts}</p>
                    )}
                  </div>
                  <Package className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>

            {/* Résumé financier */}
            <Card className="p-4 mb-6">
              <h3 className="font-semibold mb-4">Résumé financier</h3>
              {loadingStats ? (
                <div className="space-y-3">
                  <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
                  <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
                  <div className="animate-pulse h-4 bg-muted rounded w-full"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Ventes brutes</span>
                    <span className="font-medium text-sm">{stats.totalRevenue.toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission {String(getSetting('platform_name') || 'JOIE DE VIVRE')} ({Number(getSetting('commission_rate') || 15)}%)</span>
                    <span className="text-red-600 font-normal text-xs">-{stats.commission.toLocaleString()} F</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-medium">Revenus nets</span>
                    <span className="font-medium text-green-600">{stats.netRevenue.toLocaleString()} F</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Commandes récentes */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Commandes récentes</h3>
              <Button 
                size="sm" 
                variant="outline" 
                className="relative"
                onClick={() => {
                  recentOrdersRef.current?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                  if (newOrdersCount > 0) {
                    toast.info(`Vous avez ${newOrdersCount} commande(s) en attente`, {
                      duration: 3000
                    });
                  }
                }}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {newOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                    {newOrdersCount}
                  </span>
                )}
              </Button>
              </div>
              <div className="space-y-3" ref={recentOrdersRef}>
                {loadingRecentOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Chargement des commandes...</p>
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune commande récente pour ce business</p>
                  </div>
                ) : (
                  recentOrders.map(order => (
                    <Card key={order.id} className="p-4 space-y-3">
                      {/* En-tête */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {order.orderType === 'individual' ? 'Commande individuelle' : 'Commande collective'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-primary">
                              #{order.id.slice(0, 6)}
                            </span>
                            <span className="text-xs text-muted-foreground">{order.date}</span>
                          </div>
                        </div>
                        <Badge 
                          className={`${getStatusColor(order.status)} text-white`}
                          variant="secondary"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {getStatusText(order.status)}
                        </Badge>
                      </div>

                      {/* Produit avec image */}
                      <div className="flex items-center gap-3 py-2 border-y">
                        {order.productImage ? (
                          <img 
                            src={order.productImage} 
                            alt={order.product}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{order.product}</div>
                          <div className="text-sm text-muted-foreground">
                            Quantité: {order.productQuantity} × {order.productPrice.toLocaleString()} XOF
                          </div>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-2xl font-bold text-primary">
                          {order.amount.toLocaleString()} XOF
                        </span>
                      </div>

                      {/* Détails avec icônes */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Donateur:</span>
                          <span className="font-medium">{order.donorPhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Bénéficiaire:</span>
                          <span className="font-medium">{order.customerPhone}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Adresse:</span>
                          <span className="font-medium">{order.deliveryAddress}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Paiement:</span>
                          <span className="font-medium">
                            {order.paymentMethod === 'cash_on_delivery' ? 'Cash à la livraison' : order.paymentMethod}
                          </span>
                        </div>
                      </div>

                      {/* Bouton d'action pour commandes en attente */}
                      {order.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => window.open(`tel:${order.customerPhone}`, '_self')}
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Appeler le client
                        </Button>
                      )}
                    </Card>
                  ))
                )}
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
              
              {loadingProducts ? <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Chargement des produits...</div>
                </div> : products.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun produit ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter" pour créer votre premier produit</p>
                </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => {
                // Transform product data to match BusinessProductCard interface
                const transformedProduct = {
                  id: product.id,
                  name: product.name,
                  description: product.description || product.category,
                  price: product.price,
                  currency: 'XOF',
                  business_owner_id: user?.id || '',
                  category_name: product.category,
                  stock: product.stock,
                  is_active: product.status === 'active',
                  image_url: product.image_url
                };
                return <BusinessProductCard key={product.id} product={transformedProduct} businessId={user?.id} onEdit={product => handleEditProduct(product.id)} onDelete={productId => handleDeleteProduct(productId)} />;
              })}
                </div>}
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
              
              
              {/* Commandes de cotisations collectives */}
              <div>
                
                <BusinessOrdersSection />
              </div>

              {/* Commandes individuelles */}
              <div>
                
                
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
                {loadingAnalytics ? (
                  <div className="space-y-4">
                    <div className="animate-pulse h-12 bg-muted rounded"></div>
                    <div className="animate-pulse h-12 bg-muted rounded"></div>
                  </div>
                ) : analyticsStats.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {analyticsStats.topProducts.slice(0, 5).map((product, index) => {
                      const totalSales = analyticsStats.topProducts.reduce((sum, p) => sum + p.sales, 0);
                      const percentage = totalSales > 0 ? Math.round((product.sales / totalSales) * 100) : 0;
                      return (
                        <div key={product.id}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{product.name}</span>
                            <span>{product.sales} ventes ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune vente enregistrée</p>
                )}
              </Card>

              <Card className="p-4">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Modes de livraison
                </h3>
                {loadingAnalytics ? (
                  <div className="space-y-3">
                    <div className="animate-pulse h-8 bg-muted rounded"></div>
                    <div className="animate-pulse h-8 bg-muted rounded"></div>
                  </div>
                ) : (analyticsStats.deliveryStats.pickup.count + analyticsStats.deliveryStats.delivery.count) > 0 ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Retrait sur place
                      </span>
                      <span className="font-medium">
                        {Math.round((analyticsStats.deliveryStats.pickup.count / (analyticsStats.deliveryStats.pickup.count + analyticsStats.deliveryStats.delivery.count)) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm flex items-center gap-2">
                        <Truck className="h-3 w-3" />
                        Livraison
                      </span>
                      <span className="font-medium">
                        {Math.round((analyticsStats.deliveryStats.delivery.count / (analyticsStats.deliveryStats.pickup.count + analyticsStats.deliveryStats.delivery.count)) * 100)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune commande enregistrée</p>
                )}
              </Card>
            </div>

            {/* Performance mensuelle */}
            <Card className="p-4">
              <h3 className="font-medium mb-4">Performance mensuelle</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  {loadingStats ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-12 mx-auto"></div>
                  ) : (
                    <div className="text-2xl font-bold text-green-600">{stats.totalOrders}</div>
                  )}
                  <div className="text-sm text-muted-foreground">Commandes</div>
                </div>
                <div className="text-center">
                  {loadingStats ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-16 mx-auto"></div>
                  ) : (
                    <div className="text-2xl font-bold text-blue-600">{(stats.totalRevenue / 1000).toFixed(0)}K</div>
                  )}
                  <div className="text-sm text-muted-foreground">Revenus (F)</div>
                </div>
                <div className="text-center">
                  {loadingStats ? (
                    <div className="animate-pulse h-8 bg-muted rounded w-10 mx-auto"></div>
                  ) : (
                    <div className="text-2xl font-bold text-purple-600">{stats.rating || '—'}</div>
                  )}
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
          <TabsContent value="configuration" className="mt-6 space-y-6">
            {/* Section Catégories personnalisées */}
            <BusinessCategoriesSection />

            <div className="flex items-center justify-between">
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

        
      </main>

      <AddProductModal isOpen={isAddProductModalOpen} onClose={() => setIsAddProductModalOpen(false)} onProductAdded={loadProducts} />
      <AddBusinessModal isOpen={isAddBusinessModalOpen} onClose={handleBusinessModalClose} onBusinessAdded={handleBusinessChanged} editingBusiness={editingBusiness} />
      <OrderDetailsModal isOpen={isOrderDetailsModalOpen} onClose={() => {
      setIsOrderDetailsModalOpen(false);
      setSelectedOrder(null);
    }} order={selectedOrder} onOrderConfirmed={handleOrderConfirmed} />
    </div>;
}