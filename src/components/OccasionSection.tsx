import { Gift, GraduationCap, Star, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
interface OccasionCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBg: string;
}
function OccasionCard({
  title,
  subtitle,
  icon,
  bgColor,
  iconBg
}: OccasionCardProps) {
  return <Card className={`p-4 text-center hover:shadow-soft transition-all duration-200 hover:scale-105 cursor-pointer ${bgColor}`}>
      <div className={`${iconBg} w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3`}>
        {icon}
      </div>
      
      <div className="mb-2">
        
      </div>
      
      <h4 className="font-semibold text-foreground mb-1 text-sm">
        {title}
      </h4>
      
      <p className="text-xs text-muted-foreground">
        {subtitle}
      </p>
    </Card>;
}
export function OccasionSection() {
  const occasions = [{
    title: "Anniversaires",
    subtitle: "Célébrez une année de plus avec style",
    icon: <Gift className="h-6 w-6 text-white" />,
    bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
    iconBg: "bg-pink-500"
  }, {
    title: "Réussites Académiques",
    subtitle: "Félicitez vos accomplissements",
    icon: <GraduationCap className="h-6 w-6 text-white" />,
    bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
    iconBg: "bg-blue-500"
  }, {
    title: "Promotions Pro",
    subtitle: "Montez en grade avec élégance",
    icon: <Star className="h-6 w-6 text-white" />,
    bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
    iconBg: "bg-purple-500"
  }, {
    title: "Mariages",
    subtitle: "Dites oui au bonheur éternel",
    icon: <Heart className="h-6 w-6 text-white" />,
    bgColor: "bg-gradient-to-br from-red-50 to-red-100",
    iconBg: "bg-red-500"
  }];
  return <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-orange-500">🗓️</span>
        <h3 className="text-lg font-bold text-foreground">Quelle occasion célébrez-vous ?</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {occasions.map((occasion, index) => <OccasionCard key={index} {...occasion} />)}
      </div>
    </div>;
}