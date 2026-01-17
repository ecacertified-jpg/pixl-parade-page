import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Video, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCountry } from "@/contexts/CountryContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/VideoPlayer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface VideoProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image_url: string | null;
  video_url: string;
  video_thumbnail_url: string | null;
  business_id: string;
}

export function FeaturedVideoProductsCarousel() {
  const navigate = useNavigate();
  const { countryCode } = useCountry();
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title: string } | null>(null);

  const { data: videoProducts, isLoading, error } = useQuery({
    queryKey: ["featured-video-products", countryCode],
    queryFn: async () => {
      // 1. Get businesses from current country
      const { data: businesses } = await supabase
        .from("business_accounts")
        .select("id")
        .eq("country_code", countryCode)
        .eq("status", "approved");

      const businessIds = businesses?.map((b) => b.id) || [];

      if (businessIds.length === 0) return [];

      // 2. Fetch products with video
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, description, price, currency,
          image_url, video_url, video_thumbnail_url,
          business_id
        `)
        .not("video_url", "is", null)
        .eq("is_active", true)
        .in("business_id", businessIds)
        .order("created_at", { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data || []) as VideoProduct[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Loading state
  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-[85%] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  // Don't render if no products with video or error
  if (error || !videoProducts || videoProducts.length === 0) {
    return null;
  }

  const formatPrice = (price: number, currency: string | null) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " " + (currency || "FCFA");
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
            <Video className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-poppins font-semibold text-foreground">
            Produits en vedette
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary/80 gap-1"
          onClick={() => navigate("/shop?filter=video")}
        >
          Voir tout
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Carousel */}
      <Carousel
        opts={{
          align: "start",
          loop: videoProducts.length > 2,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3">
          {videoProducts.map((product) => (
            <CarouselItem key={product.id} className="pl-3 basis-[85%] md:basis-[45%]">
              <Card className="overflow-hidden border-border/50 shadow-soft hover:shadow-md transition-all duration-300 group">
                {/* Video Thumbnail */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={product.video_thumbnail_url || product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Video Badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-primary/90 backdrop-blur-sm rounded-md flex items-center gap-1">
                    <Video className="h-3 w-3 text-primary-foreground" />
                    <span className="text-xs font-medium text-primary-foreground">VIDÉO</span>
                  </div>
                  
                  {/* Play Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVideo({ url: product.video_url, title: product.name });
                    }}
                    className="absolute inset-0 flex items-center justify-center group/play"
                    aria-label="Lire la vidéo"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-white">
                      <Play className="h-6 w-6 text-primary fill-primary ml-1" />
                    </div>
                  </button>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-poppins font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {product.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-poppins font-semibold text-primary">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => navigate(`/shop?business=${product.business_id}`)}
                    >
                      Découvrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Video Player Modal */}
      <VideoPlayer
        videoUrl={selectedVideo?.url || ""}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        title={selectedVideo?.title}
      />
    </section>
  );
}
