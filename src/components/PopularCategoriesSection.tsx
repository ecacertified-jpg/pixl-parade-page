import { Gem, Sparkles, Hammer, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CategoryButtonProps {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
}

function CategoryButton({ title, icon, bgColor }: CategoryButtonProps) {
  return (
    <Button 
      variant="secondary"
      className={`${bgColor} text-white border-0 hover:opacity-90 transition-opacity rounded-full px-4 py-2 h-auto`}
    >
      <span className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{title}</span>
      </span>
    </Button>
  );
}

export function PopularCategoriesSection() {
  const categories = [
    {
      title: "Bijoux",
      icon: <Gem className="h-4 w-4" />,
      bgColor: "bg-gradient-to-r from-yellow-500 to-orange-500"
    },
    {
      title: "Parfums", 
      icon: <Sparkles className="h-4 w-4" />,
      bgColor: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    {
      title: "Artisanat",
      icon: <Hammer className="h-4 w-4" />,
      bgColor: "bg-gradient-to-r from-green-500 to-emerald-500"
    },
    {
      title: "Tech",
      icon: <Smartphone className="h-4 w-4" />,
      bgColor: "bg-gradient-to-r from-blue-500 to-indigo-500"
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-orange-500">🔥</span>
        <h3 className="text-lg font-bold text-foreground">Catégories populaires</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <CategoryButton key={index} {...category} />
        ))}
      </div>
    </div>
  );
}