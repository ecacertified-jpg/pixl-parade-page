/**
 * Utility functions for importing data from CSV files
 * Supports CSV parsing with French locale (semicolon separator)
 */

export interface ImportError {
  row: number;
  column: string;
  message: string;
  value: any;
}

export interface ImportWarning {
  row: number;
  column: string;
  message: string;
  value: any;
  defaultValue: any;
}

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
  totalRows: number;
}

export interface ColumnDefinition<T> {
  key: keyof T;
  csvHeader: string;
  required?: boolean;
  validate?: (value: string, row: number) => { valid: boolean; error?: string };
  transform?: (value: string) => any;
  defaultValue?: any;
}

/**
 * Detect CSV separator (comma or semicolon)
 */
export function detectSeparator(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

/**
 * Parse a CSV line handling quoted values
 */
export function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Parse CSV content into array of objects
 */
export function parseCSV<T extends Record<string, any>>(
  content: string,
  columns: ColumnDefinition<T>[]
): ImportResult<T> {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  const separator = detectSeparator(content);
  
  if (lines.length === 0) {
    return { success: [], errors: [{ row: 0, column: '', message: 'Fichier vide', value: null }], warnings: [], totalRows: 0 };
  }
  
  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine, separator).map(h => h.toLowerCase().trim());
  
  // Map headers to columns
  const columnMap = new Map<number, ColumnDefinition<T>>();
  const missingRequired: string[] = [];
  
  columns.forEach(col => {
    const headerIndex = headers.findIndex(h => 
      h === col.csvHeader.toLowerCase() || 
      h === (col.key as string).toLowerCase()
    );
    if (headerIndex !== -1) {
      columnMap.set(headerIndex, col);
    } else if (col.required) {
      missingRequired.push(col.csvHeader);
    }
  });
  
  if (missingRequired.length > 0) {
    return {
      success: [],
      errors: [{ row: 0, column: 'headers', message: `Colonnes obligatoires manquantes: ${missingRequired.join(', ')}`, value: headers }],
      warnings: [],
      totalRows: 0
    };
  }
  
  const success: T[] = [];
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line, separator);
    const rowNumber = i + 1; // 1-indexed for user display
    
    const row: Partial<T> = {};
    let hasError = false;
    
    // Process each column
    columnMap.forEach((col, index) => {
      const rawValue = values[index] || '';
      const value = rawValue.trim();
      
      // Check required
      if (col.required && !value) {
        errors.push({
          row: rowNumber,
          column: col.csvHeader,
          message: `Valeur obligatoire manquante`,
          value: rawValue
        });
        hasError = true;
        return;
      }
      
      // Validate
      if (col.validate && value) {
        const validation = col.validate(value, rowNumber);
        if (!validation.valid) {
          errors.push({
            row: rowNumber,
            column: col.csvHeader,
            message: validation.error || 'Valeur invalide',
            value: rawValue
          });
          hasError = true;
          return;
        }
      }
      
      // Transform or use default
      if (value) {
        row[col.key] = col.transform ? col.transform(value) : value;
      } else if (col.defaultValue !== undefined) {
        row[col.key] = col.defaultValue;
        if (col.required === false && !value) {
          // Add warning for empty optional field with default
          warnings.push({
            row: rowNumber,
            column: col.csvHeader,
            message: `Valeur par défaut utilisée`,
            value: rawValue,
            defaultValue: col.defaultValue
          });
        }
      }
    });
    
    if (!hasError) {
      success.push(row as T);
    }
  }
  
  return {
    success,
    errors,
    warnings,
    totalRows: lines.length - 1
  };
}

/**
 * Read file as text with encoding detection
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    // Try UTF-8 first (most common)
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Validate file type and size
 */
export function validateFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  const validExtensions = ['.csv', '.txt'];
  
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  
  if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
    return { valid: false, error: 'Format de fichier non supporté. Utilisez un fichier CSV.' };
  }
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Le fichier est trop volumineux (max ${maxSizeMB} Mo)` };
  }
  
  return { valid: true };
}

/**
 * Parse French number (with spaces or commas as thousands separator)
 */
export function parseFrenchNumber(value: string): number | null {
  // Remove spaces and replace comma with dot for decimals
  const cleaned = value.replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse boolean value from French text
 */
export function parseFrenchBoolean(value: string): boolean {
  const normalized = value.toLowerCase().trim();
  return ['oui', 'yes', 'true', '1', 'actif', 'active', 'o'].includes(normalized);
}
