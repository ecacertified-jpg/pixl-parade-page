import { Users, Store, ShoppingCart, Gift, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LiveStats } from '@/hooks/useRealtimeDashboard';
import { motion, AnimatePresence } from 'framer-motion';

interface RealtimeStatsCardsProps {
  stats: LiveStats;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  format?: 'number' | 'currency';
}

function StatCard({ icon: Icon, label, value, suffix, color, format = 'number' }: StatCardProps) {
  const displayValue = format === 'currency' 
    ? value.toLocaleString('fr-FR') 
    : value;

  // Shorten suffix on mobile
  const displaySuffix = suffix === "aujourd'hui" ? "auj." : suffix;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      "hover:shadow-lg hover:scale-[1.02]"
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "p-1.5 sm:p-2 rounded-lg flex-shrink-0",
            color
          )}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
            <AnimatePresence mode="wait">
              <motion.div
                key={value}
                initial={{ scale: 1.1, color: 'hsl(var(--primary))' }}
                animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                className="flex items-baseline gap-1"
              >
                <span className="text-lg sm:text-2xl font-bold truncate">
                  {displayValue}
                </span>
                {suffix && (
                  <span className="text-[10px] sm:text-xs font-normal text-muted-foreground hidden xs:inline">
                    {displaySuffix}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </CardContent>
      {/* Pulse animation on update */}
      <motion.div
        key={value}
        initial={{ opacity: 0.5, scale: 0 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "absolute inset-0 rounded-lg pointer-events-none",
          color.replace('bg-', 'bg-').replace('/20', '/10')
        )}
      />
    </Card>
  );
}

export function RealtimeStatsCards({ stats }: RealtimeStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard
        icon={Users}
        label="Utilisateurs"
        value={stats.todayUsers}
        suffix="aujourd'hui"
        color="bg-blue-500"
      />
      <StatCard
        icon={Store}
        label="Business"
        value={stats.todayBusinesses}
        suffix="aujourd'hui"
        color="bg-purple-500"
      />
      <StatCard
        icon={ShoppingCart}
        label="Commandes"
        value={stats.todayOrders}
        suffix="aujourd'hui"
        color="bg-green-500"
      />
      <StatCard
        icon={Gift}
        label="Cagnottes"
        value={stats.todayFunds}
        suffix="aujourd'hui"
        color="bg-pink-500"
      />
      <StatCard
        icon={Coins}
        label="Contributions"
        value={stats.todayContributions}
        suffix="aujourd'hui"
        color="bg-amber-500"
      />
      <StatCard
        icon={Coins}
        label="Montant collecté"
        value={stats.totalContributionAmount}
        suffix="XOF"
        color="bg-emerald-500"
        format="currency"
      />
    </div>
  );
}
