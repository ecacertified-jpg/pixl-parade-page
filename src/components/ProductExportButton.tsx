import { useState } from 'react';
import { Download, Loader2, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProductImportExport, ProductExportData } from '@/hooks/useProductImportExport';

interface ProductExportButtonProps {
  businessAccountId?: string;
  businessName?: string;
  products?: ProductExportData[];
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showDropdown?: boolean;
}

export function ProductExportButton({
  businessAccountId,
  businessName,
  products,
  variant = 'outline',
  size = 'default',
  showDropdown = true
}: ProductExportButtonProps) {
  const { loading, exportProducts, downloadTemplate } = useProductImportExport(businessAccountId);

  const handleExportAll = async () => {
    const filename = businessName 
      ? `produits_${businessName.replace(/\s+/g, '_').toLowerCase()}` 
      : 'produits';
    await exportProducts(products, filename);
  };

  const handleExportActive = async () => {
    const activeProducts = products?.filter(p => p.is_active);
    const filename = businessName 
      ? `produits_actifs_${businessName.replace(/\s+/g, '_').toLowerCase()}` 
      : 'produits_actifs';
    await exportProducts(activeProducts, filename);
  };

  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleExportAll}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Exporter
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={loading} className="gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exporter
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportAll}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter tous les produits
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportActive}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter les produits actifs
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger le modèle vide
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
