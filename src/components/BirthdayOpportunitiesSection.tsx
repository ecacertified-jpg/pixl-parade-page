import { useState } from 'react';
import { Cake, Gift, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BirthdayAlertProductBadge } from '@/components/BirthdayAlertProductBadge';
import { useBusinessBirthdayAlerts, BirthdayAlert } from '@/hooks/useBusinessBirthdayAlerts';
import { Skeleton } from '@/components/ui/skeleton';

interface BirthdayOpportunitiesSectionProps {
  businessId: string;
  onCreateFund: (alert: BirthdayAlert) => void;
}

export function BirthdayOpportunitiesSection({ 
  businessId,
  onCreateFund 
}: BirthdayOpportunitiesSectionProps) {
  const { alerts, loading, alertCounts, dismissAlert } = useBusinessBirthdayAlerts(businessId);
  const [filter, setFilter] = useState<'all' | 'critical' | 'urgent' | 'high'>('all');

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.priority === filter;
  });

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null; // Ne pas afficher si pas d'alertes
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 rounded-full bg-primary/20"
                animate={{
                  rotate: [0, 10, -10, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Cake className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Opportunités d'anniversaire
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {alertCounts.total}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Créez des cagnottes pour les anniversaires à venir
                </p>
              </div>
            </div>

            {/* Stats badges */}
            <div className="hidden md:flex items-center gap-2">
              {alertCounts.critical > 0 && (
                <Badge className="bg-destructive text-destructive-foreground animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {alertCounts.critical} critique{alertCounts.critical > 1 ? 's' : ''}
                </Badge>
              )}
              {alertCounts.urgent > 0 && (
                <Badge className="bg-orange-500 text-white">
                  {alertCounts.urgent} urgent{alertCounts.urgent > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {/* Filters */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mt-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="gap-1">
                Tous
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {alertCounts.total}
                </Badge>
              </TabsTrigger>
              {alertCounts.critical > 0 && (
                <TabsTrigger value="critical" className="gap-1 text-destructive">
                  Critiques
                  <Badge className="bg-destructive text-destructive-foreground ml-1 h-5 px-1.5">
                    {alertCounts.critical}
                  </Badge>
                </TabsTrigger>
              )}
              {alertCounts.urgent > 0 && (
                <TabsTrigger value="urgent" className="gap-1 text-orange-500">
                  Urgents
                  <Badge className="bg-orange-500 text-white ml-1 h-5 px-1.5">
                    {alertCounts.urgent}
                  </Badge>
                </TabsTrigger>
              )}
              {alertCounts.high > 0 && (
                <TabsTrigger value="high" className="gap-1">
                  Prioritaires
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {alertCounts.high}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="relative">
          <AnimatePresence mode="popLayout">
            {filteredAlerts.length > 0 ? (
              <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                layout
              >
                {filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BirthdayAlertProductBadge
                      alert={alert}
                      onCreateFund={onCreateFund}
                      onDismiss={dismissAlert}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">
                  Aucune opportunité dans cette catégorie
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Call to action */}
          {alerts.length > 0 && (
            <motion.div
              className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Augmentez vos ventes</p>
                    <p className="text-sm text-muted-foreground">
                      En créant des cagnottes, vous facilitez les achats groupés
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  En savoir plus
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
