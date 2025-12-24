import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChartDataPoint } from '@/hooks/useRealtimeDashboard';

interface RealtimeChartProps {
  data: ChartDataPoint[];
}

export function RealtimeChart({ data }: RealtimeChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBusinesses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorFunds" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="users"
            name="Utilisateurs"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorUsers)"
            stackId="1"
          />
          <Area
            type="monotone"
            dataKey="businesses"
            name="Business"
            stroke="#8B5CF6"
            fillOpacity={1}
            fill="url(#colorBusinesses)"
            stackId="2"
          />
          <Area
            type="monotone"
            dataKey="orders"
            name="Commandes"
            stroke="#22C55E"
            fillOpacity={1}
            fill="url(#colorOrders)"
            stackId="3"
          />
          <Area
            type="monotone"
            dataKey="funds"
            name="Cagnottes"
            stroke="#EC4899"
            fillOpacity={1}
            fill="url(#colorFunds)"
            stackId="4"
          />
          <Area
            type="monotone"
            dataKey="contributions"
            name="Contributions"
            stroke="#F59E0B"
            fillOpacity={1}
            fill="url(#colorContributions)"
            stackId="5"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
