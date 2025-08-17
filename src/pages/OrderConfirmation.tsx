import { CheckCircle, Phone, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function OrderConfirmation() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Commande confirmée | JOIE DE VIVRE";
  }, []);

  // Check if this is a collaborative gift confirmation
  const checkoutData = localStorage.getItem('checkoutItems');
  const isCollaborativeGift = checkoutData ? 
    JSON.parse(checkoutData).some((item: any) => item.isCollaborativeGift) : false;

  // Get order details from localStorage
  const orderData = localStorage.getItem('lastOrderDetails');
  const orderDetails = orderData ? JSON.parse(orderData) : {
    total: 17500,
    phone: "0707467445",
    location: "Abobo"
  };

  const continueOrder = () => {
    navigate("/shop");
  };

  const viewOrders = () => {
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success icon */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🎉</span>
            <h1 className="text-xl font-bold">
              {isCollaborativeGift ? "Cagnotte créée !" : "Commande confirmée !"}
            </h1>
          </div>
        </div>

        {/* Order details card */}
        <Card className="p-6 mb-6">
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-primary mb-2">
              Total: {orderDetails.total.toLocaleString()} F
            </p>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
              <Phone className="h-4 w-4" />
              <span className="text-sm">{orderDetails.phone}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{orderDetails.location}</span>
            </div>
          </div>

          {/* Status info */}
          {isCollaborativeGift ? (
            <div className="bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-orange-600">🎯</span>
                <span className="font-medium text-orange-800">Cagnotte groupée lancée</span>
              </div>
              <p className="text-sm text-orange-700">
                Vos proches peuvent maintenant contribuer dans l'onglet Cotisations
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">🔄</span>
                <span className="font-medium text-blue-800">Commande enregistrée localement</span>
              </div>
              <p className="text-sm text-blue-700">
                Sera synchronisée automatiquement
              </p>
            </div>
          )}

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground text-center">
              Votre commande sera traitée dès le retour de la connexion
            </p>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-3">
          {isCollaborativeGift ? (
            <>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg"
              >
                Voir ma cagnotte
              </Button>
              
              <Button 
                onClick={continueOrder}
                variant="outline"
                className="w-full"
              >
                Continuer mes achats
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={continueOrder}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg"
              >
                Continuer mes achats
              </Button>
              
              <Button 
                onClick={viewOrders}
                variant="outline"
                className="w-full"
              >
                Voir mes commandes
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}