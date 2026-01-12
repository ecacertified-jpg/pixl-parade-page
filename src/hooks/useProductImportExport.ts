import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  parseCSV, 
  readFileAsText, 
  validateFile, 
  parseFrenchNumber, 
  parseFrenchBoolean,
  ImportResult,
  ColumnDefinition
} from '@/utils/importUtils';
import { 
  exportToCSV, 
  ExportColumn, 
  formatCurrencyXOF,
  generateFilename,
  downloadCSV,
  arrayToCSV
} from '@/utils/exportUtils';

export interface ProductImportData {
  nom: string;
  description?: string;
  prix: number;
  stock?: number;
  categorie?: string;
  type?: 'produit' | 'experience';
  image_url?: string;
  actif?: boolean;
}

export interface ProductExportData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number | null;
  category_name?: string;
  is_experience: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ImportProgress {
  step: 'idle' | 'reading' | 'validating' | 'previewing' | 'importing' | 'done';
  current: number;
  total: number;
  message?: string;
}

const productColumns: ColumnDefinition<ProductImportData>[] = [
  {
    key: 'nom',
    csvHeader: 'nom',
    required: true,
    validate: (value) => {
      if (value.length > 200) {
        return { valid: false, error: 'Le nom ne doit pas dépasser 200 caractères' };
      }
      return { valid: true };
    }
  },
  {
    key: 'description',
    csvHeader: 'description',
    required: false,
    defaultValue: ''
  },
  {
    key: 'prix',
    csvHeader: 'prix',
    required: true,
    validate: (value) => {
      const num = parseFrenchNumber(value);
      if (num === null || num < 0) {
        return { valid: false, error: 'Le prix doit être un nombre positif' };
      }
      return { valid: true };
    },
    transform: (value) => parseFrenchNumber(value) || 0
  },
  {
    key: 'stock',
    csvHeader: 'stock',
    required: false,
    defaultValue: 0,
    validate: (value) => {
      if (!value) return { valid: true };
      const num = parseFrenchNumber(value);
      if (num === null || num < 0 || !Number.isInteger(num)) {
        return { valid: false, error: 'Le stock doit être un nombre entier positif' };
      }
      return { valid: true };
    },
    transform: (value) => Math.floor(parseFrenchNumber(value) || 0)
  },
  {
    key: 'categorie',
    csvHeader: 'categorie',
    required: false,
    defaultValue: ''
  },
  {
    key: 'type',
    csvHeader: 'type',
    required: false,
    defaultValue: 'produit',
    validate: (value) => {
      const normalized = value.toLowerCase().trim();
      if (normalized && !['produit', 'experience', 'expérience', 'product'].includes(normalized)) {
        return { valid: false, error: 'Le type doit être "produit" ou "experience"' };
      }
      return { valid: true };
    },
    transform: (value) => {
      const normalized = value.toLowerCase().trim();
      return ['experience', 'expérience'].includes(normalized) ? 'experience' : 'produit';
    }
  },
  {
    key: 'image_url',
    csvHeader: 'image_url',
    required: false,
    defaultValue: '',
    validate: (value) => {
      if (!value) return { valid: true };
      try {
        new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: 'URL invalide' };
      }
    }
  },
  {
    key: 'actif',
    csvHeader: 'actif',
    required: false,
    defaultValue: true,
    transform: (value) => parseFrenchBoolean(value)
  }
];

const exportColumns: ExportColumn<ProductExportData>[] = [
  { key: 'name', header: 'nom' },
  { key: 'description', header: 'description', format: (v) => v || '' },
  { key: 'price', header: 'prix' },
  { key: 'stock_quantity', header: 'stock', format: (v) => String(v ?? 0) },
  { key: 'category_name', header: 'categorie', format: (v) => v || '' },
  { key: 'is_experience', header: 'type', format: (v) => v ? 'experience' : 'produit' },
  { key: 'image_url', header: 'image_url', format: (v) => v || '' },
  { key: 'is_active', header: 'actif', format: (v) => v ? 'oui' : 'non' }
];

