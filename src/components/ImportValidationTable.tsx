import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImportError, ImportWarning } from '@/utils/importUtils';
import { ProductImportData } from '@/hooks/useProductImportExport';

interface ImportValidationTableProps {
  products: ProductImportData[];
  errors: ImportError[];
  warnings: ImportWarning[];
  showPreview?: boolean;
}

export function ImportValidationTable({ 
  products, 
  errors, 
  warnings,
  showPreview = true 
}: ImportValidationTableProps) {
  // Group errors by row
  const errorsByRow = errors.reduce((acc, error) => {
    if (!acc[error.row]) acc[error.row] = [];
    acc[error.row].push(error);
    return acc;
  }, {} as Record<number, ImportError[]>);

  // Group warnings by row
  const warningsByRow = warnings.reduce((acc, warning) => {
    if (!acc[warning.row]) acc[warning.row] = [];
    acc[warning.row].push(warning);
    return acc;
  }, {} as Record<number, ImportWarning[]>);

  const hasIssues = errors.length > 0 || warnings.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="gap-1">
          <CheckCircle className="h-3 w-3 text-green-500" />
          {products.length} valide(s)
        </Badge>
        {errors.length > 0 && (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {errors.length} erreur(s)
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <AlertTriangle className="h-3 w-3" />
            {warnings.length} avertissement(s)
          </Badge>
        )}
      </div>

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Erreurs à corriger
          </h4>
          <ScrollArea className="max-h-32">
            <ul className="text-sm space-y-1">
              {errors.slice(0, 20).map((error, idx) => (
                <li key={idx} className="text-destructive">
                  Ligne {error.row}, colonne "{error.column}": {error.message}
                  {error.value && <span className="text-muted-foreground"> (valeur: "{error.value}")</span>}
                </li>
              ))}
              {errors.length > 20 && (
                <li className="text-muted-foreground">... et {errors.length - 20} autres erreurs</li>
              )}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Warnings list */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/20 p-3">
          <h4 className="font-medium text-yellow-700 dark:text-yellow-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Avertissements (valeurs par défaut appliquées)
          </h4>
          <ScrollArea className="max-h-24">
            <ul className="text-sm space-y-1">
              {warnings.slice(0, 10).map((warning, idx) => (
                <li key={idx} className="text-yellow-700 dark:text-yellow-400">
                  Ligne {warning.row}, "{warning.column}": {warning.message}
                </li>
              ))}
              {warnings.length > 10 && (
                <li className="text-muted-foreground">... et {warnings.length - 10} autres avertissements</li>
              )}
            </ul>
          </ScrollArea>
        </div>
      )}

      {/* Preview table */}
      {showPreview && products.length > 0 && (
        <div className="rounded-lg border">
          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.slice(0, 50).map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {product.nom}
                    </TableCell>
                    <TableCell>{product.prix?.toLocaleString('fr-FR')} XOF</TableCell>
                    <TableCell>{product.stock ?? 0}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {product.categorie || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {product.type === 'experience' ? 'Expérience' : 'Produit'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {product.actif !== false ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {products.length > 50 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      ... et {products.length - 50} autres produits
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
