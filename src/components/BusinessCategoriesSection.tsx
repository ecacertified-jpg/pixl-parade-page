import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Package } from 'lucide-react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { AddBusinessCategoryModal } from './AddBusinessCategoryModal';

export function BusinessCategoriesSection() {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useBusinessCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Supprimer la catégorie "${name}" ?\n\nLes produits associés ne seront pas supprimés.`)) {
      await deleteCategory(id);
    }
  };

  const handleSave = async (categoryData: any) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, categoryData);
      setEditingCategory(null);
    } else {
      await createCategory(categoryData);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Mes catégories personnalisées
          </CardTitle>
          <Button onClick={() => setShowModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                Aucune catégorie personnalisée
              </p>
              <Button onClick={() => setShowModal(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première catégorie
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <Package 
                        className="h-5 w-5" 
                        style={{ color: category.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: category.color,
                        color: category.color 
                      }}
                    >
                      Actif
                    </Badge>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBusinessCategoryModal
        open={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        category={editingCategory}
      />
    </>
  );
}