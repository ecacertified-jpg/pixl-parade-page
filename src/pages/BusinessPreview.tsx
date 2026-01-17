import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Gift, Store, ArrowRight, Loader2, AlertCircle, MapPin, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trackBusinessShareEvent } from "@/hooks/useBusinessShareTracking";

interface BusinessData {
  id: string;
  business_name: string;
  business_type: string | null;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  products_count: number;
  latitude: number | null;
  longitude: number | null;
}

export default function BusinessPreview() {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasTrackedRef = useRef(false);

  // Track view from share link
  useEffect(() => {
    const shareRef = searchParams.get('ref');
    
    if (shareRef && businessId && !hasTrackedRef.current) {
      hasTrackedRef.current = true;
      
      // Store ref in session for follow attribution
      sessionStorage.setItem(`business_share_ref_${businessId}`, shareRef);
      
      // Track the view event
      trackBusinessShareEvent({
        shareToken: shareRef,
        eventType: 'view',
        businessId: businessId,
      }).then(success => {
        if (success) {
          console.log('Business share view tracked');
        }
      });
      
      // Clean the URL (remove ref param)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('ref');
      setSearchParams(newParams, { replace: true });
    }
  }, [businessId, searchParams, setSearchParams]);

  useEffect(() => {
    async function fetchBusiness() {
      if (!businessId) {
        setError("ID de la boutique manquant");
        setLoading(false);
        return;
      }

      try {
        // Fetch business details
        const { data, error: fetchError } = await supabase
          .from("business_accounts")
          .select(`
            id,
            business_name,
            business_type,
            description,
            logo_url,
            address,
            latitude,
            longitude
          `)
          .eq("id", businessId)
          .eq("is_active", true)
          .eq("status", "active")
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching business:", fetchError);
          setError("Erreur lors du chargement de la boutique");
          return;
        }

        if (!data) {
          setError("Boutique introuvable");
          return;
        }

        // Count active products
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("is_active", true);

        setBusiness({
          id: data.id,
          business_name: data.business_name,
          business_type: data.business_type,
          description: data.description,
          logo_url: data.logo_url,
          address: data.address,
          products_count: count || 0,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [businessId]);

  const handleViewShop = () => {
    navigate(`/boutique/${businessId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Boutique introuvable</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Cette boutique n'existe pas ou n'est plus disponible."}
            </p>
            <Button asChild>
              <Link to="/shop">
                Découvrir les boutiques
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <span className="font-poppins font-semibold text-lg text-primary">
              JOIE DE VIVRE
            </span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      </header>

      {/* Business Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Business Header */}
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-primary/20">
                <AvatarImage src={business.logo_url || undefined} alt={business.business_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  <Store className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>

              <h1 className="text-2xl font-poppins font-semibold">
                {business.business_name}
              </h1>

              {business.business_type && (
                <p className="text-primary font-medium mt-1">
                  {business.business_type}
                </p>
              )}
            </div>

            {/* Info badges */}
            <div className="flex flex-wrap justify-center gap-3">
              {business.address && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <MapPin className="h-4 w-4" />
                  <span>{business.address}</span>
                </div>
              )}

              {business.products_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <Package className="h-4 w-4" />
                  <span>{business.products_count} produit{business.products_count > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {business.description && (
              <p className="text-muted-foreground text-center">
                {business.description}
              </p>
            )}

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full"
              variant="gradient"
              onClick={handleViewShop}
            >
              <Store className="mr-2 h-5 w-5" />
              Voir la boutique
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Info text */}
            <p className="text-xs text-center text-muted-foreground">
              Connectez-vous pour découvrir tous les produits et passer commande
            </p>
          </CardContent>
        </Card>

        {/* Footer branding */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <Gift className="h-5 w-5 inline-block mr-2 text-primary" />
          <span>La plateforme de cadeaux collaboratifs</span>
        </div>
      </main>
    </div>
  );
}
