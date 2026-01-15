import { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountryForecastPanel } from '@/components/admin/CountryForecastPanel';
import { Sparkles } from 'lucide-react';

const COUNTRIES = [
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' }
];

const YEARS = [2024, 2025, 2026, 2027];

export default function ForecastPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].code);

  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Prévisions automatiques
            </h1>
            <p className="text-muted-foreground mt-1">
              Suggestions d'objectifs basées sur les tendances historiques
            </p>
          </div>

          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country tabs */}
        <Tabs value={selectedCountry} onValueChange={setSelectedCountry}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {COUNTRIES.map(country => (
              <TabsTrigger
                key={country.code}
                value={country.code}
                className="flex items-center gap-1"
              >
                <span>{country.flag}</span>
                <span className="hidden sm:inline">{country.code}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {COUNTRIES.map(country => (
            <TabsContent key={country.code} value={country.code}>
              <CountryForecastPanel
                countryCode={country.code}
                countryName={country.name}
                flag={country.flag}
                year={selectedYear}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
