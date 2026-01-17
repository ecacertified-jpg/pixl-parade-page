import { Settings2, Info, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CompressionSettings,
  CompressionQuality,
  CompressionMode,
  MaxResolution,
} from '@/hooks/useCompressionSettings';

interface VideoCompressionSettingsProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: Partial<CompressionSettings>) => void;
  onReset: () => void;
  disabled?: boolean;
}

const QUALITY_OPTIONS: { value: CompressionQuality; label: string; description: string }[] = [
  { value: 'low', label: 'Basse', description: 'Fichiers très petits, qualité réduite' },
  { value: 'medium', label: 'Moyenne', description: 'Bon équilibre taille/qualité' },
  { value: 'high', label: 'Haute', description: 'Qualité optimale, fichiers plus gros' },
];

const RESOLUTION_OPTIONS: { value: MaxResolution; label: string }[] = [
  { value: 480, label: '480p' },
  { value: 720, label: '720p' },
  { value: 1080, label: '1080p' },
];

const MODE_OPTIONS: { value: CompressionMode; label: string; description: string }[] = [
  { value: 'auto', label: 'Automatique', description: 'Compresse si >10MB ou non-MP4' },
  { value: 'always', label: 'Toujours', description: 'Compresse tous les fichiers' },
  { value: 'never', label: 'Jamais', description: 'Désactive la compression' },
];

export function VideoCompressionSettings({
  settings,
  onSettingsChange,
  onReset,
  disabled = false,
}: VideoCompressionSettingsProps) {
  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Paramètres de compression</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <h4 className="font-medium text-sm">Paramètres de compression</h4>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-7 text-xs gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Réinitialiser
            </Button>
          </div>

          {/* Quality */}
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label className="text-xs font-medium">Qualité</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="text-xs">
                      Affecte la qualité visuelle et la taille du fichier compressé.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RadioGroup
              value={settings.quality}
              onValueChange={(value) => onSettingsChange({ quality: value as CompressionQuality })}
              className="grid grid-cols-3 gap-2"
            >
              {QUALITY_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={`quality-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`quality-${option.value}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-xs font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-[10px] text-muted-foreground text-center">
              {QUALITY_OPTIONS.find(o => o.value === settings.quality)?.description}
            </p>
          </div>

          {/* Resolution */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Résolution maximale</Label>
            <RadioGroup
              value={settings.maxResolution.toString()}
              onValueChange={(value) => onSettingsChange({ maxResolution: parseInt(value) as MaxResolution })}
              className="grid grid-cols-3 gap-2"
            >
              {RESOLUTION_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`resolution-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`resolution-${option.value}`}
                    className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-xs font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Mode */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Mode de compression</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={(value) => onSettingsChange({ mode: value as CompressionMode })}
              className="space-y-1"
            >
              {MODE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`mode-${option.value}`} />
                  <Label
                    htmlFor={`mode-${option.value}`}
                    className="text-xs cursor-pointer flex-1"
                  >
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground ml-1">
                      ({option.description})
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Info */}
          <div className="pt-2 border-t">
            <p className="text-[10px] text-muted-foreground">
              💡 Les paramètres sont sauvegardés pour vos prochains uploads.
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
