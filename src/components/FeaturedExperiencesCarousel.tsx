import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const FeaturedExperiencesCarousel = () => {
  const navigate = useNavigate();

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["featured-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_experience", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!experiences || experiences.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-poppins font-semibold text-foreground">
            Expériences Premium
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/shop?tab=experiences")}
          className="text-primary hover:text-primary/80"
        >
          Voir tout
        </Button>
      </div>

      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {experiences.map((experience) => (
            <CarouselItem key={experience.id} className="pl-2 md:pl-4 basis-[85%] md:basis-[45%]">
              <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300 hover:border-primary/30 group cursor-pointer">
                <CardContent className="p-0" onClick={() => navigate("/shop?tab=experiences")}>
                  <div className="relative h-48 overflow-hidden">
                    {experience.image_url ? (
                      <img
                        src={experience.image_url}
                        alt={experience.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                        <Sparkles className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-medium">
                        EXPÉRIENCE
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-poppins font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {experience.name}
                      </h3>
                      {experience.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {experience.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {experience.category_name && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{experience.category_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>1-4 personnes</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div>
                        <p className="text-xs text-muted-foreground">À partir de</p>
                        <p className="text-lg font-bold text-primary">
                          {experience.price.toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                      <Button size="sm" className="bg-primary hover:bg-primary/90">
                        Réserver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:-left-6" />
        <CarouselNext className="-right-4 md:-right-6" />
      </Carousel>
    </div>
  );
};
