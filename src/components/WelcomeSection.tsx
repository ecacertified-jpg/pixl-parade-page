import { Sparkles } from "lucide-react";
import celebrationHero from "@/assets/celebration-hero.jpg";
interface WelcomeSectionProps {
  userName: string;
}
export function WelcomeSection({
  userName
}: WelcomeSectionProps) {
  return <div className="relative overflow-hidden bg-gradient-to-br from-background to-primary/5 rounded-2xl p-6 mb-6 shadow-card bg-sky-300">
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <img src={celebrationHero} alt="Celebration" className="w-full h-full object-cover rounded-full" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">
            Salut {userName} !
          </h2>
        </div>
        
        <p className="text-muted-foreground mb-4 max-w-md px-0 py-0 mx-0 text-sm text-left">
          Célébrez et offrez des moments de bonheur à vos proches
        </p>
        
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-3 border border-primary/20 rounded-lg bg-sky-100">
          <p className="flex items-center gap-2 font-normal mx-[7px] text-center text-xs text-fuchsia-950">
            <Sparkles className="h-4 w-4 text-primary" />
            Cadeaux partagés • Liste de souhaits • Livraison rapide
          </p>
        </div>
      </div>
    </div>;
}