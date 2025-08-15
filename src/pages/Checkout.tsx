import { useState } from "react";
import { ArrowLeft, Phone, MapPin, CreditCard, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";

export default function Checkout() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("delivery");
  const [phoneNumber, setPhoneNumber] = useState("+225 XX XX XX XXX");
  const [address, setAddress] = useState("");

  const orderDetails = {
    items: [
      {
        name: "Bracelet Doré Élégance",
        quantity: 1,
        price: 15000
      }
    ],
    subtotal: 15000,
    shipping: 2500,
    total: 17500
  };

  const handleConfirmOrder = () => {
    navigate("/order-confirmation");
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Finaliser la commande</h1>
              <p className="text-sm text-muted-foreground">Mode hors-ligne</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Offline mode notification */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">📱</span>
            <p className="text-sm text-blue-800">
              Mode hors-ligne<br />
              La commande sera synchronisée plus tard
            </p>
          </div>
        </div>

        {/* Order summary */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold mb-3">📋 Résumé de commande</h3>
          {orderDetails.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm mb-2">
              <span>{item.name}</span>
              <span>{item.price.toLocaleString()} F</span>
            </div>
          ))}
          <div className="text-sm mb-1">Qté: 1</div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{orderDetails.subtotal.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Livraison</span>
              <span>{orderDetails.shipping.toLocaleString()} F</span>
            </div>
            <div className="flex justify-between font-bold text-primary">
              <span>Total</span>
              <span>{orderDetails.total.toLocaleString()} F</span>
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
              <Label htmlFor="phone" className="text-sm font-medium">Numéro de téléphone *</Label>
              <Input
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
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
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg mb-4"
        >
          Confirmer la commande - {orderDetails.total.toLocaleString()} F
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          En confirmant, vous acceptez nos conditions de vente
        </p>

        <div className="pb-20" />
      </main>
    </div>
  );
}