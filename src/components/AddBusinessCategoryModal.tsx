import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, Tag, Palette, Save } from 'lucide-react';
import { BusinessCategory } from '@/hooks/useBusinessCategories';

interface AddBusinessCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: Omit<BusinessCategory, 'id' | 'business_owner_id' | 'created_at' | 'updated_at'>) => Promise<any>;
  category?: BusinessCategory;
}

const PREDEFINED_COLORS = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Jaune', value: '#eab308' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Cyan', value: '#06b6d4' }
];

const PREDEFINED_ICONS = [
  'Package', 'Tag', 'ShoppingBag', 'Shirt', 'Watch', 'Sparkles',
  'Gift', 'Heart', 'Star', 'Crown', 'Coffee', 'Book'
];

export function AddBusinessCategoryModal({ open, onClose, onSave, category }: AddBusinessCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || '#3b82f6',
    icon: category?.icon || 'Package',
    is_active: category?.is_active ?? true
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setSaving(true);
    await onSave(formData);
    setSaving(false);
    onClose();
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: 'Package',
      is_active: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            {category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la catégorie *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Vêtements, Électronique..."
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle de la catégorie"
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleur
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {PREDEFINED_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    formData.color === color.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Icône
            </Label>
            <div className="grid grid-cols-6 gap-2">
              {PREDEFINED_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`h-10 rounded-lg border-2 transition-all flex items-center justify-center ${
                    formData.icon === icon
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  title={icon}
                >
                  <Package className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={!formData.name.trim() || saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}