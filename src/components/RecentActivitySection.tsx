import { Home, ShoppingBag, Plus, Gift as GiftIcon, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreateActionMenu } from "./CreateActionMenu";
import { ValueModal } from "./ValueModal";

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
  const location = useLocation();
  const [giftNotifications, setGiftNotifications] = useState(0);
  const [showValueModal, setShowValueModal] = useState(false);
  const { user } = useAuth();

  const handleShopClick = () => {
    const dontShow = localStorage.getItem('jdv_value_modal_dont_show');
    
    if (dontShow === 'true') {
      navigate("/shop");
    } else {
      setShowValueModal(true);
    }
  };

  useEffect(() => {
    const loadUnreadGifts = async () => {
      if (!user) return;
      
      try {
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
    { 
      icon: Home,
      label: "Accueil", 
      isActive: location.pathname === "/",
      onClick: () => navigate("/")
    },
    { 
      icon: ShoppingBag,
      label: "Boutique", 
      isActive: location.pathname === "/shop",
      onClick: handleShopClick
    },
    { 
      icon: Plus,
      label: "Créer", 
      isActive: false,
      onClick: () => {},
      customRender: true
    },
    { 
      icon: GiftIcon,
      label: "Cadeaux", 
      isActive: location.pathname === "/gifts",
      onClick: () => navigate("/gifts"),
      badge: giftNotifications > 0 ? giftNotifications : null
    },
    { 
      icon: Users,
      label: "Communauté", 
      isActive: location.pathname === "/community",
      onClick: () => navigate("/community")
    }
  ];

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border/50 backdrop-blur-sm z-50">
        <div className="max-w-md mx-auto">
          <nav className="flex items-center justify-around px-4 py-3">
            {navItems.map((item, index) => {
              // Special rendering for Create button with menu
              if (item.customRender) {
                return (
                  <CreateActionMenu key={index}>
                    <button className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 hover:bg-primary/5 relative">
                      <div className="relative bg-gradient-to-r from-primary to-secondary text-white rounded-full p-3 shadow-lg">
                        <item.icon className="h-5 w-5" />
                      </div>
                    </button>
                  </CreateActionMenu>
                );
              }

              // Default rendering for other buttons
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 hover:bg-primary/5 relative ${
                    item.isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div className="relative">
                    <item.icon
                      className={`h-6 w-6 transition-all duration-200 ${
                        item.isActive ? "scale-110" : ""
                      }`}
                    />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-200 ${
                      item.isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <ValueModal isOpen={showValueModal} onClose={() => setShowValueModal(false)} />
    </>
  );
}
