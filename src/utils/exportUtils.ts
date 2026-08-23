/**
 * Utility functions for exporting data to CSV/Excel format
 * Uses UTF-8 with BOM for proper French character support in Excel
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: any, row: T) => string;
}

/**
 * Format a number with French locale (space as thousands separator)
 */
export function formatNumberFr(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value);
}

/**
 * Format a date in French format (dd/mm/yyyy)
 */
export function formatDateFr(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
}

/**
 * Format currency in XOF
 */
export function formatCurrencyXOF(value: number): string {
  return `${formatNumberFr(value)} XOF`;
}

/**
 * Escape CSV value : protège le séparateur `;`, les virgules, guillemets et sauts de ligne.
 * Neutralise aussi les valeurs commençant par = + - @ (injection de formule Excel).
 */
function escapeCSVValue(value: string): string {
  let v = value;
  if (/^[=+\-@]/.test(v)) v = `'${v}`;
  if (/[;,"\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}


/**
 * Métadonnées de contexte écrites en tête du fichier CSV
 */
export interface ExportMeta {
  title: string;
  filters?: string;
  extra?: Record<string, string | number>;
}

/**
 * Valeur finale d'une cellule (identique à celle écrite dans le CSV),
 * réutilisée par l'aperçu avant export.
 */
export function getExportCellValue<T extends Record<string, any>>(
  row: T,
  col: ExportColumn<T>
): string {
  const key = col.key as string;
  let value = key.includes('.')
    ? key.split('.').reduce((obj, k) => obj?.[k], row as any)
    : (row as any)[key];

  if (col.format) {
    value = col.format(value, row);
  } else if (value === null || value === undefined) {
    value = '';
  } else {
    // Nombre brut : reste exploitable (tri / calculs) dans Excel
    value = String(value);
  }

  return String(value);
}

/**
 * Paquet d'export : source de vérité unique partagée par l'aperçu et le téléchargement.
 */
export interface ExportPayload {
  /** Lignes de contexte en tête du fichier, sous forme de paires [libellé, valeur]. */
  metaLines: string[][];
  /** Libellés de colonnes (non échappés, tels qu'affichés dans Excel). */
  headers: string[];
  /** Valeurs de cellules (non échappées, telles qu'affichées dans Excel). */
  rows: string[][];
  /** Contenu CSV final, exactement ce qui sera téléchargé. */
  csv: string;
  /** Nom du fichier téléchargé. */
  filename: string;
  /** Nombre total de lignes du fichier (contexte + en-tête + données). */
  totalFileLines: number;
}

function buildMetaLines<T>(dataLength: number, columnsLength: number, meta?: ExportMeta): string[][] {
  if (!meta) return [];
  const lines: string[][] = [
    [meta.title],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    ['Lignes exportées', String(dataLength)],
    ['Colonnes exportées', String(columnsLength)],
  ];
  if (meta.filters) lines.push(['Filtres appliqués', meta.filters]);
  for (const [k, v] of Object.entries(meta.extra ?? {})) lines.push([k, String(v)]);
  return lines;
}

/**
 * Construit en une seule fois le contenu CSV, ses valeurs brutes et son nom de fichier.
 */
export function buildExportPayload<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filenameBase: string,
  meta?: ExportMeta
): ExportPayload {
  const headers = columns.map((col) => col.header);
  const rows = data.map((row) => columns.map((col) => getExportCellValue(row, col)));
  const metaLines = buildMetaLines(data.length, columns.length, meta);

  const lines: string[] = [];
  for (const parts of metaLines) {
    lines.push(parts.map(escapeCSVValue).join(';'));
  }
  if (metaLines.length) lines.push('');
  lines.push(headers.map(escapeCSVValue).join(';'));
  for (const row of rows) lines.push(row.map(escapeCSVValue).join(';'));

  return {
    metaLines,
    headers,
    rows,
    csv: lines.join('\r\n'),
    filename: generateFilename(filenameBase),
    totalFileLines: lines.length,
  };
}

/**
 * Convert data array to CSV string with proper encoding
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  meta?: ExportMeta
): string {
  return buildExportPayload(data, columns, 'export', meta).csv;
}

/**
 * Download CSV file with UTF-8 BOM for Excel compatibility
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add UTF-8 BOM for Excel to properly detect encoding
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateFilename(baseName: string, extension: string = 'csv'): string {
  const date = new Date().toISOString().split('T')[0];
  return `${baseName}_${date}.${extension}`;
}

/** Télécharge exactement le contenu prévisualisé. */
export function downloadExportPayload(payload: ExportPayload): void {
  downloadCSV(payload.csv, payload.filename);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filenameBase: string,
  meta?: ExportMeta
): void {
  downloadExportPayload(buildExportPayload(data, columns, filenameBase, meta));
}


