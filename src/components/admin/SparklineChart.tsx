import { Area, AreaChart, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
  showDot?: boolean;
  className?: string;
}

export function SparklineChart({
  data,
  color = 'hsl(var(--primary))',
  height = 40,
  showArea = true,
  showDot = true,
  className = ''
}: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ value, index }));
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  if (data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-muted-foreground text-xs ${className}`}
        style={{ height }}
      >
        Aucune donnée
      </div>
    );
  }

  return (
    <div className={className} style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          {showArea && (
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              animationDuration={500}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            animationDuration={500}
          />
          {showDot && data.length > 0 && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="none"
              dot={(props) => {
                if (props.index === data.length - 1) {
                  return (
                    <circle
                      key={props.index}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={color}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  );
                }
                return <g key={props.index} />;
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
