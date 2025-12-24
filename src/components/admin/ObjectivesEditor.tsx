import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMonthlyObjectives } from '@/hooks/useMonthlyObjectives';
import { Copy, Save, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear + 1 - i);

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const metricTypes = [
  { key: 'users', label: 'Utilisateurs', icon: '👤' },
  { key: 'businesses', label: 'Business', icon: '🏢' },
  { key: 'revenue', label: 'Revenus (XOF)', icon: '💰' },
  { key: 'orders', label: 'Commandes', icon: '📦' },
  { key: 'funds', label: 'Cagnottes', icon: '🎁' }
];

export function ObjectivesEditor() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copyFromYear, setCopyFromYear] = useState<number | null>(null);
  
  const { objectives, loading, setObjective, copyFromYear: copyObjectives, getObjectiveValue } = useMonthlyObjectives(selectedYear);

  const getKey = (month: number, metric: string) => `${month}-${metric}`;

  const getValue = (month: number, metric: string): string => {
    const key = getKey(month, metric);
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    const value = getObjectiveValue(month, metric);
    return value !== null ? String(value) : '';
  };

  const handleChange = (month: number, metric: string, value: string) => {
    const key = getKey(month, metric);
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(editedValues).filter(([_, value]) => value !== '');
      
      for (const [key, value] of updates) {
        const [monthStr, metric] = key.split('-');
        const month = parseInt(monthStr);
        const numValue = parseFloat(value);
        
        if (!isNaN(numValue) && numValue >= 0) {
          await setObjective(month, metric, numValue);
        }
      }
      
      setEditedValues({});
      toast.success('Objectifs enregistrés');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromYear = async () => {
    if (!copyFromYear) return;
    await copyObjectives(copyFromYear);
    setCopyFromYear(null);
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Objectifs mensuels
        </CardTitle>
        <CardDescription>
          Définissez les objectifs pour chaque métrique par mois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Select value={copyFromYear ? String(copyFromYear) : ''} onValueChange={(v) => setCopyFromYear(Number(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Copier depuis..." />
              </SelectTrigger>
              <SelectContent>
                {years.filter(y => y !== selectedYear).map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {copyFromYear && (
              <Button variant="outline" size="sm" onClick={handleCopyFromYear}>
                <Copy className="h-4 w-4 mr-2" />
                Copier
              </Button>
            )}
          </div>

          {hasChanges && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          )}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Mois</TableHead>
                {metricTypes.map(metric => (
                  <TableHead key={metric.key} className="text-center min-w-[120px]">
                    <span className="flex items-center justify-center gap-1">
                      <span>{metric.icon}</span>
                      <span className="hidden sm:inline">{metric.label}</span>
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((monthName, index) => {
                const month = index + 1;
                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{monthName}</TableCell>
                    {metricTypes.map(metric => (
                      <TableCell key={metric.key} className="p-1">
                        <Input
                          type="number"
                          min="0"
                          step={metric.key === 'revenue' ? '1000' : '1'}
                          placeholder="—"
                          value={getValue(month, metric.key)}
                          onChange={(e) => handleChange(month, metric.key, e.target.value)}
                          className="h-8 text-center text-sm"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          💡 Les objectifs sont utilisés pour calculer les taux d'atteinte dans le tableau comparatif mensuel.
        </p>
      </CardContent>
    </Card>
  );
}
