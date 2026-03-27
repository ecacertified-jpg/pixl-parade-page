import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Gift, Store, ShoppingBag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface GiftOrderDetails {
  productName: string;
  totalAmount: number;
  currency: string;
  senderPhone: string;
  businessName: string;
  businessLogo?: string;
  createdAt: string;
}

export default function GiftReceived() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<GiftOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    document.title = "Vous avez reçu un cadeau ! | JOIE DE VIVRE";
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError(true);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("business_orders")
        .select(`
          total_amount,
          currency,
          donor_phone,
          order_summary,
          created_at,
          business_accounts (
            business_name,
            logo_url
          )
        `)
        .eq("id", orderId)
        .single();

      if (fetchError || !data) {
        console.error("Error fetching gift order:", fetchError);
        setError(true);
        setLoading(false);
        return;
      }

      const orderSummary = data.order_summary as { items?: { name: string }[] } | null;
      const firstItemName = orderSummary?.items?.[0]?.name || "Un cadeau spécial";

      setOrder({
        productName: firstItemName,
        totalAmount: Number(data.total_amount),
        currency: data.currency,
        senderPhone: data.donor_phone,
        businessName: data.business_accounts?.business_name || "Une boutique",
        businessLogo: data.business_accounts?.logo_url || undefined,
        createdAt: data.created_at,
      });
      setLoading(false);
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <Gift className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
          <p className="text-muted-foreground">Chargement de votre cadeau...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Cadeau introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Ce lien n'est plus valide ou le cadeau a déjà été consulté.
          </p>
          <Button onClick={() => navigate("/")} className="w-full">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const formattedAmount = order.totalAmount.toLocaleString("fr-FR");
  const maskedSender = order.senderPhone.length > 4
    ? "***" + order.senderPhone.slice(-4)
    : order.senderPhone;

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Festive header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🎁</span>
          </div>
          <h1 className="text-2xl font-bold font-poppins mb-1">
            Vous avez reçu un cadeau !
          </h1>
          <p className="text-muted-foreground">
            Quelqu'un pense à vous 💜
          </p>
        </div>

        {/* Gift details card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {order.businessLogo ? (
              <img
                src={order.businessLogo}
                alt={order.businessName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Offert par</p>
              <p className="font-medium">{maskedSender}</p>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <p className="font-semibold text-lg">{order.productName}</p>
            <p className="text-sm text-muted-foreground">
              via {order.businessName}
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Valeur du cadeau</p>
            <p className="text-2xl font-bold text-primary">
              {formattedAmount} {order.currency}
            </p>
          </div>
        </Card>

        {/* Action buttons */}
        <div className="space-y-3">
          {user ? (
            <Button
              onClick={() => navigate("/shop")}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Explorer la boutique
            </Button>
          ) : (
            <Button
              onClick={() => navigate("/auth?tab=signup")}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Créer mon compte
            </Button>
          )}
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}
