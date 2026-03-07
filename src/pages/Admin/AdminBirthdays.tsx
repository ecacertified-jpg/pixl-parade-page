import { useState } from 'react';
import { Cake, CalendarDays, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminBirthdays, type BirthdayEntry } from '@/hooks/useAdminBirthdays';
import { AdminLayout } from '@/components/AdminLayout';
import { BirthdayDetailSheet } from '@/components/admin/BirthdayDetailSheet';

const PERIODS = [
  { label: "Jour J", days: 0 },
  { label: "3 jours", days: 3 },
  { label: "7 jours", days: 7 },
  { label: "10 jours", days: 10 },
  { label: "15 jours", days: 15 },
  { label: "20 jours", days: 20 },
  { label: "25 jours", days: 25 },
  { label: "30 jours", days: 30 },
];

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getUrgencyVariant(daysUntil: number): 'destructive' | 'default' | 'secondary' | 'outline' {
  if (daysUntil === 0) return 'destructive';
  if (daysUntil <= 3) return 'default';
  if (daysUntil <= 7) return 'secondary';
  return 'outline';
}

function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Aujourd'hui";
  if (daysUntil === 1) return 'Demain';
  return `${daysUntil}j`;
}

function formatBirthday(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

export default function AdminBirthdays() {
  const {
    entries, loading, viewMode, setViewMode,
    selectedDays, setSelectedDays,
    selectedMonth, setSelectedMonth,
    todayCount, weekCount, monthCount,
  } = useAdminBirthdays();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins flex items-center gap-2">
            <Cake className="h-6 w-6 text-primary" />
            Anniversaires
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble des anniversaires à venir
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aujourd'hui</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{loading ? <Skeleton className="h-8 w-12" /> : todayCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cette semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{loading ? <Skeleton className="h-8 w-12" /> : weekCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{loading ? <Skeleton className="h-8 w-12" /> : monthCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Period buttons */}
            <div>
              <p className="text-sm font-medium mb-2">Par période</p>
              <div className="flex flex-wrap gap-2">
                {PERIODS.map((p) => (
                  <Button
                    key={p.days}
                    size="sm"
                    variant={viewMode === 'period' && selectedDays === p.days ? 'default' : 'outline'}
                    onClick={() => {
                      setViewMode('period');
                      setSelectedDays(p.days);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Month selector */}
            <div>
              <p className="text-sm font-medium mb-2">Par mois</p>
              <Select
                value={viewMode === 'month' ? String(selectedMonth) : ''}
                onValueChange={(val) => {
                  setViewMode('month');
                  setSelectedMonth(Number(val));
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sélectionner un mois" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Résultats ({entries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                Aucun anniversaire trouvé pour cette période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={`${entry.type}-${entry.id}`}>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{formatBirthday(entry.birthday)}</TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyVariant(entry.daysUntil)}>
                          {getUrgencyLabel(entry.daysUntil)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.type === 'user' ? (
                            <><Users className="h-3 w-3 mr-1" /> Utilisateur</>
                          ) : (
                            <><Gift className="h-3 w-3 mr-1" /> Contact</>
                          )}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
