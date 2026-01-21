import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Gift, Store, ArrowRight, Loader2, AlertCircle, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoRose from "@/assets/logo-jdv-rose.png";
import { useShareConversionTracking } from "@/hooks/useShareConversionTracking";
import { useProductView } from "@/hooks/useProductView";
import { useProductRatings } from "@/hooks/useProductRatings";
import { VideoSchema, ProductSchema, BreadcrumbListSchema, formatDurationISO8601 } from "@/components/schema";
import { SEOHead } from "@/components/SEOHead";
interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  images: string[] | null;
  video_url: string | null;
  video_thumbnail_url: string | null;
  video_uploaded_at: string | null;
  created_at: string;
  vendor_name: string;
  vendor_id: string | null;
  stock_quantity: number | null;
}

export default function ProductPreview() {
  const { productId } = useParams<{ productId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const { detectAndStoreShareToken, trackViewFromShare, cleanShareRefFromUrl } = useShareConversionTracking();
  
  // Track product view for popularity metrics
  useProductView(productId);
  
  // Fetch product ratings for Schema.org structured data
  const { ratings, stats } = useProductRatings(productId || "");

  // Detect and store share token from URL
  useEffect(() => {
    if (productId) {
      const shareRef = searchParams.get('ref');
      if (shareRef) {
        detectAndStoreShareToken('product', productId);
        // Track view event from share
        trackViewFromShare(shareRef, productId);
        // Clean ref from URL
        cleanShareRefFromUrl();
      }
    }
  }, [productId, searchParams, detectAndStoreShareToken, trackViewFromShare, cleanShareRefFromUrl]);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) {
        setError("ID du produit manquant");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("products")
          .select(`
            id,
            name,
            description,
            price,
            currency,
            image_url,
            images,
            video_url,
            video_thumbnail_url,
            video_uploaded_at,
            created_at,
            stock_quantity,
            business_accounts!products_business_id_fkey (
              id,
              business_name
            )
          `)
          .eq("id", productId)
          .eq("is_active", true)
          .maybeSingle();

        if (fetchError) {
          console.error("Error fetching product:", fetchError);
          setError("Erreur lors du chargement du produit");
          return;
        }

        if (!data) {
          setError("Produit introuvable");
          return;
        }

        // Parse images array if it's a JSON string
        let imagesArray: string[] | null = null;
        if (data.images) {
          if (Array.isArray(data.images)) {
            imagesArray = data.images as string[];
          } else if (typeof data.images === 'string') {
            try {
              imagesArray = JSON.parse(data.images);
            } catch {
              imagesArray = null;
            }
          }
        }

        setProduct({
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          currency: data.currency || "XOF",
          image_url: data.image_url,
          images: imagesArray,
          video_url: data.video_url,
          video_thumbnail_url: data.video_thumbnail_url,
          video_uploaded_at: data.video_uploaded_at,
          created_at: data.created_at,
          vendor_name: data.business_accounts?.business_name || "Vendeur",
          vendor_id: data.business_accounts?.id || null,
          stock_quantity: data.stock_quantity,
        });
      } catch (err) {
        console.error("Error:", err);
        setError("Une erreur est survenue");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const handleViewInApp = () => {
    if (product?.vendor_id) {
      navigate(`/boutique/${product.vendor_id}?product=${product.id}`);
    } else {
      navigate(`/shop?product=${product?.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Produit introuvable</h1>
            <p className="text-muted-foreground mb-6">
              {error || "Ce produit n'existe pas ou n'est plus disponible."}
            </p>
            <Button asChild>
              <Link to="/shop">
                Découvrir la boutique
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedPrice = `${product.price.toLocaleString("fr-FR")} ${product.currency}`;
  
  // Priority: image_url > images[0] > video_thumbnail_url
  const displayImageUrl = !imageError 
    ? (product.image_url || product.images?.[0] || product.video_thumbnail_url || null)
    : null;

  // Generate Unicode star rating for meta description
  const generateStarRating = (rating: number): string => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalf && fullStars < 5) stars += '☆';
    stars += '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
    return stars;
  };

  // Build SEO description with ratings
  const seoDescription = stats && stats.rating_count > 0
    ? `${generateStarRating(stats.average_rating)} ${stats.average_rating.toFixed(1)}/5 (${stats.rating_count} avis) - ${formattedPrice} par ${product.vendor_name}. ${product.description?.substring(0, 100) || ''}`
    : `${formattedPrice} par ${product.vendor_name}. ${product.description?.substring(0, 120) || 'Découvrez ce produit sur JOIE DE VIVRE'}`;


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* SEOHead for dynamic Open Graph meta tags */}
      <SEOHead
        title={`${product.name} - ${formattedPrice}`}
        description={seoDescription}
        image={displayImageUrl || undefined}
        imageAlt={`${product.name} - ${product.vendor_name}`}
        type="product"
        keywords={`${product.name}, cadeau Abidjan, ${product.vendor_name}, boutique Côte d'Ivoire, cadeaux Afrique`}
        aiContentType="product"
        aiSummary={`Produit: ${product.name}. Prix: ${formattedPrice}. Vendeur: ${product.vendor_name}. ${stats?.rating_count ? `Note: ${stats.average_rating.toFixed(1)}/5 (${stats.rating_count} avis).` : ''}`}
        audience="gift-givers"
        contentRegion="CI,BJ,SN,ML,TG,BF"
        productPrice={product.price}
        productCurrency={product.currency}
        productAvailability="in stock"
        productBrand={product.vendor_name}
        productRating={stats?.average_rating}
        productReviewCount={stats?.rating_count}
      />

      {/* ProductSchema for SEO - Rich Results with ratings, dynamic availability */}
      <ProductSchema
        id={product.id}
        name={product.name}
        description={product.description || `Découvrez ${product.name} sur JOIE DE VIVRE`}
        image={displayImageUrl || "https://joiedevivre-africa.com/og-image.png"}
        images={product.images || undefined}
        price={product.price}
        currency={product.currency}
        availability={
          product.stock_quantity === null 
            ? 'InStock'  // Pas de gestion de stock = toujours disponible
            : product.stock_quantity > 0 
              ? 'InStock' 
              : 'OutOfStock'
        }
        itemCondition="NewCondition"
        seller={{
          name: product.vendor_name,
          url: product.vendor_id 
            ? `https://joiedevivre-africa.com/boutique/${product.vendor_id}`
            : "https://joiedevivre-africa.com/shop"
        }}
        category="Cadeaux"
        sku={product.id}
        aggregateRating={stats && stats.rating_count > 0 ? {
          ratingValue: stats.average_rating,
          reviewCount: stats.rating_count
        } : undefined}
        reviews={ratings.length > 0 ? ratings.map(r => ({
          authorName: r.user?.first_name || "Utilisateur",
          rating: r.rating,
          reviewBody: r.review_text,
          datePublished: r.created_at
        })) : undefined}
        shippingDetails={{
          deliveryTime: "1-3 jours",
          shippingCost: 2000,
        }}
      />
      
      {/* VideoSchema for SEO - Public product video */}
      {product.video_url && product.video_thumbnail_url && (
        <VideoSchema
          id={`preview-product-${product.id}`}
          name={`${product.name} - JOIE DE VIVRE`}
          description={product.description || `Découvrez ${product.name} sur JOIE DE VIVRE, la plateforme de cadeaux collaboratifs en Afrique.`}
          thumbnailUrl={product.video_thumbnail_url}
          uploadDate={(product.video_uploaded_at || product.created_at || new Date().toISOString()).split('T')[0]}
          contentUrl={product.video_url}
          duration={formatDurationISO8601(30)}
          regionsAllowed={['CI', 'SN', 'ML', 'BF', 'TG', 'NE', 'BJ', 'FR']}
        />
      )}

      {/* BreadcrumbSchema for SEO - Breadcrumb navigation in Google */}
      <BreadcrumbListSchema 
        items={[
          { name: "Accueil", path: "/" },
          { name: "Boutique", path: "/shop" },
          ...(product.vendor_id ? [{
            name: product.vendor_name,
            path: `/boutique/${product.vendor_id}`
          }] : []),
          { name: product.name, path: `/p/${product.id}` }
        ]} 
      />
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoRose} alt="Joie de Vivre" className="h-8 w-auto" />
            <span className="font-poppins font-semibold text-lg text-primary">
              JOIE DE VIVRE
            </span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Se connecter</Link>
          </Button>
        </div>
      </header>

      {/* Visual Breadcrumb Navigation */}
      <div className="container mx-auto px-4 py-3 max-w-2xl">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center gap-1">
                  <Home className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Accueil</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/shop">Boutique</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            
            {product.vendor_id && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={`/boutique/${product.vendor_id}`}>
                      {product.vendor_name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[150px] truncate">
                {product.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Product Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="overflow-hidden">
          {/* Product Image */}
          <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-secondary/50 to-primary/10">
            {displayImageUrl ? (
              <img
                src={displayImageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <img src={logoRose} alt="Joie de Vivre" className="h-16 w-auto opacity-40" />
                <span className="text-sm text-muted-foreground">Image bientôt disponible</span>
              </div>
            )}
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Vendor */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>{product.vendor_name}</span>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl font-poppins font-semibold">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-3xl font-bold text-primary">
              {formattedPrice}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground">
                {product.description}
              </p>
            )}

            {/* CTA Button */}
            <Button
              size="lg"
              className="w-full mt-6"
              variant="gradient"
              onClick={handleViewInApp}
            >
              <Gift className="mr-2 h-5 w-5" />
              Voir dans l'application
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            {/* Info text */}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Connectez-vous pour ajouter ce produit à vos favoris ou l'offrir à un proche
            </p>
          </CardContent>
        </Card>

        {/* Footer branding */}
        <div className="text-center mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2">
          <img src={logoRose} alt="" className="h-6 w-auto" />
          <span>La plateforme de cadeaux collaboratifs</span>
        </div>
      </main>
    </div>
  );
}
