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
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert data array to CSV string with proper encoding
 */
export function arrayToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  // Header row
  const headers = columns.map(col => escapeCSVValue(col.header));
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const key = col.key as string;
      let value = key.includes('.') 
        ? key.split('.').reduce((obj, k) => obj?.[k], row as any)
        : row[key];
      
      if (col.format) {
        value = col.format(value, row);
      } else if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'number') {
        value = formatNumberFr(value);
      } else {
        value = String(value);
      }
      
      return escapeCSVValue(value);
    });
  });
  
  // Combine with semicolon separator (better for French Excel)
  return [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
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

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filenameBase: string
): void {
  const csv = arrayToCSV(data, columns);
  const filename = generateFilename(filenameBase);
  downloadCSV(csv, filename);
}
