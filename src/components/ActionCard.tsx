import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
interface ActionCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  variant?: "primary" | "success";
  onClick: () => void;
}
export function ActionCard({
  title,
  subtitle,
  icon: Icon,
  variant = "primary",
  onClick
}: ActionCardProps) {
  const iconBg = variant === "success" ? "bg-success" : "bg-secondary";
  const iconColor = variant === "success" ? "text-success-foreground" : "text-secondary-foreground";
  return <Card className="p-6 text-center hover:shadow-soft transition-all duration-200 hover:scale-105 cursor-pointer" onClick={onClick}>
      <div className={`${iconBg} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      
      <h3 className="font-semibold text-foreground mb-2 text-sm mx-0 my-0 py-0 px-[9px]">
        {title}
      </h3>
      
      <p className="text-muted-foreground text-sm">
        {subtitle}
      </p>
    </Card>;
}