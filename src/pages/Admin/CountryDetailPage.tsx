import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { useCountryPerformance } from '@/hooks/useCountryPerformance';
import { useAdminCountry } from '@/contexts/AdminCountryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Store, DollarSign, ShoppingCart, TrendingUp, TrendingDown, Minus, Percent, Gift, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TopBusiness {
  id: string;
  name: string;
  type: string;
  revenue: number;
  orders: number;
}

interface BusinessTypeDistribution {
  type: string;
  count: number;
}

const COLORS = ['#7A5DC7', '#C084FC', '#F59E0B', '#22C55E', '#3B82F6', '#EC4899'];

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const GrowthIndicator = ({ rate }: { rate: number }) => {
  if (rate > 0) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">+{rate.toFixed(1)}%</span>
      </div>
    );
  }
  if (rate < 0) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="h-4 w-4" />
        <span className="text-sm font-medium">{rate.toFixed(1)}%</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Minus className="h-4 w-4" />
      <span className="text-sm font-medium">0%</span>
    </div>
  );
};

const CountryDetailPage = () => {
  const { countryCode } = useParams<{ countryCode: string }>();
  const navigate = useNavigate();
  const { countries, trends, loading } = useCountryPerformance();
  const { setSelectedCountry } = useAdminCountry();

  const handleNavigate = (path: string) => {
    if (countryCode) {
      // For users and businesses, use dedicated country pages
      if (path === '/admin/users') {
        navigate(`/admin/countries/${countryCode}/users`);
        return;
      }
      if (path === '/admin/businesses') {
        navigate(`/admin/countries/${countryCode}/businesses`);
        return;
      }
      if (path === '/admin/funds') {
        navigate(`/admin/countries/${countryCode}/funds`);
        return;
      }
      setSelectedCountry(countryCode);
      navigate(`${path}?country=${countryCode}`);
    } else {
      navigate(path);
    }
  };
  const [topBusinesses, setTopBusinesses] = useState<TopBusiness[]>([]);
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeDistribution[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  const country = countries.find(c => c.countryCode === countryCode);
  const countryTrends = trends[countryCode || ''] || [];

  useEffect(() => {
    const fetchDetails = async () => {
      if (!countryCode) return;
      setLoadingDetails(true);

      try {
        // Fetch businesses for this country
        const { data: businesses } = await supabase
          .from('business_accounts')
          .select('id, business_name, business_type')
          .eq('country_code', countryCode)
          .is('deleted_at', null);

        // Fetch orders for these businesses
        const businessIds = businesses?.map(b => b.id) || [];
        const { data: orders } = await supabase
          .from('business_orders')
          .select('business_account_id, total_amount')
          .in('business_account_id', businessIds);

        // Calculate revenue per business
        const revenueMap = new Map<string, { revenue: number; orders: number }>();
        orders?.forEach(order => {
          const current = revenueMap.get(order.business_account_id) || { revenue: 0, orders: 0 };
          current.revenue += order.total_amount || 0;
          current.orders++;
          revenueMap.set(order.business_account_id, current);
        });

        // Get top businesses by revenue
        const businessesWithRevenue = businesses?.map(b => ({
          id: b.id,
          name: b.business_name,
          type: b.business_type || 'Autre',
          revenue: revenueMap.get(b.id)?.revenue || 0,
          orders: revenueMap.get(b.id)?.orders || 0,
        })) || [];

        setTopBusinesses(
          businessesWithRevenue
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
        );

        // Calculate business type distribution
        const typeCount = new Map<string, number>();
        businesses?.forEach(b => {
          const type = b.business_type || 'Autre';
          typeCount.set(type, (typeCount.get(type) || 0) + 1);
        });

        setBusinessTypes(
          Array.from(typeCount.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
        );
      } catch (error) {
        console.error('Error fetching country details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [countryCode]);

  if (loading || !country) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => navigate('/admin/countries')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="h-96 animate-pulse bg-muted rounded-lg" />
        </div>
      </AdminLayout>
    );
  }

  const chartData = countryTrends.map(t => ({
    month: t.label,
    users: t.users,
    revenue: t.revenue,
    orders: t.orders,
  }));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/countries')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{country.flag}</span>
            <div>
              <h1 className="text-2xl font-bold">{country.countryName}</h1>
              <Badge variant="outline">{country.countryCode}</Badge>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/users')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs</p>
                    <p className="text-2xl font-bold">{country.totalUsers.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-muted-foreground mt-1">+{country.newUsersLast30Days} ce mois</p>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>Voir détails</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/businesses')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entreprises</p>
                    <p className="text-2xl font-bold">{country.totalBusinesses}</p>
                    <p className="text-xs text-muted-foreground mt-1">{country.activeBusinesses} actives, {country.verifiedBusinesses} vérifiées</p>
                  </div>
                  <div className="p-3 rounded-full bg-accent/20">
                    <Store className="h-5 w-5 text-accent-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>Voir détails</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/business-analytics')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revenus</p>
                    <p className="text-2xl font-bold">{formatCurrency(country.totalRevenue)} FCFA</p>
                    <div className="mt-1">
                      <GrowthIndicator rate={country.revenueGrowthRate} />
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>Voir détails</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/business-analytics')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taux de conversion</p>
                    <p className="text-2xl font-bold">{country.conversionRate.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Users → Business</p>
                  </div>
                  <div className="p-3 rounded-full bg-muted">
                    <Percent className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>Voir détails</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Additional KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/orders')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Commandes</p>
                      <p className="text-xl font-bold">{country.totalOrders}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/orders')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Panier moyen</p>
                      <p className="text-xl font-bold">{formatCurrency(country.avgOrderValue)} FCFA</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onClick={() => handleNavigate('/admin/funds')} className="cursor-pointer">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Gift className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cagnottes</p>
                      <p className="text-xl font-bold">{country.totalFunds} ({country.activeFunds} actives)</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Monthly Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'revenue') return [`${formatCurrency(value)} FCFA`, 'Revenus'];
                      return [value, name === 'users' ? 'Utilisateurs' : 'Commandes'];
                    }}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="users"
                    name="Utilisateurs"
                    stroke="#7A5DC7"
                    fill="#7A5DC7"
                    fillOpacity={0.3}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenus"
                    stroke="#22C55E"
                    fill="#22C55E"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée de tendance disponible
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Businesses */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 entreprises par revenus</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 animate-pulse bg-muted rounded" />
                  ))}
                </div>
              ) : topBusinesses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune entreprise trouvée
                </p>
              ) : (
                <div className="space-y-3">
                  {topBusinesses.map((biz, index) => (
                    <div
                      key={biz.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{biz.name}</p>
                          <p className="text-xs text-muted-foreground">{biz.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(biz.revenue)} FCFA</p>
                        <p className="text-xs text-muted-foreground">{biz.orders} commandes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par type d'entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDetails ? (
                <div className="h-[300px] animate-pulse bg-muted rounded" />
              ) : businessTypes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune donnée disponible
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={businessTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                      label={({ type, percent }) => `${type} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {businessTypes.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CountryDetailPage;
