import { useMemo, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search } from 'lucide-react';
import { getExportCellValue, type ExportColumn } from '@/utils/exportUtils';

const SAMPLE_SIZE = 5;

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
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base md:text-lg">Aperçu avant export</DialogTitle>
          <DialogDescription className="text-xs md:text-sm">{title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">{rows.length.toLocaleString('fr-FR')} lignes</Badge>
          <Badge variant="secondary">{columns.length} colonnes</Badge>
          {emptyColumns > 0 && (
            <Badge variant="destructive">{emptyColumns} colonne(s) vide(s) sur l’échantillon</Badge>
          )}
        </div>

        {filtersLabel && (
          <p className="rounded-md bg-muted/50 p-2 text-xs">
            <span className="font-medium">Filtres appliqués : </span>{filtersLabel}
          </p>
        )}

        <div>
          <p className="mb-2 text-sm font-medium">Colonnes du fichier</p>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une colonne"
              className="pl-8"
            />
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
            {filteredStats.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Aucune colonne trouvée</p>
            )}
            {filteredStats.map((s, i) => (
              <div key={s.header} className="flex flex-wrap items-start justify-between gap-2 rounded-md px-2 py-1 text-xs odd:bg-muted/30">
                <div className="min-w-0">
                  <p className="break-words font-medium">
                    <span className="mr-1 text-muted-foreground">{i + 1}.</span>{s.header}
                  </p>
                  {s.example && (
                    <p className="break-words text-muted-foreground">Exemple : {s.example}</p>
                  )}
                </div>
                <Badge variant={s.filled === 0 ? 'destructive' : 'outline'} className="shrink-0 text-[10px]">
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
          <div className="max-h-64 overflow-auto rounded-lg border">
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

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onConfirm}>
            <Download className="mr-1 h-4 w-4" />
            Confirmer et télécharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
