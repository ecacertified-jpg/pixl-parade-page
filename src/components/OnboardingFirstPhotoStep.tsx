import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { compressImage } from '@/utils/compressImage';
import { cn } from '@/lib/utils';

interface OnboardingFirstPhotoStepProps {
  /** Birthday page id (created beforehand by step "Type" or auto-created here as draft). */
  birthdayPageId: string | null;
  birthdayPageSlug: string | null;
  firstName?: string;
  /** Notify parent that a photo was uploaded successfully. */
  onPhotoUploaded: () => void;
  /** Existing count from parent — drives the "done" UI. */
  initialPhotoCount?: number;
  /** Called when this component lazily creates a draft birthday page. */
  onPageCreated?: (page: { id: string; slug: string }) => void;
}

/**
 * Onboarding step: encourage the user to upload a single first media to their
 * birthday album. Lazily creates the draft birthday page if none exists yet,
 * compresses the image client-side, uploads to the `birthday-page-photos`
 * bucket and inserts the row in `birthday_page_photos`.
 */
export const OnboardingFirstPhotoStep = ({
  birthdayPageId,
  birthdayPageSlug,
  firstName,
  onPhotoUploaded,
  initialPhotoCount = 0,
  onPageCreated,
}: OnboardingFirstPhotoStepProps) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(initialPhotoCount);

  useEffect(() => {
    setPhotoCount(initialPhotoCount);
  }, [initialPhotoCount]);

  // Best-effort: load existing first photo to show as preview when returning
  useEffect(() => {
    if (!birthdayPageId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('birthday_page_photos')
        .select('image_url, video_thumbnail_url, media_type')
        .eq('birthday_page_id', birthdayPageId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) {
        setPreviewUrl(data.video_thumbnail_url || data.image_url || null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [birthdayPageId]);

  /** Ensure a birthday page exists (draft) so we have a `birthday_page_id` to attach to. */
  const ensurePageId = async (): Promise<string | null> => {
    if (birthdayPageId) return birthdayPageId;
    if (!user) return null;
    const currentYear = new Date().getFullYear();
    const { data: existing } = await supabase
      .from('birthday_pages')
      .select('id, slug')
      .eq('user_id', user.id)
      .eq('celebration_year', currentYear)
      .maybeSingle();
    if (existing?.id) {
      onPageCreated?.({ id: existing.id, slug: existing.slug });
      return existing.id;
    }
    const slug = `${user.id.slice(0, 8)}-${currentYear}`;
    const { data: inserted, error } = await supabase
      .from('birthday_pages')
      .insert({
        user_id: user.id,
        slug,
        title: `Anniversaire de ${firstName || 'mon ami(e)'}`,
        celebration_year: currentYear,
        is_active: true,
      })
      .select('id, slug')
      .single();
    if (error || !inserted) {
      console.error('Draft page creation failed:', error);
      toast.error('Impossible de préparer ta page');
      return null;
    }
    onPageCreated?.({ id: inserted.id, slug: inserted.slug });
    return inserted.id;
  };

  const getProfileName = async (): Promise<string> => {
    if (!user) return firstName || 'Anonyme';
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();
    if (!data) return firstName || 'Anonyme';
    const composed = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
    return composed || firstName || 'Anonyme';
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const pageId = await ensurePageId();
      if (!pageId) return;

      // Compress before upload (matches BirthdayAlbum behaviour)
      let toUpload: File = file;
      try {
        const compressed = await compressImage(file, {
          quality: 0.82,
          maxWidth: 1600,
          maxHeight: 1600,
          format: 'jpeg',
        });
        toUpload = compressed.file;
      } catch {
        toUpload = file;
      }

      const ext = toUpload.name.includes('.') ? toUpload.name.split('.').pop() : 'jpg';
      const path = `${pageId}/${user.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('birthday-page-photos')
        .upload(path, toUpload, { contentType: toUpload.type || 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('birthday-page-photos')
        .getPublicUrl(path);

      const name = await getProfileName();

      const { error } = await supabase.from('birthday_page_photos').insert({
        birthday_page_id: pageId,
        uploader_id: user.id,
        uploader_name: name,
        image_url: urlData.publicUrl,
        media_type: 'image',
      });
      if (error) throw error;

      setPreviewUrl(urlData.publicUrl);
      setPhotoCount((c) => c + 1);
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#ec4899', '#f97316'],
      });
      toast.success('Première photo ajoutée 📸');
      onPhotoUploaded();
    } catch (err) {
      console.error('First photo upload error:', err);
      toast.error("Impossible d'uploader cette photo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const isDone = photoCount >= 1;

  return (
    <motion.div
      key="first-photo"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="text-center max-w-md mx-auto w-full"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mb-6 shadow-lg"
      >
        <Camera className="h-10 w-10 text-white" />
      </motion.div>

      <h2 className="text-2xl font-poppins font-bold text-foreground mb-2">
        Lance ton album souvenir 📸
      </h2>
      <p className="text-muted-foreground font-nunito mb-6 text-sm leading-relaxed">
        Une photo qui te ressemble — tes proches pourront en ajouter d'autres
        sur ta page. Ça donne envie d'écrire et d'offrir 💜
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={uploading}
      />

      {previewUrl ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mx-auto w-full max-w-xs aspect-square rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg mb-4"
        >
          <img
            src={previewUrl}
            alt="Première photo"
            className="w-full h-full object-cover"
          />
          {isDone && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow">
              <Check className="h-4 w-4" />
            </div>
          )}
        </motion.div>
      ) : (
        <motion.button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'mx-auto w-full max-w-xs aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 mb-4 transition-all',
            uploading
              ? 'border-primary/40 bg-primary/5 cursor-wait'
              : 'border-primary/40 bg-card hover:border-primary hover:bg-primary/5',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <span className="text-sm font-nunito text-muted-foreground">
                Envoi en cours…
              </span>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-poppins font-semibold text-foreground">
                Choisir une photo
              </span>
              <span className="text-xs font-nunito text-muted-foreground px-4">
                JPG, PNG, HEIC… on s'occupe de la compression ✨
              </span>
            </>
          )}
        </motion.button>
      )}

      <Button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        variant={isDone ? 'outline' : 'default'}
        className={cn(
          'gap-2 w-full max-w-xs mx-auto',
          !isDone && 'bg-gradient-to-r from-primary to-accent hover:opacity-90',
        )}
        size="lg"
      >
        <Upload className="h-4 w-4" />
        {isDone ? 'Changer la photo' : 'Ajouter une photo'}
      </Button>

      {birthdayPageSlug && isDone && (
        <p className="text-xs text-muted-foreground/80 font-nunito mt-3">
          Tu pourras en ajouter d'autres directement depuis ta page ✨
        </p>
      )}
    </motion.div>
  );
};
