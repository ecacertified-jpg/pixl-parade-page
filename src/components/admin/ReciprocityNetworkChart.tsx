import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReciprocityRelation {
  donor_id: string;
  beneficiary_id: string;
  times_helped: number;
  total_given: number;
  times_returned: number;
  total_returned: number;
  relationship_type: 'reciprocal' | 'one_way';
}

interface ReciprocityNetworkChartProps {
  networkData: ReciprocityRelation[];
}

export function ReciprocityNetworkChart({ networkData }: ReciprocityNetworkChartProps) {
  const chartData = networkData.map((relation) => ({
    x: relation.total_given,
    y: relation.total_returned,
    z: relation.times_helped * 100,
    type: relation.relationship_type,
    name: `${relation.times_helped} contributions`,
  }));

  const reciprocalCount = networkData.filter(r => r.relationship_type === 'reciprocal').length;
  const oneWayCount = networkData.filter(r => r.relationship_type === 'one_way').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réseau de Réciprocité</CardTitle>
        <CardDescription>
          Visualisation des relations donneur/bénéficiaire - 
          {' '}{reciprocalCount} réciproques, {oneWayCount} unilatérales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Montant donné"
              className="text-muted-foreground"
              label={{ value: 'Montant donné (XOF)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Montant reçu"
              className="text-muted-foreground"
              label={{ value: 'Montant reçu (XOF)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Donné: {data.x.toLocaleString('fr-FR')} XOF
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reçu: {data.y.toLocaleString('fr-FR')} XOF
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {data.type === 'reciprocal' ? '🔄 Réciproque' : '➡️ Unilatérale'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Relations" data={chartData} fill="hsl(var(--primary))">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.type === 'reciprocal' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  fillOpacity={entry.type === 'reciprocal' ? 0.8 : 0.4}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
