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
  isCollaborativeGift?: boolean;
  beneficiaryName?: string;
  beneficiaryId?: string;
  productId?: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("delivery");
  const [donorPhoneNumber, setDonorPhoneNumber] = useState("");
  const [beneficiaryPhoneNumber, setBeneficiaryPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [orderItems, setOrderItems] = useState<CheckoutItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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
        await supabase
          .from("order_items")
          .insert({
            order_id: orderData.id,
            product_id: (item.productId || item.id).toString(),
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity
          });
      }

      // Check for collaborative gifts
      const collaborativeGifts = orderItems.filter(item => item.isCollaborativeGift);
      
      if (collaborativeGifts.length > 0) {
        // Create collective funds for collaborative gifts
        for (const gift of collaborativeGifts) {
          const { data, error } = await supabase
            .from("collective_funds")
            .insert({
              creator_id: user.id,
              beneficiary_contact_id: null,
              title: `Cadeau pour ${gift.beneficiaryName}`,
              description: `Cotisation groupée pour offrir ${gift.name} à ${gift.beneficiaryName}`,
              target_amount: gift.price,
              currency: "XOF",
              occasion: "promotion",
              is_public: true,
              allow_anonymous_contributions: false
            })
            .select()
            .single();

          if (error) throw error;

          // Create initial activity
          await supabase.rpc('create_fund_activity', {
            p_fund_id: data.id,
            p_contributor_id: user.id,
            p_activity_type: 'fund_created',
            p_message: `Cagnotte créée pour ${gift.beneficiaryName}`,
            p_metadata: {
              product_id: gift.productId,
              product_name: gift.name,
              order_id: orderData.id
            }
          });
        }
      } else {
        // For regular gifts, create gift record for beneficiary notification
        for (const item of orderItems) {
          if (item.beneficiaryName && item.beneficiaryId) {
            // Create gift record
            await supabase
              .from("gifts")
              .insert({
                giver_id: user.id,
                receiver_id: item.beneficiaryId,
                gift_name: item.name,
                gift_description: item.description,
                amount: item.price,
                currency: "XOF",
                gift_date: new Date().toISOString().split('T')[0],
                occasion: "promotion",
                status: "given"
              });

            // Create notification for beneficiary
            await supabase
              .from("notifications")
              .insert({
                user_id: item.beneficiaryId,
                title: "🎁 Nouveau cadeau reçu !",
                message: `Vous avez reçu ${item.name} de la part de votre proche !`,
                type: "gift_received"
              });
          }
        }
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

      navigate("/order-confirmation");
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser la commande",
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
                  {item.isCollaborativeGift && (
                    <div className="flex items-center gap-1 text-xs text-primary mb-1">
                      <span>🎁</span>
                      <span>Cadeau pour {item.beneficiaryName}</span>
                    </div>
                  )}
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
          {isProcessing ? "Traitement..." : `Confirmer la commande - ${total.toLocaleString()} F`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          En confirmant, vous acceptez nos conditions de vente
        </p>

        <div className="pb-20" />
      </main>
    </div>
  );
}