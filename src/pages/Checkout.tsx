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
import { isCorruptedSessionError, cleanupCorruptedSession } from "@/utils/authErrorHandler";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { WavePaymentRedirect } from "@/components/WavePaymentRedirect";
import { useShareConversionTracking } from "@/hooks/useShareConversionTracking";
import { CheckoutBreadcrumb } from "@/components/breadcrumbs";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";

interface CheckoutItem {
  id: number | string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  productId?: number;
  vendor?: string;
  locationName?: string;
  image?: string;
  currency?: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, ensureValidSession } = useAuth();
  const { trackConversion } = useGoogleAnalytics();
  const { trackPurchaseConversion } = useShareConversionTracking();
  const [paymentMethod, setPaymentMethod] = useState("delivery");
  const [donorPhoneNumber, setDonorPhoneNumber] = useState("");
  const [beneficiaryPhoneNumber, setBeneficiaryPhoneNumber] = useState("");
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  const [addressDetails, setAddressDetails] = useState(""); // Précisions supplémentaires
  const [orderItems, setOrderItems] = useState<CheckoutItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [isValidatingSession, setIsValidatingSession] = useState(true);
  const [showWaveModal, setShowWaveModal] = useState(false);

  // Validation de session préventive au chargement de la page
  useEffect(() => {
    const validateSessionOnLoad = async () => {
      console.log('🔐 Validating session on Checkout page load...');
      const { valid, session } = await ensureValidSession();
      
      if (!valid || !session) {
        console.log('❌ Invalid session on Checkout load, redirecting...');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      console.log('✅ Session valid on Checkout load');
      setIsValidatingSession(false);
    };
    
    validateSessionOnLoad();
  }, [ensureValidSession, navigate, toast]);

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
    // Skip loading if session is still being validated
    if (isValidatingSession) return;
    
    // Load all business accounts to map business_owner_id to business_account_id
    const loadBusinessAccounts = async () => {
      console.log('Loading business accounts...');
      
      // Vérifier la session avant la requête
      const { valid, session } = await ensureValidSession();
      if (!valid || !session) {
        console.log('❌ Session invalid when loading business accounts');
        navigate('/auth');
        return;
      }
      
      const { data, error } = await supabase
        .from('business_accounts')
        .select('id, user_id');
      
      if (error) {
        console.error('Error loading business accounts:', error);
        // Détecter les sessions corrompues (bad_jwt, missing sub, etc.)
        if (isCorruptedSessionError(error)) {
          console.log('🧹 Corrupted session detected in Checkout, cleaning up...');
          await cleanupCorruptedSession();
          toast({
            title: "Session invalide",
            description: "Votre session était corrompue. Veuillez vous reconnecter.",
            variant: "destructive"
          });
          navigate('/auth');
          return;
        }
        if (error.code === '42501' || error.message?.includes('JWT') || error.code === 'PGRST301') {
          console.log('🔒 RLS/Auth error detected, checking if session is truly expired...');
          const { valid: stillValid } = await ensureValidSession();
          if (!stillValid) {
            toast({
              title: "Session expirée",
              description: "Veuillez vous reconnecter.",
              variant: "destructive"
            });
            navigate('/auth');
          }
        }
      } else {
        console.log('Business accounts loaded:', data);
        setBusinessAccounts(data || []);
      }
    };
    
    loadBusinessAccounts();
  }, [isValidatingSession, ensureValidSession, navigate, toast]);

  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal >= 25000 ? 0 : 2500;
  const total = subtotal + shipping;

  // Build full address from AddressSelector + details
  const fullDeliveryAddress = addressData?.fullAddress 
    ? (addressDetails.trim() ? `${addressDetails.trim()}, ${addressData.fullAddress}` : addressData.fullAddress)
    : "";

  // Check if form is valid (both phones and address filled)
  const isFormValid = donorPhoneNumber.trim() !== "" && beneficiaryPhoneNumber.trim() !== "" && !!addressData?.city;

  const handleConfirmOrder = async () => {
    setIsProcessing(true);
    try {
      // Validation robuste de la session AVANT tout
      console.log('🔐 Ensuring valid session before order...');
      const { valid, session: validSession } = await ensureValidSession();
      
      if (!valid || !validSession) {
        console.error('❌ No valid session for order creation');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter pour continuer.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }
      
      console.log('✅ Valid session confirmed:', validSession.user.id);
      console.log('🔑 Session access token exists:', !!validSession.access_token);
      
      // Utiliser l'ID de la session validée, pas l'état React potentiellement obsolète
      const currentUserId = validSession.user.id;
      
      // Verify auth.uid() works by testing a simple query
      console.log('🧪 Testing auth.uid() with a simple query...');
      const { data: testAuth, error: testAuthError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', currentUserId)
        .limit(1);
      
      if (testAuthError) {
        console.error('❌ Auth test failed:', testAuthError);
        throw new Error('Problème d\'authentification détecté. Veuillez vous reconnecter.');
      }
      
      console.log('✅ Authentication test passed, proceeding with order...');
      // Get product details to identify business products
      // Utiliser productId si disponible, sinon fallback sur id
      const productIds = orderItems
        .filter(item => item.productId || item.id)
        .map(item => (item.productId || item.id).toString());
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

      // Create order in database - utiliser currentUserId au lieu de user.id
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: currentUserId,
          total_amount: total,
          currency: "XOF",
          status: "pending",
          delivery_address: { 
            address: fullDeliveryAddress,
            city: addressData?.city,
            neighborhood: addressData?.neighborhood,
            details: addressDetails,
            latitude: addressData?.latitude,
            longitude: addressData?.longitude,
            donorPhone: donorPhoneNumber, 
            beneficiaryPhone: beneficiaryPhoneNumber 
          },
          notes: paymentMethod === "delivery" ? "Paiement à la livraison" : paymentMethod === "wave" ? "Paiement Wave" : "Mobile Money"
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      for (const item of orderItems) {
        // Utiliser productId si disponible, sinon fallback sur id pour rétrocompatibilité
        const effectiveProductId = item.productId || item.id;
        
        if (!effectiveProductId) {
          console.error('Missing productId for item:', item);
          throw new Error(`Le produit "${item.name}" n'a pas d'identifiant valide`);
        }
        
        await supabase
          .from("order_items")
          .insert({
            order_id: orderData.id,
            product_id: effectiveProductId.toString(),
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          });
      }

      // Create business orders for products that belong to businesses
      const businessItems = orderItems.filter(item => {
        const effectiveProductId = item.productId || item.id;
        if (!effectiveProductId) return false;
        const product = products?.find(p => p.id === effectiveProductId.toString());
        return product && (product.business_id || product.business_owner_id);
      });

      console.log('🏪 Found business items:', businessItems);
      console.log('📦 All products:', products);
      console.log('🏢 Business accounts:', businessAccounts);

      if (businessItems.length > 0) {
        console.log('🔄 Processing business items for orders...');
        
        // Group items by business account using business_owner_id mapping
        const itemsByBusinessAccount = businessItems.reduce((acc, item) => {
          const effectiveProductId = item.productId || item.id;
          const product = products?.find(p => p.id === effectiveProductId?.toString());
          
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
            customer_id: currentUserId, // Track who placed the order
            fund_id: null, // NULL for individual orders
            business_account_id: businessAccountId,
            order_summary: {
              items: items.map(item => ({
                product_id: (item.productId || item.id)?.toString(), // Pour les ratings
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
            delivery_address: fullDeliveryAddress,
            payment_method: paymentMethod === "delivery" ? "cash_on_delivery" : paymentMethod === "wave" ? "wave" : "mobile_money",
            status: "pending"
          };
          
          console.log('📤 Inserting business order with customer_id:', currentUserId);
          console.log('📤 Full business order data:', JSON.stringify(businessOrderData, null, 2));
          
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
            if (businessOrderError.code === '42501' || businessOrderError.message.includes('permission') || businessOrderError.message.includes('row-level security')) {
              // Vérifier si c'est vraiment une session expirée ou juste une erreur RLS
              console.log('🔍 RLS error detected, verifying if session is actually expired...');
              const { valid: sessionStillValid } = await ensureValidSession();
              
              if (!sessionStillValid) {
                throw new Error('Session expirée. Veuillez vous reconnecter.');
              } else {
                // Session valide mais erreur RLS - c'est un bug de permission
                console.error('❌ Session valid but RLS error - permission configuration issue');
                throw new Error('Erreur de permission. Veuillez contacter le support technique.');
              }
            } else if (businessOrderError.code === '23503') {
              throw new Error('Référence invalide dans la commande. Veuillez contacter le support.');
            } else {
              throw new Error(`Erreur lors de la création de la commande business: ${businessOrderError.message}`);
            }
          }
          
          console.log('✅ Business order created successfully:', businessOrderResult);

          // If Wave payment, trigger payment split processing
          if (paymentMethod === 'wave' && businessOrderResult?.[0]?.id) {
            console.log('💳 Processing Wave payment split for order:', businessOrderResult[0].id);
            supabase.functions.invoke('process-wave-payment', {
              body: { business_order_id: businessOrderResult[0].id }
            }).then(({ data, error }) => {
              if (error) console.error('⚠️ Wave split error (non-blocking):', error);
              else console.log('✅ Wave split result:', data);
            });
          }

          // If Mobile Money payment, trigger payment split processing
          if (paymentMethod === 'mobile' && businessOrderResult?.[0]?.id) {
            console.log('💳 Processing Mobile Money payment split for order:', businessOrderResult[0].id);
            supabase.functions.invoke('process-mobile-money-payment', {
              body: { business_order_id: businessOrderResult[0].id }
            }).then(({ data, error }) => {
              if (error) console.error('⚠️ Mobile Money split error (non-blocking):', error);
              else console.log('✅ Mobile Money split result:', data);
            });
          }
        }
        
        console.log('🎉 All business orders processed successfully!');
      } else {
        console.log('ℹ️ No business items found in this order.');
      }

      // Track purchase conversion in Google Analytics
      trackConversion('purchase', total, 'XOF');

      // Track share conversion if products came from share links
      const productIdsForConversion = orderItems
        .filter(item => item.productId || item.id)
        .map(item => String(item.productId || item.id));
      
      if (productIdsForConversion.length > 0) {
        await trackPurchaseConversion(productIdsForConversion, total);
      }

      // Store order details for confirmation page
      localStorage.setItem('lastOrderDetails', JSON.stringify({
        total,
        donorPhone: donorPhoneNumber,
        beneficiaryPhone: beneficiaryPhoneNumber,
        location: fullDeliveryAddress,
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
        .eq('user_id', currentUserId)
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
          errorTitle = "Erreur technique";
          errorDescription = "Une erreur de configuration s'est produite. Veuillez réessayer ou contacter le support.";
        } else if (error.message.includes('business_orders')) {
          errorTitle = "Erreur commande";
          errorDescription = "Une erreur technique est survenue. Veuillez réessayer.";
        } else if (error.message.includes('uuid')) {
          errorTitle = "Erreur de données";
          errorDescription = "Erreur de format des données. Veuillez contacter le support.";
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          errorTitle = "Erreur technique";
          errorDescription = "Une erreur de configuration s'est produite. Veuillez réessayer.";
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
      {/* Breadcrumb */}
      <CheckoutBreadcrumb step="checkout" />
      
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
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎁</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>📍</span>
                    <span>{item.vendor || 'Boutique'} • {item.locationName || 'Non spécifié'}</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">
                    Qté: {item.quantity} • {item.price.toLocaleString()} {item.currency || 'F'}
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
            
            <AddressSelector
              onAddressChange={setAddressData}
              label="Adresse de livraison"
              cityLabel="Ville / Commune"
              neighborhoodLabel="Quartier"
              required
            />
            
            <div>
              <Label htmlFor="addressDetails" className="text-sm font-medium">Précisions (rue, repères...)</Label>
              <Textarea 
                id="addressDetails" 
                placeholder="Numéro de rue, points de repère, instructions..." 
                value={addressDetails} 
                onChange={(e) => setAddressDetails(e.target.value)} 
                className="mt-1 min-h-[60px]" 
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

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="wave" id="wave" />
              <Label htmlFor="wave" className="flex items-center gap-3 flex-1 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-[#1DC3C3] flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">🌊 Wave</span>
              </Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Wave payment redirect */}
        <WavePaymentRedirect
          open={showWaveModal}
          onOpenChange={setShowWaveModal}
          amount={total}
          onSuccess={() => {
            setShowWaveModal(false);
            handleConfirmOrder();
          }}
        />

        {/* Confirm button */}
        <Button 
          onClick={() => {
            if (paymentMethod === "wave") {
              setShowWaveModal(true);
            } else {
              handleConfirmOrder();
            }
          }} 
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