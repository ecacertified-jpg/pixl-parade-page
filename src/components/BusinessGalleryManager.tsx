import { useState, useRef, useCallback } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Video, 
  Upload, 
  Trash2, 
  GripVertical, 
  Pencil, 
  Plus, 
  Loader2,
  Play,
  X,
  Check,
  ImagePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { useBusinessGalleryManager, GalleryMediaItem } from '@/hooks/useBusinessGalleryManager';
import { cn } from '@/lib/utils';

interface BusinessGalleryManagerProps {
  businessId: string;
}

const MAX_GALLERY_ITEMS = 20;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

export function BusinessGalleryManager({ businessId }: BusinessGalleryManagerProps) {
  const {
    items,
    loading,
    uploading,
    uploadProgress,
    addMedia,
    removeItem,
    updateOrder,
    updateItemDetails,
  } = useBusinessGalleryManager(businessId);

  const [editingItem, setEditingItem] = useState<GalleryMediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = items.length < MAX_GALLERY_ITEMS;

  const handleFileSelect = useCallback(async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: 'image' | 'video'
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const acceptedTypes = mediaType === 'image' ? ACCEPTED_IMAGE_TYPES : ACCEPTED_VIDEO_TYPES;
      if (!acceptedTypes.includes(file.type)) {
        continue;
      }
      await addMedia(file, mediaType);
    }

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  }, [addMedia]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        await addMedia(file, 'image');
      } else if (ACCEPTED_VIDEO_TYPES.includes(file.type)) {
        await addMedia(file, 'video');
      }
    }
  }, [addMedia]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleReorder = useCallback((newItems: GalleryMediaItem[]) => {
    const orderedIds = newItems.map(item => item.id);
    updateOrder(orderedIds);
  }, [updateOrder]);

  const openEditDialog = (item: GalleryMediaItem) => {
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditDescription(item.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    await updateItemDetails(editingItem.id, {
      title: editTitle || undefined,
      description: editDescription || undefined,
    });
    setEditingItem(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    await removeItem(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Chargement de la galerie...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Galerie de la boutique
          </h2>
          <p className="text-sm text-muted-foreground">
            Ces médias apparaîtront sur votre page boutique
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {items.length}/{MAX_GALLERY_ITEMS} médias
        </Badge>
      </div>

      {/* Upload Zone */}
      {canAddMore && (
        <Card
          className={cn(
            "p-6 border-2 border-dashed transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            uploading && "pointer-events-none opacity-50"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => imageInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Upload en cours... {uploadProgress}%
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <ImagePlus className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">Glissez vos images ou vidéos ici</p>
                  <p className="text-sm text-muted-foreground">
                    ou cliquez pour parcourir vos fichiers
                  </p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      imageInputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Images
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      videoInputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <Video className="h-4 w-4" />
                    Vidéos
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Hidden inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept={ACCEPTED_VIDEO_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
          />
        </Card>
      )}

      {/* Gallery Grid */}
      {items.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Médias actuels</span>
            <span className="text-xs text-muted-foreground">(glissez pour réordonner)</span>
          </div>

          <Reorder.Group
            axis="x"
            values={items}
            onReorder={handleReorder}
            className="flex flex-wrap gap-3"
          >
            {items.map((item, index) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="relative group"
              >
                <motion.div
                  layout
                  className={cn(
                    "relative w-28 h-28 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing",
                    index === 0 ? "border-primary" : "border-border"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Media preview */}
                  {item.mediaType === 'image' ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title || `Image ${index + 1}`}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title || `Vidéo ${index + 1}`}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="h-8 w-8 text-white fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1">
                      <Badge className="text-[9px] px-1 py-0 bg-primary">
                        Principal
                      </Badge>
                    </div>
                  )}

                  {/* Media type badge */}
                  <div className="absolute bottom-1 left-1">
                    <Badge 
                      variant="secondary" 
                      className="text-[9px] px-1 py-0"
                    >
                      {item.mediaType === 'image' ? 'IMG' : 'VID'}
                    </Badge>
                  </div>

                  {/* Drag handle */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded p-0.5">
                    <GripVertical className="h-4 w-4 text-white" />
                  </div>

                  {/* Action overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(item);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <p className="text-xs text-muted-foreground mt-4">
            💡 La première image/vidéo sera affichée en principal sur votre page boutique
          </p>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aucun média dans la galerie</p>
              <p className="text-sm text-muted-foreground">
                Ajoutez des photos et vidéos pour mettre en valeur votre boutique
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les détails</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre (optionnel)</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Ex: Notre équipe au travail"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optionnelle)</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Une courte description de ce média..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} className="gap-2">
              <Check className="h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce média ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le média sera définitivement supprimé de votre galerie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
