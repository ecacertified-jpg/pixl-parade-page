import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Gift, 
  Users, 
  Lightbulb, 
  Sparkles,
  ChevronRight,
  ShoppingCart,
  Heart,
  X
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

interface GiftSuggestion {
  id: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  match_score: number;
  reason: string;
  category?: string;
}

interface BirthdayReminderCardProps {
  notification: {
    id: string;
    contact_id: string;
    contact_name: string;
    contact_relationship?: string;
    days_until: number;
    birthday_date: string;
    reminder_type: string;
    has_active_fund: boolean;
    gift_suggestions: GiftSuggestion[];
  };
  onDismiss?: (id: string) => void;
  onMarkAsRead?: (id: string) => void;
}

export function BirthdayReminderCard({ 
  notification, 
  onDismiss,
  onMarkAsRead 
}: BirthdayReminderCardProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { addFavorite } = useFavorites();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

  const getUrgencyColor = () => {
    if (notification.days_until <= 1) return "border-l-destructive bg-destructive/5";
    if (notification.days_until <= 3) return "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20";
    if (notification.days_until <= 7) return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20";
    return "border-l-primary bg-primary/5";
  };

  const getBadgeVariant = () => {
    if (notification.days_until <= 1) return "destructive";
    if (notification.days_until <= 3) return "secondary";
    return "outline";
  };

  const handleAddToCart = (suggestion: GiftSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id: suggestion.id,
      name: suggestion.name,
      price: suggestion.price,
      currency: suggestion.currency,
      image: suggestion.image,
      quantity: 1
    });
    toast({
      title: "Ajouté au panier",
      description: `${suggestion.name} a été ajouté au panier`
    });
  };

  const handleAddToFavorites = async (suggestion: GiftSuggestion, e: React.MouseEvent) => {
    e.stopPropagation();
    await addFavorite(suggestion.id);
    toast({
      title: "Ajouté aux favoris",
      description: `${suggestion.name} a été ajouté à vos favoris`
    });
  };

  const handleViewMore = () => {
    if (onMarkAsRead) onMarkAsRead(notification.id);
    navigate(`/gift-ideas/${notification.contact_id}`);
  };

  const handleCreateFund = () => {
    if (onMarkAsRead) onMarkAsRead(notification.id);
    navigate(`/gifts?action=create-fund&contactId=${notification.contact_id}`);
  };

  return (
    <Card 
      className={`border-l-4 transition-all duration-200 ${getUrgencyColor()} ${isHovered ? 'shadow-md' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {notification.contact_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-base">{notification.contact_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {notification.contact_relationship && (
                  <span className="text-xs text-muted-foreground">
                    {notification.contact_relationship}
                  </span>
                )}
                <Badge variant={getBadgeVariant()} className="text-xs">
                  {notification.days_until === 0 
                    ? "Aujourd'hui ! 🎉" 
                    : notification.days_until === 1 
                      ? "Demain !" 
                      : `Dans ${notification.days_until} jours`}
                </Badge>
              </div>
            </div>
          </div>
          
          {onDismiss && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onDismiss(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {/* Gift Suggestions */}
        {notification.gift_suggestions && notification.gift_suggestions.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Suggestions personnalisées</span>
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-2">
                {notification.gift_suggestions.map((suggestion) => (
                  <div 
                    key={suggestion.id}
                    className="flex-shrink-0 w-32 group cursor-pointer"
                    onClick={() => navigate(`/shop?product=${suggestion.id}`)}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-muted aspect-square mb-2">
                      {suggestion.image ? (
                        <img 
                          src={suggestion.image} 
                          alt={suggestion.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Match score badge */}
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1 right-1 text-[10px] px-1.5 py-0"
                      >
                        {suggestion.match_score}%
                      </Badge>
                      
                      {/* Quick actions on hover */}
                      <div className="absolute bottom-1 left-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={(e) => handleAddToCart(suggestion, e)}
                        >
                          <ShoppingCart className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-7 w-7"
                          onClick={(e) => handleAddToFavorites(suggestion, e)}
                        >
                          <Heart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs font-medium truncate">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.price.toLocaleString()} {suggestion.currency}
                    </p>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleViewMore}
          >
            <Lightbulb className="h-4 w-4 mr-1.5" />
            Plus d'idées
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          
          {!notification.has_active_fund && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleCreateFund}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Cagnotte
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
