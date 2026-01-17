import { Star, MapPin, Package, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import type { BusinessMapPoint } from '@/hooks/useExploreMapData';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessMapCardProps {
  business: BusinessMapPoint | null;
  onClose: () => void;
  userLocation?: { lat: number; lng: number } | null;
}

export function BusinessMapCard({ business, onClose, userLocation }: BusinessMapCardProps) {
  const navigate = useNavigate();

  if (!business) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleViewShop = () => {
    navigate(`/boutique/${business.id}`);
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute bottom-4 left-4 right-4 z-20"
      >
        <Card className="p-4 bg-card/95 backdrop-blur-sm border-border shadow-lg">
          <div className="flex gap-4">
            {/* Avatar */}
            <Avatar className="h-16 w-16 rounded-xl border-2 border-primary/20">
              {business.logo ? (
                <AvatarImage src={business.logo} alt={business.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {getInitials(business.name)}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {business.rating && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{business.rating}</span>
                        <span className="text-muted-foreground">({business.ratingCount})</span>
                      </div>
                    )}
                    
                    {business.type && (
                      <Badge variant="secondary" className="text-xs">
                        {business.type}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground"
                  onClick={onClose}
                >
                  ×
                </Button>
              </div>

              {/* Address */}
              {business.address && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{business.address}</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  <span>{business.productCount} produits</span>
                </div>
                
                {!business.isExactLocation && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    Position approximative
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleGetDirections}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Itinéraire
            </Button>
            
            <Button
              size="sm"
              className="flex-1"
              onClick={handleViewShop}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la boutique
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
