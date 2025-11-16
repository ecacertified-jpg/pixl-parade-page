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
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-b">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Mes catégories personnalisées</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Organisez vos produits avec vos propres catégories
                </p>
              </div>
            </div>
            <Button onClick={() => setShowModal(true)} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle catégorie
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Aucune catégorie personnalisée</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Créez des catégories sur mesure pour mieux organiser vos produits
              </p>
              <Button onClick={() => setShowModal(true)} size="lg" className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Créer ma première catégorie
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: category.color + '15' }}
                  >
                    <Package 
                      className="h-6 w-6" 
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-base truncate">{category.name}</p>
                      <Badge 
                        variant="secondary"
                        className="shadow-sm"
                        style={{ 
                          backgroundColor: category.color + '10',
                          borderColor: category.color + '30',
                          color: category.color 
                        }}
                      >
                        Actif
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id, category.name)}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
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