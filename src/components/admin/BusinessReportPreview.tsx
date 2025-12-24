import { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import type { BusinessDetailedStats } from '@/hooks/useBusinessDetailedStats';

interface BusinessReportPreviewProps {
  stats: BusinessDetailedStats;
  visible: boolean;
}

const COLORS = ['#7A5DC7', '#C084FC', '#FAD4E1', '#F7C948', '#22C55E', '#3B82F6', '#EF4444', '#8B5CF6'];

export function BusinessReportPreview({ stats, visible }: BusinessReportPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Format data for charts
  const revenueData = stats.revenueByType.map((item, index) => ({
    name: item.type,
    value: item.revenue,
    fill: COLORS[index % COLORS.length],
  }));

  const trendsData = stats.monthlyTrends.map(item => ({
    name: item.label,
    revenue: item.revenue,
    orders: item.orders,
  }));

  const categoryData = stats.productCategoryStats.slice(0, 6).map((item, index) => ({
    name: item.category.length > 12 ? item.category.substring(0, 12) + '...' : item.category,
    count: item.productCount,
    fill: COLORS[index % COLORS.length],
  }));

  if (!visible) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed left-[-9999px] top-0 bg-white"
      style={{ width: '800px' }}
    >
      {/* Revenue by Type Chart */}
      <div id="pdf-revenue-chart" className="bg-white p-4" style={{ width: '800px', height: '300px' }}>
        <h3 className="text-lg font-semibold mb-4 text-center">Revenus par Type de Business</h3>
        <div className="flex items-center justify-around">
          <ResponsiveContainer width={350} height={220}>
            <PieChart>
              <Pie
                data={revenueData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {revenueData.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }} 
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div id="pdf-trends-chart" className="bg-white p-4" style={{ width: '800px', height: '300px' }}>
        <h3 className="text-lg font-semibold mb-4 text-center">Tendances Mensuelles (12 mois)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#7A5DC7" 
              fill="#7A5DC7" 
              fillOpacity={0.3}
              name="Revenus"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Product Categories Chart */}
      <div id="pdf-categories-chart" className="bg-white p-4" style={{ width: '800px', height: '300px' }}>
        <h3 className="text-lg font-semibold mb-4 text-center">Produits par Catégorie</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
