import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCountryObjectives, SetObjectiveParams } from '@/hooks/useCountryObjectives';
import { AutoSuggestDialog } from './AutoSuggestDialog';
import { Save, Copy, Loader2, Users, Building2, Wallet, ShoppingCart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountryObjectivesEditorProps {
  countryCode: string;
  countryName: string;
  flag: string;
  allCountries: Array<{ code: string; name: string; flag: string }>;
}

const MONTHS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' }
];

const METRIC_TYPES = [
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'businesses', label: 'Entreprises', icon: Building2 },
  { key: 'revenue', label: 'Revenus', icon: Wallet },
  { key: 'orders', label: 'Commandes', icon: ShoppingCart }
];

const YEARS = [2024, 2025, 2026, 2027];

export function CountryObjectivesEditor({
  countryCode,
  countryName,
  flag,
  allCountries
}: CountryObjectivesEditorProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copyFromCountryCode, setCopyFromCountryCode] = useState<string>('');
  const [copyFromYearValue, setCopyFromYearValue] = useState<number | null>(null);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  const { 
    objectives, 
    loading, 
    refresh,
    getObjectiveValue, 
    bulkSetObjectives,
    copyFromCountry,
    copyFromYear: copyFromYearFn 
  } = useCountryObjectives(selectedYear, countryCode);

  useEffect(() => {
    setEditedValues({});
  }, [objectives, selectedYear, countryCode]);

  const getKey = (month: number, metric: string) => `${month}-${metric}`;

  const getValue = (month: number, metric: string): string => {
    const key = getKey(month, metric);
    if (editedValues[key] !== undefined) {
      return editedValues[key];
    }
    const value = getObjectiveValue(countryCode, month, metric);
    return value !== null ? value.toString() : '';
  };

  const handleChange = (month: number, metric: string, value: string) => {
    const key = getKey(month, metric);
    setEditedValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const objectivesToSet: SetObjectiveParams[] = [];
      
      Object.entries(editedValues).forEach(([key, value]) => {
        const [monthStr, metricType] = key.split('-');
        const month = parseInt(monthStr, 10);
        const targetValue = parseFloat(value);
        
        if (!isNaN(targetValue) && targetValue > 0) {
          objectivesToSet.push({
            countryCode,
            month,
            metricType,
            targetValue
          });
        }
      });

      if (objectivesToSet.length > 0) {
        await bulkSetObjectives(objectivesToSet);
      }
      
      setEditedValues({});
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromCountry = async () => {
    if (!copyFromCountryCode) return;
    await copyFromCountry(copyFromCountryCode, countryCode);
    setCopyFromCountryCode('');
  };

  const handleCopyFromYear = async () => {
    if (!copyFromYearValue) return;
    await copyFromYearFn(copyFromYearValue, countryCode);
    setCopyFromYearValue(null);
  };

  const otherCountries = allCountries.filter(c => c.code !== countryCode);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{flag}</span>
              <span>Objectifs {countryName}</span>
            </CardTitle>
            
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" onClick={() => setShowAutoSuggest(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Suggérer
              </Button>

              {hasChanges && (
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Copier depuis:</span>
              <Select
                value={copyFromCountryCode}
                onValueChange={setCopyFromCountryCode}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Pays..." />
                </SelectTrigger>
                <SelectContent>
                  {otherCountries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyFromCountry}
                disabled={!copyFromCountryCode}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Année précédente:</span>
              <Select
                value={copyFromYearValue?.toString() || ''}
                onValueChange={(v) => setCopyFromYearValue(parseInt(v, 10))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Année..." />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.filter(y => y < selectedYear).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyFromYear}
                disabled={!copyFromYearValue}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground">Mois</th>
                    {METRIC_TYPES.map(metric => (
                      <th key={metric.key} className="text-center p-2 font-medium text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <metric.icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{metric.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONTHS.map(month => (
                    <tr key={month.value} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{month.label}</td>
                      {METRIC_TYPES.map(metric => {
                        const key = getKey(month.value, metric.key);
                        const isEdited = editedValues[key] !== undefined;
                        
                        return (
                          <td key={metric.key} className="p-2">
                            <Input
                              type="number"
                              min="0"
                              value={getValue(month.value, metric.key)}
                              onChange={(e) => handleChange(month.value, metric.key, e.target.value)}
                              className={cn(
                                'text-center w-full max-w-[120px] mx-auto',
                                isEdited && 'border-primary bg-primary/5'
                              )}
                              placeholder="—"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AutoSuggestDialog
        open={showAutoSuggest}
        onOpenChange={setShowAutoSuggest}
        countryCode={countryCode}
        countryName={countryName}
        flag={flag}
        year={selectedYear}
        onSuccess={() => refresh()}
      />
    </>
  );
}
