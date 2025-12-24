import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { FileText, Loader2, Download, BarChart3, TrendingUp, Trophy, Tag } from 'lucide-react';
import type { ReportConfig } from '@/hooks/useBusinessReportPDF';

interface ExportReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: ReportConfig) => Promise<void>;
  generating: boolean;
  progress: number;
}

export function ExportReportModal({
  open,
  onOpenChange,
  onGenerate,
  generating,
  progress,
}: ExportReportModalProps) {
  const [config, setConfig] = useState<ReportConfig>({
    includeKPIs: true,
    includeRevenueByType: true,
    includeMonthlyTrends: true,
    includeTopPerformers: true,
    includeProductCategories: true,
    orientation: 'portrait',
  });

  const handleGenerate = async () => {
    await onGenerate(config);
    if (!generating) {
      onOpenChange(false);
    }
  };

  const toggleOption = (key: keyof ReportConfig) => {
    if (key === 'orientation') return;
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    { key: 'includeKPIs' as const, label: 'Indicateurs clés (KPIs)', icon: BarChart3 },
    { key: 'includeRevenueByType' as const, label: 'Revenus par type', icon: FileText },
    { key: 'includeMonthlyTrends' as const, label: 'Tendances mensuelles', icon: TrendingUp },
    { key: 'includeTopPerformers' as const, label: 'Top performers', icon: Trophy },
    { key: 'includeProductCategories' as const, label: 'Catégories produits', icon: Tag },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Exporter le Rapport PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Content Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Contenu du rapport</Label>
            <div className="space-y-2">
              {sections.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center space-x-3">
                  <Checkbox
                    id={key}
                    checked={config[key] as boolean}
                    onCheckedChange={() => toggleOption(key)}
                    disabled={generating}
                  />
                  <Label 
                    htmlFor={key} 
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Orientation Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Format du document</Label>
            <RadioGroup
              value={config.orientation}
              onValueChange={(value) => setConfig(prev => ({ 
                ...prev, 
                orientation: value as 'portrait' | 'landscape' 
              }))}
              disabled={generating}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="text-sm cursor-pointer">
                  📄 Portrait (A4)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="text-sm cursor-pointer">
                  📃 Paysage (A4)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Progress indicator */}
          {generating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Génération en cours...</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || !Object.values(config).some(v => v === true)}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
