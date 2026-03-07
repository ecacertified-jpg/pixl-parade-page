import { useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Trash2, Copy, Loader2, FileImage, FileVideo, File } from 'lucide-react';

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

const getFileIcon = (mimetype: string) => {
  if (mimetype?.startsWith('image/')) return <FileImage className="h-4 w-4 text-primary" />;
  if (mimetype?.startsWith('video/')) return <FileVideo className="h-4 w-4 text-accent" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
};

export function AssetUploader() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const copyUrl = (fileName: string) => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiée !');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }, []);

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
              if (file) setSelectedFile(file);
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Glissez un fichier ici ou cliquez pour sélectionner
          </p>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
            <span className="text-sm font-medium truncate flex-1">{selectedFile.name}</span>
            <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
            <Button size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Uploader'}
            </Button>
          </div>
        )}

        {/* File list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Fichiers existants</h4>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucun fichier</p>
          ) : (
            <div className="divide-y divide-border rounded-md border">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-3 px-3 py-2">
                  {getFileIcon(file.metadata?.mimetype || '')}
                  <span className="text-sm truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {file.metadata?.size ? formatFileSize(file.metadata.size) : '—'}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => copyUrl(file.name)} title="Copier l'URL">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} title="Supprimer">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