export function useProductImportExport(businessAccountId?: string) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({ step: 'idle', current: 0, total: 0 });
  const [validationResult, setValidationResult] = useState<ImportResult<ProductImportData> | null>(null);

  const resetState = useCallback(() => {
    setLoading(false);
    setProgress({ step: 'idle', current: 0, total: 0 });
    setValidationResult(null);
  }, []);

  /**
   * Download a CSV template for importing products
   */
  const downloadTemplate = useCallback(() => {
    const templateContent = [
      'nom;description;prix;stock;categorie;type;image_url;actif',
      '"Exemple Produit";"Description du produit";15000;10;"Ma Catégorie";"produit";"";"oui"',
      '"Massage Relaxant";"Séance de 60 minutes";35000;;"Bien-être";"experience";"";"oui"'
    ].join('\r\n');
    
    downloadCSV(templateContent, 'modele_import_produits.csv');
    toast.success('Modèle téléchargé');
  }, []);

  /**
   * Validate a CSV file without importing
   */
  const validateImport = useCallback(async (file: File): Promise<ImportResult<ProductImportData> | null> => {
    setLoading(true);
    setProgress({ step: 'reading', current: 0, total: 1, message: 'Lecture du fichier...' });

    try {
      // Validate file
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        toast.error(fileValidation.error);
        return null;
      }

      // Read file content
      const content = await readFileAsText(file);
      
      setProgress({ step: 'validating', current: 0, total: 1, message: 'Validation des données...' });

      // Parse and validate
      const result = parseCSV<ProductImportData>(content, productColumns);
      
      // Check max products limit
      if (result.success.length > 500) {
        toast.error('Maximum 500 produits par import');
        return null;
      }

      setValidationResult(result);
      setProgress({ step: 'previewing', current: result.success.length, total: result.totalRows });
      
      return result;
    } catch (error) {
      console.error('Error validating import:', error);
      toast.error('Erreur lors de la validation du fichier');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Import validated products into the database
   */
  const confirmImport = useCallback(async (products: ProductImportData[]): Promise<{ success: number; failed: number }> => {
    if (!user?.id || !businessAccountId) {
      toast.error('Veuillez sélectionner un business');
      return { success: 0, failed: products.length };
    }

    setLoading(true);
    setProgress({ step: 'importing', current: 0, total: products.length, message: 'Import en cours...' });

    let successCount = 0;
    let failedCount = 0;

    try {
      // Fetch existing categories for mapping
      const { data: existingCategories } = await supabase
        .from('business_categories')
        .select('id, name')
        .eq('business_owner_id', user.id)
        .eq('is_active', true);

      const categoryMap = new Map(
        (existingCategories || []).map(c => [c.name.toLowerCase(), c.id])
      );

      // Create products in batches of 50
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const productsToInsert = batch.map(product => ({
          name: product.nom,
          description: product.description || null,
          price: product.prix,
          stock_quantity: product.stock || 0,
          business_owner_id: user.id,
          business_id: businessAccountId,
          business_account_id: businessAccountId,
          is_experience: product.type === 'experience',
          image_url: product.image_url || null,
          is_active: product.actif ?? true,
          business_category_id: product.categorie 
            ? categoryMap.get(product.categorie.toLowerCase()) || null 
            : null
        }));

        const { data, error } = await supabase
          .from('products')
          .insert(productsToInsert)
          .select('id');

        if (error) {
          console.error('Error inserting batch:', error);
          failedCount += batch.length;
        } else {
          successCount += data?.length || 0;
        }

        setProgress({ 
          step: 'importing', 
          current: Math.min(i + batchSize, products.length), 
          total: products.length,
          message: `Import en cours... (${Math.min(i + batchSize, products.length)}/${products.length})`
        });
      }

      setProgress({ step: 'done', current: successCount, total: products.length });

      if (successCount > 0) {
        toast.success(`${successCount} produit(s) importé(s) avec succès`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} produit(s) n'ont pas pu être importés`);
      }

      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error('Error importing products:', error);
      toast.error('Erreur lors de l\'import');
      return { success: successCount, failed: products.length - successCount };
    } finally {
      setLoading(false);
    }
  }, [user?.id, businessAccountId]);

  /**
   * Export products to CSV
   */
  const exportProducts = useCallback(async (
    products?: ProductExportData[], 
    filename?: string
  ) => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    setLoading(true);

    try {
      let productsToExport = products;

      // If no products provided, fetch from database
      if (!productsToExport) {
        let query = supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            price,
            stock_quantity,
            is_experience,
            image_url,
            is_active,
            created_at,
            business_category:business_categories(name)
          `)
          .eq('business_owner_id', user.id);

        if (businessAccountId) {
          query = query.eq('business_account_id', businessAccountId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
          toast.error('Erreur lors de la récupération des produits');
          return;
        }

        productsToExport = (data || []).map(p => ({
          ...p,
          category_name: (p.business_category as any)?.name || ''
        }));
      }

      if (productsToExport.length === 0) {
        toast.info('Aucun produit à exporter');
        return;
      }

      const csv = arrayToCSV(productsToExport, exportColumns);
      const finalFilename = filename || generateFilename('export_produits');
      downloadCSV(csv, finalFilename);
      
      toast.success(`${productsToExport.length} produit(s) exporté(s)`);
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  }, [user?.id, businessAccountId]);

  return {
    loading,
    progress,
    validationResult,
    validateImport,
    confirmImport,
    exportProducts,
    downloadTemplate,
    resetState
  };
}
