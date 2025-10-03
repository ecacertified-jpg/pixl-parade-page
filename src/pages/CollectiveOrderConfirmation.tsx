import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Phone, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
interface OrderSummary {
  items: Array<{
    name: string;
    description: string;
    price: number;
    quantity: number;
    currency: string;
    image: string;
  }>;
  subtotal: number;
  shippingCost: number;
  total: number;
}
interface ConfirmationState {
  orderSummary: OrderSummary;
  donorPhone: string;
  deliveryAddress: string;
  beneficiaryName: string;
}
export default function CollectiveOrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ConfirmationState;
  useEffect(() => {
    // Redirect if no state is provided
    if (!state) {
      navigate("/dashboard");
    }
  }, [state, navigate]);
  if (!state) {
    return null;
  }
  const {
    orderSummary,
    donorPhone,
    deliveryAddress,
    beneficiaryName
  } = state;
  return <div className="min-h-screen bg-gradient-background">
      <main className="max-w-md mx-auto px-4 py-8">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-foreground mb-2 text-xl">
            🎉 Commande confirmée !
          </h1>
          <p className="text-muted-foreground text-sm">
            Votre cotisation pour {beneficiaryName} a été créée avec succès
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            {/* Total */}
            <div className="text-center py-4 border-b">
              <p className="text-lg font-semibold text-foreground">
                Total: {orderSummary.total.toLocaleString()} F
              </p>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-foreground font-medium">{donorPhone}</span>
            </div>

            {/* Delivery Address */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-foreground font-medium">{deliveryAddress}</span>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={() => navigate("/shop")} className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg">
            Continuer mes achats
          </Button>
          
          <Button onClick={() => navigate("/dashboard?tab=cotisations")} variant="outline" className="w-full py-3 rounded-lg border-border hover:bg-muted">
            Voir mes commandes
          </Button>
        </div>

        <div className="pb-20" />
      </main>
    </div>;
}