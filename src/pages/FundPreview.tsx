import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Gift, Users, ArrowRight, Heart } from "lucide-react";
import { useShareConversionTracking } from "@/hooks/useShareConversionTracking";

interface FundData {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  current_amount: number | null;
  currency: string | null;
  occasion: string | null;
  status: string | null;
  product?: {
    id: string;
    name: string;
    image_url: string | null;
    price: number;
  } | null;
  contact?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
}

export default function FundPreview() {
  const { fundId } = useParams<{ fundId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { detectAndStoreShareToken, cleanShareRefFromUrl } = useShareConversionTracking();

  // Detect and store share token from URL
  useEffect(() => {
    if (fundId) {
      const shareRef = searchParams.get('ref');
      if (shareRef) {
        detectAndStoreShareToken('fund', fundId);
        // Clean ref from URL
        cleanShareRefFromUrl();
      }
    }
  }, [fundId, searchParams, detectAndStoreShareToken, cleanShareRefFromUrl]);

  useEffect(() => {
    async function fetchFund() {
      if (!fundId) {
        setError("ID de cagnotte manquant");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("collective_funds")
          .select(`
            id,
            title,
            description,
            target_amount,
            current_amount,
            currency,
            occasion,
            status,
            products:business_product_id (
              id,
              name,
              image_url,
              price
            ),
            contacts:beneficiary_contact_id (
              id,
              name,
              avatar_url
            )
          `)
          .eq("id", fundId)
          .single();

        if (fetchError || !data) {
          setError("Cagnotte introuvable");
          setLoading(false);
          return;
        }

        setFund({
          ...data,
          product: data.products as FundData["product"],
          contact: data.contacts as FundData["contact"],
        });
      } catch (err) {
        console.error("Error fetching fund:", err);
        setError("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    }

    fetchFund();
  }, [fundId]);

  const handleContribute = () => {
    navigate(`/fund/${fundId}`);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const getOccasionEmoji = (occasion?: string | null) => {
    const emojis: Record<string, string> = {
      birthday: "🎂",
      wedding: "💒",
      graduation: "🎓",
      baby: "👶",
      retirement: "🎉",
      promotion: "🚀",
      other: "🎁",
    };
    return emojis[occasion || "other"] || "🎁";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Chargement de la cagnotte...</p>
        </div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md w-full">
          <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Cagnotte introuvable</h1>
          <p className="text-muted-foreground mb-6">
            Cette cagnotte n'existe pas ou n'est plus disponible.
          </p>
          <Button onClick={() => navigate("/")} variant="outline">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const currentAmount = fund.current_amount || 0;
  const targetAmount = fund.target_amount || 1;
  const progressPercent = Math.min(
    Math.round((currentAmount / targetAmount) * 100),
    100
  );
  const currency = fund.currency || "XOF";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="p-4 flex items-center justify-center border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <span className="font-poppins font-semibold text-lg">JOIE DE VIVRE</span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto p-4 py-8 space-y-6">
        {/* Product image */}
        {fund.product?.image_url && (
          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg">
            <img
              src={fund.product.image_url}
              alt={fund.product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-sm opacity-90">Cadeau choisi</p>
              <p className="font-semibold">{fund.product.name}</p>
            </div>
          </div>
        )}

        {/* Fund info card */}
        <Card className="p-6 space-y-4">
          {/* Occasion badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 w-fit">
            <span className="text-lg">{getOccasionEmoji(fund.occasion)}</span>
            <span className="text-sm font-medium">Cagnotte collective</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground">{fund.title}</h1>

          {/* Beneficiary */}
          {fund.contact && (
            <div className="flex items-center gap-3">
              {fund.contact.avatar_url ? (
                <img
                  src={fund.contact.avatar_url}
                  alt={fund.contact.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Pour</p>
                <p className="font-medium">{fund.contact.name}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {fund.description && (
            <p className="text-muted-foreground text-sm">{fund.description}</p>
          )}

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold text-primary">
                  {formatAmount(currentAmount)} {currency}
                </span>
                <span className="text-muted-foreground ml-2">
                  / {formatAmount(targetAmount)} {currency}
                </span>
              </div>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleContribute}
            className="w-full h-14 text-lg gap-2"
            size="lg"
          >
            <Heart className="w-5 h-5" />
            Contribuer à cette cagnotte
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Card>

        {/* App promo */}
        <div className="text-center space-y-2 py-4">
          <p className="text-sm text-muted-foreground">
            Célébrez les moments de joie avec vos proches
          </p>
          <Button variant="link" onClick={() => navigate("/")}>
            Découvrir JOIE DE VIVRE →
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center border-t bg-background/50">
        <p className="text-xs text-muted-foreground">
          © 2024 JOIE DE VIVRE - Célébrons ensemble
        </p>
      </footer>
    </div>
  );
}
