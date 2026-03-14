import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Trash2, Copy, Loader2, FileImage, FileVideo, File, Pencil, Check, X, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type FileFilter = 'all' | 'images' | 'videos' | 'others';

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: Record<string, any> | null;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (mimetype: string) => mimetype?.startsWith('image/');

const getPublicUrl = (fileName: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`;

export function AssetUploader() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [renamingInProgress, setRenamingInProgress] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [fileFilter, setFileFilter] = useState<FileFilter>('all');

  const counts = useMemo(() => {
    const imgs = files.filter(f => f.metadata?.mimetype?.startsWith('image/')).length;
    const vids = files.filter(f => f.metadata?.mimetype?.startsWith('video/')).length;
    return { all: files.length, images: imgs, videos: vids, others: files.length - imgs - vids };
  }, [files]);

  const filteredFiles = useMemo(() => {
    if (fileFilter === 'all') return files;
    return files.filter(f => {
      const mt = f.metadata?.mimetype || '';
      if (fileFilter === 'images') return mt.startsWith('image/');
      if (fileFilter === 'videos') return mt.startsWith('video/');
      return !mt.startsWith('image/') && !mt.startsWith('video/');
    });
  }, [files, fileFilter]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('assets').list('', {
      sortBy: { column: 'created_at', order: 'desc' },
    });
    if (error) {
      console.error('Error listing assets:', error);
      toast.error('Erreur lors du chargement des fichiers');
    } else {
      setFiles((data as StorageFile[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = useCallback(async (file: globalThis.File) => {
    setUploading(true);
    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const { error } = await supabase.storage.from('assets').upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (error) {
      console.error('Upload error:', error);
      toast.error(`Erreur : ${error.message}`);
    } else {
      toast.success(`"${fileName}" uploadé avec succès`);
      setSelectedFile(null);
      fetchFiles();
    }
    setUploading(false);
  }, [fetchFiles]);

  const handleDelete = async (fileName: string) => {
    const { error } = await supabase.storage.from('assets').remove([fileName]);
    if (error) {
      toast.error(`Erreur suppression : ${error.message}`);
    } else {
      toast.success(`"${fileName}" supprimé`);
      fetchFiles();
    }
  };

  const startRename = (fileName: string) => {
    const lastDot = fileName.lastIndexOf('.');
    setRenamingFile(fileName);
    setNewName(lastDot > 0 ? fileName.substring(0, lastDot) : fileName);
  };

  const cancelRename = () => {
    setRenamingFile(null);
    setNewName('');
  };

  const handleRename = async () => {
    if (!renamingFile || !newName.trim()) return;
    const lastDot = renamingFile.lastIndexOf('.');
    const ext = lastDot > 0 ? renamingFile.substring(lastDot) : '';
    const sanitized = newName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalName = sanitized + ext;

    if (finalName === renamingFile) {
      toast.info('Le nom est identique, aucun changement');
      cancelRename();
      return;
    }

    setRenamingInProgress(true);
    const { error } = await supabase.storage.from('assets').move(renamingFile, finalName);
    setRenamingInProgress(false);

    if (error) {
      toast.error(`Erreur renommage : ${error.message}`);
      return;
    }

    toast.success(`Renommé en "${finalName}"`);
    cancelRename();
    fetchFiles();
  };

  const copyUrl = (fileName: string) => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiée !');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📁 Assets / Médias</CardTitle>
        <CardDescription>
          Uploadez et gérez les fichiers statiques (images WhatsApp, logos, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*,.pdf';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleUpload(file);
            };
            input.click();
          }}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Upload en cours...' : 'Glissez un fichier ici ou cliquez pour sélectionner'}
          </p>
        </div>

        {/* File list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Fichiers existants</h4>
          {!loading && files.length > 0 && (
            <Tabs value={fileFilter} onValueChange={(v) => setFileFilter(v as FileFilter)} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">Tous ({counts.all})</TabsTrigger>
                <TabsTrigger value="images" className="flex-1">Images ({counts.images})</TabsTrigger>
                <TabsTrigger value="videos" className="flex-1">Vidéos ({counts.videos})</TabsTrigger>
                <TabsTrigger value="others" className="flex-1">Autres ({counts.others})</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {files.length === 0 ? 'Aucun fichier' : 'Aucun fichier dans cette catégorie'}
            </p>
          ) : (
            <div className="divide-y divide-border rounded-md border">
              {filteredFiles.map((file) => {
                const mimetype = file.metadata?.mimetype || '';
                const fileIsImage = isImage(mimetype);
                const fileIcon = fileIsImage
                  ? <FileImage className="h-4 w-4 text-primary" />
                  : mimetype?.startsWith('video/')
                    ? <FileVideo className="h-4 w-4 text-accent" />
                    : <File className="h-4 w-4 text-muted-foreground" />;

                return (
                  <div key={file.id}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      {fileIsImage ? (
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <button
                              type="button"
                              className="shrink-0 cursor-pointer"
                              onClick={() => setPreviewFile(prev => prev === file.name ? null : file.name)}
                              title="Prévisualiser"
                            >
                              {fileIcon}
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent side="right" className="w-auto p-1">
                            <img
                              src={getPublicUrl(file.name)}
                              alt={file.name}
                              className="max-w-[200px] max-h-[200px] rounded object-contain"
                            />
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span className="shrink-0">{fileIcon}</span>
                      )}
                      {renamingFile === file.name ? (
                        <form
                          className="flex items-center gap-2 flex-1 min-w-0"
                          onSubmit={(e) => { e.preventDefault(); handleRename(); }}
                        >
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && cancelRename()}
                            className="h-7 text-sm flex-1"
                            autoFocus
                          />
                          <span className="text-xs text-muted-foreground shrink-0">
                            {file.name.lastIndexOf('.') > 0 ? file.name.substring(file.name.lastIndexOf('.')) : ''}
                          </span>
                          <Button type="submit" variant="ghost" size="icon" className="h-7 w-7" title="Valider" disabled={renamingInProgress}>
                            {renamingInProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-success" />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={cancelRename} title="Annuler">
                            <X className="h-4 w-4" />
                          </Button>
                        </form>
                      ) : (
                        <span className="text-sm truncate flex-1">{file.name}</span>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {file.metadata?.size ? formatFileSize(file.metadata.size) : '—'}
                      </span>
                      {renamingFile !== file.name && (
                        <>
                          {fileIsImage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewFile(prev => prev === file.name ? null : file.name)}
                              title={previewFile === file.name ? 'Masquer' : 'Prévisualiser'}
                            >
                              {previewFile === file.name ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => startRename(file.name)} title="Renommer">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => copyUrl(file.name)} title="Copier l'URL">
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} title="Supprimer">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                    {previewFile === file.name && fileIsImage && (
                      <div className="px-3 pb-3 flex justify-center">
                        <img
                          src={getPublicUrl(file.name)}
                          alt={file.name}
                          className="max-h-48 rounded-md object-contain border border-border cursor-pointer"
                          onClick={() => setPreviewFile(null)}
                          title="Cliquer pour fermer"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
