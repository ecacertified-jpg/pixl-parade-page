import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Tag, Package, MoreVertical } from 'lucide-react';
import { useBusinessCategories } from '@/hooks/useBusinessCategories';
import { AddBusinessCategoryModal } from './AddBusinessCategoryModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function BusinessCategoriesSection() {
  const { categories, productCounts, loading, createCategory, updateCategory, deleteCategory } = useBusinessCategories();
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
            <TooltipProvider>
              <div className="grid gap-4">
                {categories.map((category) => {
                  const productCount = productCounts[category.id] || 0;
                  return (
                    <div
                      key={category.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {/* Icône colorée */}
                      <div className="flex-shrink-0">
                        <div
                          className="h-12 w-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <Package 
                            className="h-6 w-6" 
                            style={{ color: category.color }}
                          />
                        </div>
                      </div>
                      
                      {/* Contenu principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base mb-1">{category.name}</h4>
                            {category.description && (
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                                    {category.description}
                                  </p>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80">
                                  <p className="text-sm">{category.description}</p>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </div>
                          
                          {/* Menu actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(category)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(category.id, category.name)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Compteur de produits */}
                        <div className="flex items-center gap-2 mt-3">
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                          >
                            <Package className="h-3 w-3 mr-1" />
                            {productCount} produit{productCount !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
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