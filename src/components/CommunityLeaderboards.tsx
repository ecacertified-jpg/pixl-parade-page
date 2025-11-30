import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Medal, Gift, Heart, TrendingUp } from "lucide-react";
import { useCommunityLeaderboards } from "@/hooks/useCommunityLeaderboards";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const badgeConfig = {
  platinum: { label: "Platine", icon: <Trophy className="h-4 w-4" />, color: "bg-gradient-to-r from-slate-300 to-slate-100" },
  gold: { label: "Or", icon: <Award className="h-4 w-4" />, color: "bg-gradient-to-r from-yellow-400 to-yellow-200" },
  silver: { label: "Argent", icon: <Medal className="h-4 w-4" />, color: "bg-gradient-to-r from-gray-400 to-gray-200" },
  bronze: { label: "Bronze", icon: <Gift className="h-4 w-4" />, color: "bg-gradient-to-r from-amber-600 to-amber-400" }
};

export const CommunityLeaderboards = () => {
  const { leaderboard, loading } = useCommunityLeaderboards(10);

  if (loading) {
    return (
      <Card className="backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            Top Donateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-5 w-5 text-primary" />
            Top Donateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Soyez le premier à apparaître dans le classement !
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 rounded-full bg-primary/10">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span>Top Donateurs du Mois</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            </div>
            <p className="text-xs font-normal text-muted-foreground mt-1">
              Les membres les plus généreux de notre communauté
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const badgeInfo = badgeConfig[entry.badgeLevel as keyof typeof badgeConfig] || badgeConfig.bronze;
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  index < 3 ? 'bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20' : 'bg-card/50 border-border/30'
                }`}
              >
                <div className="text-2xl font-bold w-10 text-center">
                  {rankEmoji}
                </div>
                
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-sm font-semibold ${badgeInfo.color} text-white`}>
                    {entry.userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground truncate">
                      {entry.userName}
                    </h4>
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      {badgeInfo.icon}
                      <span className="ml-1">{badgeInfo.label}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Gift className="h-3 w-3" />
                      {entry.giftsGivenCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {entry.fundsCreatedCount}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {entry.totalPoints}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    points
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};