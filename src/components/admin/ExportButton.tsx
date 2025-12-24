import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonProps {
  onExportCSV: () => void;
  disabled?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportButton({ onExportCSV, disabled, size = 'sm' }: ExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} disabled={disabled}>
          <Download className="h-4 w-4 mr-1" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exporter en CSV (Excel)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
