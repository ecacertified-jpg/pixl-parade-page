import { useState, useEffect } from "react";
import { ArrowLeft, Phone, MapPin, CreditCard, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CheckoutItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  productId?: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshSession } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("delivery");
  const [donorPhoneNumber, setDonorPhoneNumber] = useState("");
  const [beneficiaryPhoneNumber, setBeneficiaryPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [orderItems, setOrderItems] = useState<CheckoutItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);

  useEffect(() => {
    // Load checkout items from localStorage
    const checkoutData = localStorage.getItem('checkoutItems');
    if (checkoutData) {
      setOrderItems(JSON.parse(checkoutData));
    } else {
      // Default item if no checkout data
      setOrderItems([{
        id: 1,
        name: "Bracelet Doré Élégance",
        description: "Bracelet en or 18 carats avec finitions délicates",
        price: 15000,
        quantity: 1
      }]);
    }
  }, []);

  useEffect(() => {
    // Load all business accounts to map business_owner_id to business_account_id
    const loadBusinessAccounts = async () => {
      console.log('Loading business accounts...');
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, user_id');
      
      if (error) {
        console.error('Error loading business accounts:', error);
      } else {
        console.log('Business accounts loaded:', data);
        setBusinessAccounts(data || []);
      }
    };
    
    loadBusinessAccounts();
  }, []);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 25000 ? 0 : 2500;
  const total = subtotal + shipping;

  // Check if form is valid (both phones and address filled)
  const isFormValid = donorPhoneNumber.trim() !== "" && beneficiaryPhoneNumber.trim() !== "" && address.trim() !== "";

  const handleConfirmOrder = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour passer commande",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Force session refresh to ensure we have a valid, fresh session
      console.log('🔄 Refreshing session...');
      await refreshSession();
      
      // DEBUG: Check authentication state in detail
      console.log('🔍 Starting order creation process...');
      console.log('👤 User from React context:', user?.id, user?.email);
      
      // Verify the refreshed session
      console.log('🔄 Verifying refreshed session...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        throw new Error('Erreur de session. Veuillez vous reconnecter.');
      }
      
      if (!sessionData.session?.user) {
        console.error('❌ No valid session found despite React user state');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      console.log('✅ Valid session found:', sessionData.session.user.id);
      console.log('🔑 Session access token exists:', !!sessionData.session.access_token);
      
      // Verify auth.uid() works by testing a simple query
      console.log('🧪 Testing auth.uid() with a simple query...');
      const { data: testAuth, error: testAuthError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', sessionData.session.user.id)
        .limit(1);
      
      if (testAuthError) {
        console.error('❌ Auth test failed:', testAuthError);
        throw new Error('Problème d\'authentification détecté. Veuillez vous reconnecter.');
      }
      
      console.log('✅ Authentication test passed, proceeding with order...');
      // Get product details to identify business products
      const productIds = orderItems
        .filter(item => item.productId)
        .map(item => item.productId.toString());
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, business_id, business_owner_id")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Get business accounts for products with business_owner_id
      const businessOwnerIds = products?.filter(p => p.business_owner_id).map(p => p.business_owner_id) || [];
      let businessAccounts: any[] = [];
      
      if (businessOwnerIds.length > 0) {
        const { data: accounts, error: accountsError } = await supabase
          .from("business_accounts")
          .select("id, user_id")
          .in("user_id", businessOwnerIds);
        
        if (accountsError) throw accountsError;
        businessAccounts = accounts || [];
      }

      // Create order in database
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          currency: "XOF",
          status: "pending",
          delivery_address: { address, donorPhone: donorPhoneNumber, beneficiaryPhone: beneficiaryPhoneNumber },
          notes: paymentMethod === "delivery" ? "Paiement à la livraison" : "Mobile Money"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      for (const item of orderItems) {
        if (!item.productId) {
          console.error('Missing productId for item:', item);
          throw new Error(`Le produit "${item.name}" n'a pas d'identifiant valide`);
        }
        
        await supabase
          .from("order_items")
          .insert({
            order_id: orderData.id,
            product_id: item.productId.toString(),
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          });
      }

      // Create business orders for products that belong to businesses
      const businessItems = orderItems.filter(item => {
        if (!item.productId) return false;
        const product = products?.find(p => p.id === item.productId.toString());
        return product && (product.business_id || product.business_owner_id);
      });

      console.log('🏪 Found business items:', businessItems);
      console.log('📦 All products:', products);
      console.log('🏢 Business accounts:', businessAccounts);

      if (businessItems.length > 0) {
        console.log('🔄 Processing business items for orders...');
        
        // Group items by business account using business_owner_id mapping
        const itemsByBusinessAccount = businessItems.reduce((acc, item) => {
          const product = products?.find(p => p.id === item.productId?.toString());
          
          console.log('📝 Processing item:', item.name, 'Product found:', product);
          
          if (!product?.business_owner_id) {
            console.error('❌ Product missing business_owner_id:', item.name);
            return acc;
          }
          
          // Find business account by business_owner_id
          const businessAccount = businessAccounts.find(ba => ba.user_id === product.business_owner_id);
          
          if (!businessAccount) {
            console.error('❌ No business account found for owner_id:', product.business_owner_id, 'Product:', item.name);
            throw new Error(`Aucun compte business trouvé pour le propriétaire du produit "${item.name}"`);
          }
          
          const businessAccountId = businessAccount.id;
          console.log('🔍 Found business account for owner_id:', product.business_owner_id, 
                     'account ID:', businessAccountId, 'for product:', item.name);
          
          console.log('➕ Adding item to business account:', businessAccountId);
          if (!acc[businessAccountId]) {
            acc[businessAccountId] = [];
          }
          acc[businessAccountId].push(item);
          
          return acc;
        }, {} as { [businessAccountId: string]: typeof businessItems });

        console.log('📊 Items grouped by business account:', itemsByBusinessAccount);

        // Create business order for each business account
        for (const [businessAccountId, items] of Object.entries(itemsByBusinessAccount)) {
          console.log('🚀 Creating business order for account:', businessAccountId, 'with items:', items.length);
          
          const businessTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          
          const businessOrderData = {
            fund_id: null, // NULL for individual orders
            business_account_id: businessAccountId,
            order_summary: {
              items: items.map(item => ({
                name: item.name,
                description: item.description || '',
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
              })),
              order_id: orderData.id,
              order_type: 'individual',
              customer_info: {
                donor_phone: donorPhoneNumber,
                beneficiary_phone: beneficiaryPhoneNumber
              }
            },
            total_amount: businessTotal,
            currency: "XOF",
            donor_phone: donorPhoneNumber,
            beneficiary_phone: beneficiaryPhoneNumber,
            delivery_address: address,
            payment_method: paymentMethod === "delivery" ? "cash_on_delivery" : "mobile_money",
            status: "pending"
          };
          
          console.log('📤 Inserting business order data:', businessOrderData);
          
          // Refresh session again right before business order creation
          console.log('🔄 Refreshing session before business order insert...');
          await refreshSession();
          const { data: preInsertSession } = await supabase.auth.getSession();
          console.log('🔐 Pre-insert session check:', !!preInsertSession.session?.user);
          
          const { data: businessOrderResult, error: businessOrderError } = await supabase
            .from("business_orders")
            .insert(businessOrderData)
            .select();
          
          if (businessOrderError) {
            console.error('💥 Error creating business order:', businessOrderError);
            console.error('📋 Order data that failed:', businessOrderData);
            console.error('🔍 Error code:', businessOrderError.code);
            console.error('🔍 Error details:', businessOrderError.details);
            console.error('🔍 Error hint:', businessOrderError.hint);
            
            // Provide more specific error messages based on the error type
            if (businessOrderError.code === '42501' || businessOrderError.message.includes('permission')) {
              throw new Error('Erreur d\'autorisation: Votre session a expiré. Veuillez vous reconnecter.');
            } else if (businessOrderError.code === '23503') {
              throw new Error('Référence invalide dans la commande. Veuillez contacter le support.');
            } else {
              throw new Error(`Erreur lors de la création de la commande business: ${businessOrderError.message}`);
            }
          }
          
          console.log('✅ Business order created successfully:', businessOrderResult);
        }
        
        console.log('🎉 All business orders processed successfully!');
      } else {
        console.log('ℹ️ No business items found in this order.');
      }

      // Store order details for confirmation page
      localStorage.setItem('lastOrderDetails', JSON.stringify({
        total,
        donorPhone: donorPhoneNumber,
        beneficiaryPhone: beneficiaryPhoneNumber,
        location: address,
        orderId: orderData.id
      }));

      // Clear cart and checkout data
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutItems');
      window.dispatchEvent(new Event('cartUpdated'));

      // Check if user has a business account and redirect accordingly
      const { data: businessAccount } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (businessAccount) {
        console.log('👔 User has business account, redirecting to business dashboard');
        toast({
          title: "Commande confirmée",
          description: "Votre commande a été créée avec succès",
        });
        navigate('/business-dashboard');
      } else {
        console.log('📦 Regular user, redirecting to order confirmation');
        navigate('/order-confirmation');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Order items:', orderItems);
      
      // Enhanced error handling with specific messages
      let errorTitle = "Erreur";
      let errorDescription = "Impossible de finaliser la commande";
      
      if (error instanceof Error) {
        console.error("🚨 Order creation failed:");
        console.error("📄 Error message:", error.message);
        console.error("📚 Error stack:", error.stack);
        
        if (error.message.includes('Session expirée') || error.message.includes('session a expiré')) {
          errorTitle = "Session expirée";
          errorDescription = "Votre session a expiré. Vous allez être redirigé vers la page de connexion.";
          // Redirect to auth after showing the toast
          setTimeout(() => navigate('/auth'), 2000);
        } else if (error.message.includes('autorisation') || error.message.includes('permission')) {
          errorTitle = "Problème d'authentification";
          errorDescription = "Erreur d'autorisation. Veuillez vous reconnecter.";
        } else if (error.message.includes('business_orders')) {
          errorTitle = "Erreur commande business";
          errorDescription = "Erreur lors de la création de la commande business. Veuillez réessayer.";
        } else if (error.message.includes('uuid')) {
          errorTitle = "Erreur de données";
          errorDescription = "Erreur de format des données. Veuillez contacter le support.";
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          errorTitle = "Problème de sécurité";
          errorDescription = "Erreur de politique de sécurité. Veuillez vous reconnecter.";
        } else {
          errorDescription = `Erreur technique: ${error.message}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Finaliser la commande</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Order summary */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">📋 Résumé de commande</h3>
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>📍</span>
                    <span>Bijouterie Précieuse • Plateau, Abidjan</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">
                    Qté: {item.quantity} • {item.price.toLocaleString()} F
                  </p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{subtotal.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between">
                <span>Livraison</span>
                <span>{shipping === 0 ? "Gratuit" : `${shipping.toLocaleString()} F`}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-primary">
                <span>Total</span>
                <span>{total.toLocaleString()} F</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Delivery information */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            📦 Informations de livraison
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="donorPhone" className="text-sm font-medium">Numéro de téléphone du donateur *</Label>
              <Input 
                id="donorPhone" 
                placeholder="+225 XX XX XX XX XX" 
                value={donorPhoneNumber} 
                onChange={(e) => setDonorPhoneNumber(e.target.value)} 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label htmlFor="beneficiaryPhone" className="text-sm font-medium">Numéro de téléphone du bénéficiaire *</Label>
              <Input 
                id="beneficiaryPhone" 
                placeholder="+225 XX XX XX XX XX" 
                value={beneficiaryPhoneNumber} 
                onChange={(e) => setBeneficiaryPhoneNumber(e.target.value)} 
                className="mt-1" 
              />
            </div>
            
            <div>
              <Label htmlFor="address" className="text-sm font-medium">Adresse de livraison *</Label>
              <Textarea 
                id="address" 
                placeholder="Quartier, rue, points de repère..." 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                className="mt-1 min-h-[80px]" 
              />
            </div>
          </div>
        </Card>

        {/* Payment method */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            📱 Mode de paiement
          </h3>
          
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="delivery" id="delivery" />
              <Label htmlFor="delivery" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-orange-600" />
                </div>
                <span className="font-medium">💰 Paiement à la livraison</span>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="mobile" id="mobile" />
              <Label htmlFor="mobile" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-medium">📱 Mobile Money (Orange/MTN)</span>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Confirm button */}
        <Button 
          onClick={handleConfirmOrder} 
          disabled={isProcessing || !isFormValid} 
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "Traitement..." : `Confirmer la commande individuelle - ${total.toLocaleString()} F`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          En confirmant, vous acceptez nos conditions de vente
        </p>

        <div className="pb-20" />
      </main>
    </div>
  );
}