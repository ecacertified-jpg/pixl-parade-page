import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, Phone, MapPin, MessageSquare, Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShareBirthdayToCirclesModal } from "@/components/ShareBirthdayToCirclesModal";

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
interface NotificationStats {
  whatsappSent: number;
  inAppSent: number;
}
interface ConfirmationState {
  orderSummary: OrderSummary;
  donorPhone: string;
  deliveryAddress: string;
  beneficiaryName: string;
  notificationStats?: NotificationStats | null;
  isSelfFund?: boolean;
}

export default function CollectiveOrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as ConfirmationState;
  const [showShareModal, setShowShareModal] = useState(false);
  const [birthdaySlug, setBirthdaySlug] = useState<string | undefined>();

  useEffect(() => {
    if (!state) {
      navigate("/dashboard");
    }
  }, [state, navigate]);

  // If self-fund, fetch birthday page slug and auto-show share modal
  useEffect(() => {
    if (!state?.isSelfFund || !user?.id) return;

    const fetchSlug = async () => {
      const { data } = await supabase
        .from('birthday_pages')
        .select('slug')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.slug) {
        setBirthdaySlug(data.slug);
      }
      // Auto-open the share modal after a brief delay
      setTimeout(() => setShowShareModal(true), 800);
    };
    fetchSlug();
  }, [state?.isSelfFund, user?.id]);

  if (!state) {
    return null;
  }

  const {
    orderSummary,
    donorPhone,
    deliveryAddress,
    beneficiaryName,
    notificationStats,
    isSelfFund
  } = state;

  return (
    <div className="min-h-screen bg-gradient-background">
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
            {isSelfFund
              ? "Votre cagnotte d'anniversaire a été créée avec succès !"
              : `Votre cotisation pour ${beneficiaryName} a été créée avec succès`}
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div className="text-center py-4 border-b">
              <p className="text-lg font-semibold text-foreground">
                Total: {orderSummary.total.toLocaleString()} F
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Phone className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-foreground font-medium">{donorPhone}</span>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-foreground font-medium">{deliveryAddress}</span>
            </div>
          </div>
        </Card>

        {/* Notification Stats */}
        {notificationStats && (notificationStats.whatsappSent > 0 || notificationStats.inAppSent > 0) && (
          <Card className="p-5 mb-6 border-accent/30 bg-accent/5">
            <p className="text-sm font-semibold text-foreground mb-3">Notifications envoyées</p>
            <div className="space-y-2">
              {notificationStats.whatsappSent > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-foreground">
                    {notificationStats.whatsappSent} WhatsApp envoyé{notificationStats.whatsappSent > 1 ? 's' : ''}
                  </span>
                </div>
              )}
              {notificationStats.inAppSent > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Bell className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">
                    {notificationStats.inAppSent} notification{notificationStats.inAppSent > 1 ? 's' : ''} in-app
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Les amis de {beneficiaryName} ont été prévenus ! 🎉
            </p>
          </Card>
        )}

        {/* Self-fund: Share birthday page CTA */}
        {isSelfFund && (
          <Card className="p-5 mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="text-center">
              <p className="text-2xl mb-2">🎂</p>
              <p className="font-semibold text-foreground mb-1">
                Partagez votre page d'anniversaire !
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Invitez vos amis à contribuer et à vous écrire un mot
              </p>
              <Button
                onClick={() => setShowShareModal(true)}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white"
              >
                🎉 Partager à mes cercles d'amis
              </Button>
            </div>
          </Card>
        )}

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

      {/* Share Birthday Modal */}
      <ShareBirthdayToCirclesModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        birthdaySlug={birthdaySlug}
        userName={beneficiaryName}
      />
    </div>
  );
}
