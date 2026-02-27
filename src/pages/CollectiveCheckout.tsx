import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ShoppingCart, Phone, MapPin, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddressSelector, type AddressResult } from "@/components/AddressSelector";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

interface CollectiveItem {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  isCollaborativeGift?: boolean;
  beneficiaryName?: string;
  beneficiaryId?: string;
  beneficiaryContactId?: string;
  productId?: string; // ID du produit business
}

export default function CollectiveCheckout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, ensureValidSession } = useAuth();
  const { trackConversion } = useGoogleAnalytics();
  const [items, setItems] = useState<CollectiveItem[]>([]);
  const [donorPhone, setDonorPhone] = useState("");
  const [beneficiaryPhone, setBeneficiaryPhone] = useState("");
  const [addressData, setAddressData] = useState<AddressResult | null>(null);
  const [addressDetails, setAddressDetails] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [processing, setProcessing] = useState(false);

  const deliveryAddress = useMemo(() => {
    if (!addressData) return "";
    const parts = [addressDetails.trim(), addressData.fullAddress].filter(Boolean);
    return parts.join(", ");
  }, [addressData, addressDetails]);

  useEffect(() => {
    const checkoutItems = localStorage.getItem('checkoutItems');
    if (checkoutItems) {
      const parsedItems = JSON.parse(checkoutItems);
      // Filter only collaborative gift items
      const collectiveItems = parsedItems.filter((item: CollectiveItem) => item.isCollaborativeGift);
      setItems(collectiveItems);
      
      if (collectiveItems.length === 0) {
        toast({
          title: "Aucune cotisation",
          description: "Aucun article de cotisation trouvé",
          variant: "destructive"
        });
        navigate("/cart");
      }
    } else {
      navigate("/cart");
    }
  }, [navigate, toast]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = subtotal >= 25000 ? 0 : 2500;
  const total = subtotal + shippingCost;

  const isFormValid = () => {
    return donorPhone.trim() !== "" && 
           beneficiaryPhone.trim() !== "" && 
           addressData !== null && addressData.city !== "";
  };

  const handleConfirmCollectiveFund = async () => {
    if (!isFormValid()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);

    try {
      // Verify authentication session is active using ensureValidSession
      console.log('🔐 Validating session before collective fund creation...');
      const { valid, session } = await ensureValidSession();
      
      if (!valid || !session) {
        console.error('❌ Session validation failed');
        toast({
          title: "Session expirée",
          description: "Votre session a expiré. Veuillez vous reconnecter.",
          variant: "destructive"
        });
        navigate('/auth');
        return;
      }

      const currentUserId = session.user.id;
      console.log('✅ User authenticated:', { userId: user.id, sessionUserId: currentUserId });

      // Create collective fund for the first item (assuming one item per fund)
      const item = items[0];
      
      // Récupérer les informations du produit business si productId existe
      let businessProductId: string | null = null;
      let createdByBusinessId: string | null = null;
      
      if (item.productId) {
        console.log('🔍 Looking up product:', item.productId);
        
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, business_account_id')
          .eq('id', String(item.productId))
          .single();
        
        if (productError) {
          console.error('❌ Product lookup error:', productError);
        }
        
        if (productData) {
          console.log('✅ Product found:', productData);
          businessProductId = productData.id;
          createdByBusinessId = productData.business_account_id;
        }
      }
      
      console.log('Creating collective fund with data:', {
        creator_id: user.id,
        title: `${item.name} pour ${item.beneficiaryName}`,
        target_amount: item.price * item.quantity,
        business_product_id: businessProductId,
        created_by_business_id: createdByBusinessId
      });
      
      const { data: fundData, error: fundError } = await supabase
        .from('collective_funds')
        .insert({
          creator_id: currentUserId, // Use validated session user ID
          beneficiary_contact_id: item.beneficiaryContactId || null,
          title: `${item.name} pour ${item.beneficiaryName}`,
          description: item.description,
          target_amount: item.price * item.quantity,
          business_product_id: businessProductId,
          created_by_business_id: createdByBusinessId,
          occasion: 'cadeau',
          currency: 'XOF',
          status: 'active'
        })
        .select()
        .single();

      if (fundError) {
        console.error('Fund creation error:', fundError);
        
        if (fundError.code === '42501' || fundError.message.includes('row-level security')) {
          // Vérifier si c'est vraiment une session expirée
          const { valid: sessionStillValid } = await ensureValidSession();
          if (!sessionStillValid) {
            toast({
              title: "Session expirée",
              description: "Votre session a expiré. Veuillez vous reconnecter.",
              variant: "destructive"
            });
            navigate('/auth');
          } else {
            toast({
              title: "Erreur de permission",
              description: "Erreur d'autorisation. Veuillez contacter le support.",
              variant: "destructive"
            });
          }
        } else if (fundError.code === 'PGRST301') {
          toast({
            title: "Erreur de validation",
            description: "Données invalides. Vérifiez les informations saisies.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erreur de création",
            description: `Impossible de créer la cotisation: ${fundError.message}`,
            variant: "destructive"
          });
        }
        return;
      }

      console.log('Fund created successfully:', fundData);

      // Appeler la fonction edge pour notifications de réciprocité (non-bloquant)
      try {
        console.log('🔔 Invoking notify-reciprocity for fund:', fundData.id);
        await supabase.functions.invoke('notify-reciprocity', {
          body: { fund_id: fundData.id }
        });
        console.log('✅ Notify-reciprocity invoked successfully');
      } catch (reciprocityError) {
        // Ne pas bloquer le flux si la notification échoue
        console.warn('⚠️ Error invoking notify-reciprocity (non-blocking):', reciprocityError);
      }

      // Notifier les amis du bénéficiaire via WhatsApp (cagnottes business uniquement)
      let notificationStats: { whatsappSent: number; inAppSent: number } | null = null;
      if (createdByBusinessId && fundData.id) {
        try {
          console.log('📧 Invoking notify-business-fund-friends from checkout');

          // Récupérer le user_id lié au contact bénéficiaire
          let beneficiaryUserId: string | null = items[0]?.beneficiaryId || null;
          if (!beneficiaryUserId && item.beneficiaryContactId) {
            const { data: contactData } = await supabase
              .from('contacts')
              .select('linked_user_id')
              .eq('id', item.beneficiaryContactId)
              .single();
            beneficiaryUserId = contactData?.linked_user_id || null;
          }

          const { data: businessData } = await supabase
            .from('business_accounts')
            .select('business_name')
            .eq('id', createdByBusinessId)
            .single();

          const { data: notifyResult } = await supabase.functions.invoke('notify-business-fund-friends', {
            body: {
              fund_id: fundData.id,
              beneficiary_user_id: beneficiaryUserId,
              creator_user_id: currentUserId,
              beneficiary_name: item.beneficiaryName || 'un ami',
              business_name: businessData?.business_name || 'Un commerce',
              product_name: items[0]?.name || 'Un cadeau',
              target_amount: fundData.target_amount,
              currency: fundData.currency || 'XOF'
            }
          });
          if (notifyResult) {
            notificationStats = {
              whatsappSent: (notifyResult.whatsapp_sent || 0) + (notifyResult.contacts_whatsapp_sent || 0),
              inAppSent: notifyResult.notified_count || 0
            };
          }
          console.log('✅ Notify-business-fund-friends invoked successfully', notificationStats);
        } catch (friendsNotifyError) {
          console.warn('⚠️ Error invoking notify-business-fund-friends (non-blocking):', friendsNotifyError);
        }
      }

      // Create collective fund order with all the details
      const orderSummary = {
        items: items.map(item => ({
          product_id: item.productId?.toString(), // Pour les ratings
          name: item.name,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          currency: item.currency,
          image: item.image
        })),
        subtotal,
        shippingCost,
        total
      };

      const { error: orderError } = await supabase
        .from('collective_fund_orders')
        .insert({
          fund_id: fundData.id,
          creator_id: currentUserId, // Use validated session user ID
          donor_phone: donorPhone,
          beneficiary_phone: beneficiaryPhone,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          order_summary: orderSummary,
          total_amount: total,
          currency: 'XOF'
        });

      if (orderError) {
        throw orderError;
      }

      // Track purchase conversion in Google Analytics
      trackConversion('purchase', total, 'XOF');

      // Clear cart items
      localStorage.removeItem('cart');
      localStorage.removeItem('checkoutItems');
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast({
        title: "Cotisation créée !",
        description: `La cotisation pour ${item.beneficiaryName} a été créée avec succès`,
      });

      // Navigate to confirmation page with order details
      navigate("/collective-order-confirmation", {
        state: {
          orderSummary,
          donorPhone,
          deliveryAddress,
          beneficiaryName: item.beneficiaryName,
          notificationStats
        }
      });
      
    } catch (error) {
      console.error('Erreur lors de la création de la cotisation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la cotisation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
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
            <h1 className="text-xl font-semibold">Finaliser la cotisation</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Order Summary */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-pink-500">📋</span>
            <h3 className="font-semibold">Résumé de cotisation</h3>
          </div>
          
          {items.map(item => (
            <div key={item.id} className="mb-4">
              <div className="flex items-start gap-3">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-primary mb-1">
                    <span>🎁</span>
                    <span>Bijouterie Précieuse • Plateau, Abidjan</span>
                  </div>
                  <p className="text-primary font-bold text-sm">
                    Qté: {item.quantity} • {(item.price * item.quantity).toLocaleString()} {item.currency}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="border-t pt-3 mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span>{subtotal.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              <span>{shippingCost === 0 ? "Gratuit" : `${shippingCost.toLocaleString()} F`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-primary">
              <span>Total</span>
              <span>{total.toLocaleString()} F</span>
            </div>
          </div>
        </Card>

        {/* Delivery Information */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold">Informations de livraison</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="donor-phone" className="text-sm font-medium">
                Numéro de téléphone du donateur *
              </Label>
              <Input
                id="donor-phone"
                type="tel"
                placeholder="+225 XX XX XX XX XX"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="beneficiary-phone" className="text-sm font-medium">
                Numéro de téléphone du bénéficiaire *
              </Label>
              <Input
                id="beneficiary-phone"
                type="tel"
                placeholder="+225 XX XX XX XX XX"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <AddressSelector
              onAddressChange={setAddressData}
              label=""
              cityLabel="Ville / Commune"
              neighborhoodLabel="Quartier"
              required
            />

            <div>
              <Label htmlFor="address-details" className="text-sm font-medium">
                Précisions (rue, repères...)
              </Label>
              <Textarea
                id="address-details"
                placeholder="Numéro, rue, points de repère..."
                value={addressDetails}
                onChange={(e) => setAddressDetails(e.target.value)}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Mode de paiement</h3>
          </div>
          
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
              <div className="flex items-center gap-2 flex-1">
                <Phone className="h-4 w-4 text-orange-500" />
                <Label htmlFor="cash_on_delivery" className="flex-1 cursor-pointer">
                  Paiement à la livraison
                </Label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <RadioGroupItem value="mobile_money" id="mobile_money" />
              <div className="flex items-center gap-2 flex-1">
                <span className="text-green-500">📱</span>
                <Label htmlFor="mobile_money" className="flex-1 cursor-pointer">
                  Mobile Money (Orange/MTN)
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Confirm Button */}
        <Button 
          onClick={handleConfirmCollectiveFund}
          disabled={!isFormValid() || processing}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg disabled:opacity-50"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {processing ? "Création en cours..." : `Confirmer la cotisation - ${total.toLocaleString()} F`}
        </Button>

        <div className="pb-20" />
      </main>
    </div>
  );
}