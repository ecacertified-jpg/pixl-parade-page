import { useState, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle, Loader2, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProductImportExport, ProductImportData } from '@/hooks/useProductImportExport';
import { ImportValidationTable } from '@/components/ImportValidationTable';
import { ImportResult } from '@/utils/importUtils';

interface ProductImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessAccountId?: string;
  onImportComplete?: () => void;
}

type Step = 'upload' | 'validation' | 'preview' | 'importing' | 'result';

export function ProductImportModal({ 
  open, 
  onOpenChange, 
  businessAccountId,
  onImportComplete 
}: ProductImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportResult<ProductImportData> | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const { 
    loading, 
    progress, 
    validateImport, 
    confirmImport, 
    downloadTemplate,
    resetState 
  } = useProductImportExport(businessAccountId);

  const handleClose = useCallback(() => {
    setStep('upload');
    setSelectedFile(null);
    setValidationResult(null);
    setImportResult(null);
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleValidate = useCallback(async () => {
    if (!selectedFile) return;
    
    setStep('validation');
    const result = await validateImport(selectedFile);
    
    if (result) {
      setValidationResult(result);
      if (result.errors.length === 0 && result.success.length > 0) {
        setStep('preview');
      } else if (result.errors.length > 0) {
        setStep('validation');
      } else {
        setStep('upload');
      }
    } else {
      setStep('upload');
    }
  }, [selectedFile, validateImport]);

  const handleConfirmImport = useCallback(async () => {
    if (!validationResult?.success.length) return;
    
    setStep('importing');
    const result = await confirmImport(validationResult.success);
    setImportResult(result);
    setStep('result');
    
    if (result.success > 0) {
      onImportComplete?.();
    }
  }, [validationResult, confirmImport, onImportComplete]);

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${selectedFile ? 'bg-primary/5 border-primary' : ''}
        `}
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <FileText className="h-12 w-12 mx-auto text-primary" />
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} Ko
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Retirer
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="font-medium">Déposez votre fichier CSV ici</p>
            <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner</p>
          </div>
        )}
      </div>

      {/* Download template */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" />
          Télécharger le modèle CSV
        </Button>
      </div>

      {/* CSV format info */}
      <div className="rounded-lg bg-muted/50 p-4 text-sm">
        <h4 className="font-medium mb-2">Format du fichier CSV :</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li><strong>nom</strong> (obligatoire) : Nom du produit</li>
          <li><strong>description</strong> : Description détaillée</li>
          <li><strong>prix</strong> (obligatoire) : Prix en XOF</li>
          <li><strong>stock</strong> : Quantité en stock (défaut: 0)</li>
          <li><strong>categorie</strong> : Catégorie du produit</li>
          <li><strong>type</strong> : "produit" ou "experience"</li>
          <li><strong>image_url</strong> : URL de l'image</li>
          <li><strong>actif</strong> : "oui" ou "non" (défaut: oui)</li>
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Séparateur: point-virgule (;) - Encodage: UTF-8
        </p>
      </div>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">{progress.message || 'Validation en cours...'}</p>
        </div>
      ) : validationResult ? (
        <ImportValidationTable
          products={validationResult.success}
          errors={validationResult.errors}
          warnings={validationResult.warnings}
          showPreview={false}
        />
      ) : null}
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {validationResult && (
        <ImportValidationTable
          products={validationResult.success}
          errors={validationResult.errors}
          warnings={validationResult.warnings}
          showPreview={true}
        />
      )}
    </div>
  );

  const renderImportingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <p className="font-medium">Import en cours...</p>
        <p className="text-sm text-muted-foreground">
          {progress.current} / {progress.total} produits
        </p>
      </div>
      <Progress value={(progress.current / progress.total) * 100} className="w-64" />
    </div>
  );

  const renderResultStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      {importResult?.success ? (
        <>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <div className="text-center">
            <p className="text-xl font-semibold text-green-600">Import terminé !</p>
            <p className="text-muted-foreground mt-2">
              {importResult.success} produit(s) importé(s) avec succès
            </p>
            {importResult.failed > 0 && (
              <p className="text-destructive">
                {importResult.failed} produit(s) n'ont pas pu être importés
              </p>
            )}
          </div>
        </>
      ) : (
        <>
          <AlertCircle className="h-16 w-16 text-destructive" />
          <div className="text-center">
            <p className="text-xl font-semibold text-destructive">Échec de l'import</p>
            <p className="text-muted-foreground mt-2">
              Aucun produit n'a pu être importé
            </p>
          </div>
        </>
      )}
    </div>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'upload': return 'Importer des produits en masse';
      case 'validation': return 'Validation du fichier';
      case 'preview': return 'Aperçu des produits';
      case 'importing': return 'Import en cours';
      case 'result': return 'Résultat de l\'import';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'upload': return !!selectedFile;
      case 'validation': return validationResult && validationResult.errors.length === 0 && validationResult.success.length > 0;
      case 'preview': return validationResult && validationResult.success.length > 0;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Téléchargez un fichier CSV pour ajouter plusieurs produits à la fois.'}
            {step === 'validation' && 'Vérification des données de votre fichier.'}
            {step === 'preview' && 'Vérifiez les produits avant de confirmer l\'import.'}
            {step === 'importing' && 'Ne fermez pas cette fenêtre.'}
            {step === 'result' && 'Votre import est terminé.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {step !== 'result' && step !== 'importing' && (
          <div className="flex items-center justify-center gap-2 py-2">
            {['upload', 'validation', 'preview'].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s ? 'bg-primary text-primary-foreground' : 
                    ['upload', 'validation', 'preview'].indexOf(step) > index 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'}
                `}>
                  {index + 1}
                </div>
                {index < 2 && (
                  <div className={`w-8 h-0.5 ${
                    ['upload', 'validation', 'preview'].indexOf(step) > index 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="py-4">
          {step === 'upload' && renderUploadStep()}
          {step === 'validation' && renderValidationStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'importing' && renderImportingStep()}
          {step === 'result' && renderResultStep()}
        </div>

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button onClick={handleValidate} disabled={!canProceed() || loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Valider le fichier
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'validation' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={() => setStep('preview')} 
                disabled={!canProceed()}
              >
                Voir l'aperçu
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('validation')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={!canProceed() || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Importer {validationResult?.success.length} produit(s)
              </Button>
            </>
          )}

          {step === 'result' && (
            <Button onClick={handleClose}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
