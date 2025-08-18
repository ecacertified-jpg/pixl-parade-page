import { User, Heart, ShoppingBag, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function RecentActivitySection() {
  return (
    <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        
        <div className="flex-1">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Fatou</span> a consulté vos favoris pour votre anniversaire
          </p>
          <span className="text-xs text-muted-foreground">🎂</span>
        </div>
      </div>
    </Card>
  );
}

export function BottomNavigation() {
  const navigate = useNavigate();
  const [giftNotifications, setGiftNotifications] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const loadUnreadGifts = async () => {
      if (!user) return;
      
      try {
        // Count unread gift notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('type', 'gift_received')
          .eq('is_read', false);
        
        setGiftNotifications(count || 0);
      } catch (error) {
        console.error('Error loading gift notifications:', error);
      }
    };

    loadUnreadGifts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('gift-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}&type=eq.gift_received`
        },
        () => loadUnreadGifts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  const navItems = [
    { icon: <User className="h-5 w-5" />, label: "Accueil", active: true, path: "/" },
    { icon: <ShoppingBag className="h-5 w-5" />, label: "Boutique", active: false, path: "/shop" },
    { 
      icon: <Gift className="h-5 w-5" />, 
      label: "Cadeaux", 
      active: false, 
      path: "/gifts",
      badge: giftNotifications > 0 ? giftNotifications.toString() : undefined,
      isBlinking: giftNotifications > 0
    },
    { icon: <Heart className="h-5 w-5" />, label: "Favoris", active: false, badge: "3", path: "/favorites" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 backdrop-blur-sm">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex items-center justify-around">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 py-2 relative"
            >
              <div className="relative">
                <div className={`p-1 ${item.active ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {item.icon}
                </div>
                {item.badge && (
                  <div className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ${item.isBlinking ? 'animate-pulse' : ''}`}>
                    {item.badge}
                  </div>
                )}
              </div>
              <span className={`text-xs ${item.active ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}