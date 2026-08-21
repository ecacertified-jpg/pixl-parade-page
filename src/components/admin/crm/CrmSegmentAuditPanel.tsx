import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportButton } from '@/components/admin/ExportButton';
import { CRM_AUDIT_COLUMNS } from './crmAuditColumns';
import { exportToCSV } from '@/utils/exportUtils';
import { toast } from 'sonner';
import { CheckCircle2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import type { SegmentAuditReport } from '@/hooks/useJdvCrm';

const PAGE_SIZE = 25;

interface Props {
  report?: SegmentAuditReport;
}

export function CrmSegmentAuditPanel({ report }: Props) {
  const [onlyAnomalies, setOnlyAnomalies] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!report) return [];
    return onlyAnomalies ? report.anomaly_rows : report.rows;
  }, [report, onlyAnomalies]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);

  const handleExport = () => {
    if (!rows.length) {
      toast.error('Aucune ligne à exporter');
      return;
    }
    exportToCSV(rows, CRM_AUDIT_COLUMNS, onlyAnomalies ? 'jdv_crm_audit_anomalies' : 'jdv_crm_audit_segments');
    toast.success(`${rows.length} ligne(s) exportée(s)`);
  };

  const conforme = report ? report.a_corriger === 0 : false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">
            Audit de segmentation S1 → S8
            {report && (
              <Badge className="ml-2" variant={conforme ? 'secondary' : 'destructive'}>
                {conforme ? 'CONFORME' : 'INCOHÉRENCES'}
              </Badge>
            )}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit en lecture seule — aucune donnée modifiée, aucune correction automatique.
            {report && ` Généré le ${new Date(report.generated_at).toLocaleString('fr-FR')}.`}
          </p>
        </div>
        {report && <ExportButton onExportCSV={handleExport} />}
      </CardHeader>

      <CardContent className="space-y-4">
        {!report && <Skeleton className="h-32 w-full" />}

        {report && (
          <>
            <div
              className={`flex items-start gap-2 rounded-lg border p-3 text-sm font-medium ${
                conforme ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'
              }`}
            >
              {conforme
                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
              <span>{report.conclusion}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Utilisateurs audités', value: report.total },
                { label: 'Sans anomalie', value: report.conformes },
                { label: 'Anomalies signalées', value: report.anomalies },
                { label: 'Cas à corriger', value: report.a_corriger },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className="mt-1 text-xl font-semibold">{k.value.toLocaleString('fr-FR')}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Répartition des anomalies par segment</p>
                {Object.keys(report.by_segment).length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune anomalie</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.by_segment).sort().map(([seg, n]) => (
                    <Badge key={seg} variant="outline">{seg} · {n}</Badge>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Répartition par type d’anomalie</p>
                {Object.keys(report.by_type).length === 0 && (
                  <p className="text-sm text-muted-foreground">Aucune anomalie</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.by_type).map(([t, n]) => (
                    <Badge key={t} variant="outline">{t} · {n}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={onlyAnomalies ? 'default' : 'outline'}
                onClick={() => { setOnlyAnomalies(true); setPage(1); }}
              >
                Anomalies uniquement ({report.anomalies.toLocaleString('fr-FR')})
              </Button>
              <Button
                size="sm"
                variant={onlyAnomalies ? 'outline' : 'default'}
                onClick={() => { setOnlyAnomalies(false); setPage(1); }}
              >
                Tous les utilisateurs ({report.total.toLocaleString('fr-FR')})
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>CRM ID</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Segment actuel</TableHead>
                    <TableHead>Conditions détectées</TableHead>
                    <TableHead>Segment attendu</TableHead>
                    <TableHead>Écart</TableHead>
                    <TableHead>Action recommandée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                        Aucun cas à afficher
                      </TableCell>
                    </TableRow>
                  )}
                  {pageRows.map((r) => (
                    <>
                      <TableRow
                        key={r.user_id}
                        className="cursor-pointer"
                        onClick={() => setExpanded(expanded === r.user_id ? null : r.user_id)}
                      >
                        <TableCell>
                          {expanded === r.user_id
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{r.crm_id ?? 'Non disponible'}</TableCell>
                        <TableCell className="text-sm">{r.nom}</TableCell>
                        <TableCell><Badge variant="outline">{r.segment_actuel}</Badge></TableCell>
                        <TableCell className="text-xs">{r.conditions_label}</TableCell>
                        <TableCell><Badge variant="outline">{r.segment_attendu}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={r.ecart ? 'destructive' : 'secondary'}>{r.ecart ? 'Oui' : 'Non'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[260px] text-xs text-muted-foreground">{r.action_recommandee}</TableCell>
                      </TableRow>
                      {expanded === r.user_id && (
                        <TableRow key={`${r.user_id}-detail`}>
                          <TableCell colSpan={8} className="bg-muted/40">
                            <p className="mb-1 text-xs font-medium">Règles déclenchées</p>
                            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                              {r.regles_declenchees.length === 0 && <li>Aucune règle satisfaite</li>}
                              {r.regles_declenchees.map((rule) => <li key={rule}>{rule}</li>)}
                            </ul>
                            <p className="mt-2 text-xs">
                              Type d’anomalie : <span className="font-medium">{r.type_anomalie}</span>
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Page {Math.min(page, totalPages)} / {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Précédent
                  </Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
