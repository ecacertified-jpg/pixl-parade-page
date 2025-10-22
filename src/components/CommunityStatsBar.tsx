import { motion } from "framer-motion";
import { Gift, Cake, TrendingUp, Users } from "lucide-react";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { Skeleton } from "@/components/ui/skeleton";

export const CommunityStatsBar = () => {
  const { stats, loading } = useCommunityStats();

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-4 rounded-xl mb-6">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: <Gift className="h-5 w-5" />,
      value: stats.giftsThisWeek,
      label: "cadeaux cette semaine",
      color: "text-pink-500"
    },
    {
      icon: <Cake className="h-5 w-5" />,
      value: stats.birthdaysToday,
      label: "anniversaires aujourd'hui",
      color: "text-yellow-500"
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      value: stats.activeFunds,
      label: "cagnottes actives",
      color: "text-green-500"
    },
    {
      icon: <Users className="h-5 w-5" />,
      value: stats.activeUsers,
      label: "utilisateurs actifs",
      color: "text-blue-500"
    }
  ];

  return (
    <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 p-4 rounded-xl mb-6 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        {statItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3"
          >
            <div className={`p-2 rounded-full bg-background/50 ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <motion.div
                key={item.value}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold text-foreground"
              >
                {item.value}
              </motion.div>
              <div className="text-xs text-muted-foreground truncate">
                {item.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};