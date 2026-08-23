import { useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { getExportCellValue, type ExportColumn } from '@/utils/exportUtils';

const SAMPLE_SIZE = 5;
const MOBILE_PREVIEW_FIELDS = 6;

interface Props<T extends Record<string, any>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  filtersLabel?: string;
  columns: ExportColumn<T>[];
  rows: T[];
  onConfirm: () => void;
}

/**
 * Aperçu des colonnes CSV avant export :
 * liste des colonnes avec taux de remplissage + échantillon des premières lignes.
 */
export function CsvExportPreviewDialog<T extends Record<string, any>>({
  open, onOpenChange, title, filtersLabel, columns, rows, onConfirm,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const sample = useMemo(() => rows.slice(0, SAMPLE_SIZE), [rows]);

  /** Nombre de valeurs réellement renseignées par colonne (sur l'échantillon analysé). */
  const stats = useMemo(() => {
    const scanned = rows.slice(0, 500);
    return columns.map((col) => {
      const values = scanned.map((r) => getExportCellValue(r, col));
      const filled = values.filter((v) => v !== '' && v !== 'Non disponible' && v !== 'Date inconnue').length;
      return {
        header: col.header,
        example: values.find((v) => v !== '') ?? '',
        filled,
        scanned: scanned.length,
      };
    });
  }, [columns, rows]);

  const filteredStats = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? stats.filter((s) => s.header.toLowerCase().includes(q)) : stats;
  }, [stats, query]);

  const emptyColumns = stats.filter((s) => s.filled === 0).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-3 overflow-hidden p-4 md:h-auto md:max-h-[90vh] md:w-[95vw] md:p-6">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle className="text-base md:text-lg">Aperçu avant export</DialogTitle>
          <DialogDescription className="break-words text-xs md:text-sm">{title}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {rows.length.toLocaleString('fr-FR')} lignes
            </Badge>
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {columns.length} colonnes
            </Badge>
            {emptyColumns > 0 && (
              <Badge variant="destructive" className="text-[10px] md:text-xs">
                {emptyColumns} colonne(s) vide(s)
              </Badge>
            )}
          </div>

          {filtersLabel && (
            <p className="w-full break-words rounded-md bg-muted/50 p-2 text-[11px] md:text-xs">
              <span className="font-medium">Filtres appliqués : </span>{filtersLabel}
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Colonnes du fichier</p>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une colonne"
                className="h-11 pl-8 md:h-10"
              />
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border p-2 md:max-h-64">
              {filteredStats.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Aucune colonne trouvée</p>
              )}
              {filteredStats.map((s, i) => (
                <div
                  key={s.header}
                  className="flex flex-col gap-1 rounded-md px-2 py-1.5 text-xs odd:bg-muted/30 md:flex-row md:flex-wrap md:items-start md:justify-between md:gap-2 md:py-1"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium">
                      <span className="mr-1 text-muted-foreground">{i + 1}.</span>{s.header}
                    </p>
                    {s.example && (
                      <p className="break-words text-muted-foreground">Exemple : {s.example}</p>
                    )}
                  </div>
                  <Badge
                    variant={s.filled === 0 ? 'destructive' : 'outline'}
                    className="w-fit shrink-0 text-[10px]"
                  >
                    {s.filled}/{s.scanned} renseignées
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">
              Échantillon ({sample.length} première(s) ligne(s))
            </p>

            {/* Mobile : cartes empilées */}
            <div className="space-y-2 md:hidden">
              {sample.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Aucune ligne à prévisualiser</p>
              )}
              {sample.map((row, idx) => {
                const isOpen = expandedRow === idx;
                const visible = isOpen ? columns : columns.slice(0, MOBILE_PREVIEW_FIELDS);
                return (
                  <div key={idx} className="rounded-lg border p-3">
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground">Ligne {idx + 1}</p>
                    <dl className="space-y-1.5">
                      {visible.map((c) => (
                        <div key={c.header} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2">
                          <dt className="break-words text-[11px] text-muted-foreground">{c.header}</dt>
                          <dd className="break-words text-[11px] font-medium">
                            {getExportCellValue(row, c) || '—'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {columns.length > MOBILE_PREVIEW_FIELDS && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 w-full text-[11px]"
                        onClick={() => setExpandedRow(isOpen ? null : idx)}
                      >
                        {isOpen ? (
                          <><ChevronDown className="mr-1 h-3.5 w-3.5" />Réduire</>
                        ) : (
                          <><ChevronRight className="mr-1 h-3.5 w-3.5" />Afficher toutes les colonnes ({columns.length})</>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop : tableau */}
            <div className="hidden max-h-64 overflow-auto rounded-lg border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c.header} className="whitespace-nowrap text-[11px]">{c.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sample.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((c) => (
                        <TableCell key={c.header} className="whitespace-nowrap text-[11px]">
                          {getExportCellValue(row, c) || '—'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="w-full sm:w-auto" onClick={onConfirm}>
            <Download className="mr-1 h-4 w-4" />
            Confirmer et télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
