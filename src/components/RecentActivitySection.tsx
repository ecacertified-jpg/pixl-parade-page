import { User, Heart, ShoppingBag, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

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
  
  const navItems = [
    { icon: <User className="h-5 w-5" />, label: "Accueil", active: true, path: "/" },
    { icon: <ShoppingBag className="h-5 w-5" />, label: "Boutique", active: false, path: "/shop" },
    { icon: <Gift className="h-5 w-5" />, label: "Cadeaux", active: false, path: "/gifts" },
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
                  <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
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