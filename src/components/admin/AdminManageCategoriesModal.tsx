import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tag, Plus, Pencil, Trash2, Package, Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAdminBusinessCategories, BusinessCategory } from '@/hooks/useAdminBusinessCategories';
import { AdminAddCategoryModal } from './AdminAddCategoryModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminManageCategoriesModalProps {
  businessId: string | null;
  businessOwnerId: string | null;
  businessName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminManageCategoriesModal({
  businessId,
  businessOwnerId,
  businessName,
  open,
  onOpenChange
}: AdminManageCategoriesModalProps) {
  const {
    categories,
    productCounts,
    loading,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useAdminBusinessCategories();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BusinessCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<BusinessCategory | null>(null);

  useEffect(() => {
    if (open && businessOwnerId) {
      loadCategories(businessOwnerId);
    }
  }, [open, businessOwnerId, loadCategories]);

  const handleCreateCategory = async (categoryData: any) => {
    if (!businessOwnerId) return;
    await createCategory(businessOwnerId, categoryData, businessName);
    await loadCategories(businessOwnerId);
  };

  const handleUpdateCategory = async (categoryData: any) => {
    if (!editingCategory) return;
    await updateCategory(editingCategory.id, categoryData, editingCategory.name);
    if (businessOwnerId) {
      await loadCategories(businessOwnerId);
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory || !businessOwnerId) return;
    await deleteCategory(deletingCategory.id, deletingCategory.name);
    await loadCategories(businessOwnerId);
    setDeletingCategory(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Catégories de {businessName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add button */}
            <div className="flex justify-end">
              <Button onClick={() => setAddModalOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une catégorie
              </Button>
            </div>

            {/* Categories list */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune catégorie personnalisée</p>
                <p className="text-sm">Créez des catégories pour organiser les produits</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Color indicator */}
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color || '#3b82f6' }}
                        >
                          <Package className="h-5 w-5 text-white" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {productCounts[category.id] || 0} produit{(productCounts[category.id] || 0) !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeletingCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Category Modal */}
      <AdminAddCategoryModal
        open={addModalOpen || !!editingCategory}
        onClose={() => {
          setAddModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
        category={editingCategory}
        businessName={businessName}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Supprimer la catégorie
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{deletingCategory?.name}" ?
              {(productCounts[deletingCategory?.id || ''] || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  Attention : {productCounts[deletingCategory?.id || '']} produit(s) sont associés à cette catégorie.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
