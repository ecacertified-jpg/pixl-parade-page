import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getAppBaseUrl } from "@/utils/appUrl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  PartyPopper, Heart, Gift, Send, Share2, MessageCircle,
  Sparkles, Loader2, ArrowLeft, Camera as CameraIcon
} from "lucide-react";
import { BirthdayAlbumFlickr } from "@/components/birthday/album/BirthdayAlbumFlickr";
import { BirthdayPageShareButton } from "@/components/BirthdayPageShareButton";
import { WishlistFundPickerModal } from "@/components/WishlistFundPickerModal";
import { BirthdayCountdown } from "@/components/BirthdayCountdown";
import { CoverVideoCarousel } from "@/components/birthday/CoverVideoCarousel";
import { CoverVideosManagerSheet } from "@/components/birthday/CoverVideosManagerSheet";
import { useBirthdayPageSEO } from "@/hooks/useBirthdayPageSEO";
import { useSchemaInjector } from "@/components/schema";
import { buildBirthdayShareUrl } from "@/utils/buildBirthdayShareUrl";
import { MessageWall } from "@/components/birthday/messages/MessageWall";

interface BirthdayPageData {
  id: string;
  user_id: string;
  slug: string;
  celebration_year: number;
  title: string;
  cover_image_url: string | null;
  fund_id: string | null;
  is_active: boolean;
  social_share_photo_id: string | null;
  updated_at?: string | null;
}

interface WishMessage {
  id: string;
  sender_name: string | null;
  message_text: string;
  created_at: string;
  is_from_fund: boolean | null;
}

interface AlbumItem {
  id: string;
  uploader_id?: string | null;
  uploader_name: string | null;
  image_url: string;
  caption: string | null;
  created_at: string;
  media_type: string;
  video_url: string | null;
  video_thumbnail_url: string | null;
  memory_text: string | null;
  event_kind: string | null;
  view_count: number;
}

interface FundInfo {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  share_token: string | null;
}

const BirthdayPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromFeed = (location.state as any)?.fromFeed === true;

  const [page, setPage] = useState<BirthdayPageData | null>(null);
  const [messages, setMessages] = useState<WishMessage[]>([]);
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [fund, setFund] = useState<FundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showWishlistPicker, setShowWishlistPicker] = useState(false);
  const [showVideosManager, setShowVideosManager] = useState(false);

  const confettiTriggered = useRef(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Get profile info for the birthday person
  const [birthdayPerson, setBirthdayPerson] = useState<{ first_name: string; avatar_url: string | null; birthday: string | null }>({ first_name: '', avatar_url: null, birthday: null });

  // Compute age for SEO
  const age = useMemo(() => {
    if (!birthdayPerson.birthday || !page) return null;
    const bDate = new Date(birthdayPerson.birthday);
    return page.celebration_year - bDate.getFullYear();
  }, [birthdayPerson.birthday, page]);

  const firstName = useMemo(() => {
    if (birthdayPerson.first_name) return birthdayPerson.first_name;
    if (page?.title) {
      const match = page.title.match(/Anniversaire de (.+)/i);
      if (match && match[1] && match[1].toLowerCase() !== "mon ami(e)") return match[1];
    }
    return 'Ami(e)';
  }, [birthdayPerson.first_name, page?.title]);

  // SEO: meta tags, keywords, Open Graph
  useBirthdayPageSEO({
    firstName,
    age,
    slug: slug || '',
    coverImage: page?.cover_image_url || null,
    messagesCount: messages.length,
    photosCount: albumItems.filter(i => i.media_type === 'image').length,
    celebrationYear: page?.celebration_year || new Date().getFullYear(),
  });

  // SEO: JSON-LD Event schema
  const eventSchema = useMemo(() => {
    if (!page || !firstName) return null;
    const ageText = age ? ` - ${age} ans` : '';
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `Anniversaire de ${firstName}${ageText}`,
      description: `Page de célébration pour l'anniversaire de ${firstName}. Écrivez un message, partagez des souvenirs et participez au cadeau collectif.`,
      startDate: `${page.celebration_year}-01-01`,
      url: `https://joiedevivre-africa.com/birthday/${slug}`,
      image: page.cover_image_url || 'https://joiedevivre-africa.com/og-image.jpg',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      organizer: {
        '@type': 'Organization',
        name: 'JOIE DE VIVRE',
        url: 'https://joiedevivre-africa.com',
      },
      location: {
        '@type': 'VirtualLocation',
        url: `https://joiedevivre-africa.com/birthday/${slug}`,
      },
    };
  }, [page, firstName, age, slug]);

  useSchemaInjector('birthday-page', eventSchema);

  useEffect(() => {
    if (slug) loadPage();
  }, [slug]);

  // Confetti on load
  useEffect(() => {
    if (page && !confettiTriggered.current) {
      confettiTriggered.current = true;
      const colors = ['#7A5DC7', '#FAD4E1', '#C084FC', '#F7C948', '#FF4D6D'];
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors, zIndex: 9999 });
      }, 500);
      setTimeout(() => {
        confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 }, colors, zIndex: 9999 });
      }, 1200);
    }
  }, [page]);

  const loadPage = async () => {
    try {
      setLoading(true);

      const { data: pageData, error } = await supabase
        .from('birthday_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !pageData) {
        setNotFound(true);
        return;
      }

      let resolvedPage = pageData as BirthdayPageData;

      // Validate social_share_photo_id: if it points to a missing photo or one
      // without a usable image_url, auto-heal by setting it back to null so
      // the OG cascade falls back to the first album photo / cover / JDV image.
      if (resolvedPage.social_share_photo_id) {
        const { data: sharePhoto } = await supabase
          .from('birthday_page_photos')
          .select('id, image_url, media_type')
          .eq('id', resolvedPage.social_share_photo_id)
          .maybeSingle();
        const isValid =
          !!sharePhoto &&
          (sharePhoto.media_type === 'image' || !sharePhoto.media_type) &&
          !!sharePhoto.image_url;
        if (!isValid) {
          await supabase
            .from('birthday_pages')
            .update({ social_share_photo_id: null })
            .eq('id', resolvedPage.id);
          resolvedPage = { ...resolvedPage, social_share_photo_id: null };
          // Best-effort cache purge so crawlers refetch the corrected OG image
          supabase.functions
            .invoke('purge-birthday-og-cache', { body: { slug: resolvedPage.slug } })
            .catch(() => {});
        }
      }

      setPage(resolvedPage);

      // Load profile via public_profiles view so visitors (not signed in)
      // can also see the celebrant's name and photo on the shared page.
      const { data: pubProfile } = await supabase
        .from('public_profiles')
        .select('first_name, last_name, avatar_url')
        .eq('user_id', pageData.user_id)
        .maybeSingle();

      // Birthday is only readable on the private profiles table (auth required);
      // it's used for age display, so a null fallback for visitors is fine.
      const { data: privProfile } = await supabase
        .from('profiles')
        .select('birthday')
        .eq('user_id', pageData.user_id)
        .maybeSingle();

      if (pubProfile || privProfile) {
        setBirthdayPerson({
          first_name: (pubProfile as any)?.first_name || '',
          last_name: (pubProfile as any)?.last_name || '',
          avatar_url: (pubProfile as any)?.avatar_url || null,
          birthday: (privProfile as any)?.birthday || null,
        } as any);
      }

      // Load messages
      const { data: msgs } = await supabase
        .from('birthday_wishes_messages')
        .select('id, sender_name, message_text, created_at, is_from_fund')
        .eq('birthday_page_id', pageData.id)
        .order('created_at', { ascending: false });

      if (msgs) setMessages(msgs);

      // Load album items
      const { data: pics } = await supabase
        .from('birthday_page_photos')
        .select('id, uploader_id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text, event_kind, view_count')
        .eq('birthday_page_id', pageData.id)
        .order('created_at', { ascending: false });

      if (pics) setAlbumItems(pics as AlbumItem[]);

      // Load fund
      if (pageData.fund_id) {
        const { data: fundData } = await supabase
          .from('collective_funds')
          .select('id, title, target_amount, current_amount, share_token')
          .eq('id', pageData.fund_id)
          .single();

        if (fundData) setFund(fundData as FundInfo);
      } else {
        // Fallback: chercher une cagnotte birthday active pour cet utilisateur
        const { data: existingFunds } = await supabase
          .from('collective_funds')
          .select('id, title, target_amount, current_amount, share_token')
          .eq('creator_id', pageData.user_id)
          .eq('occasion', 'birthday')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingFunds && existingFunds.length > 0) {
          setFund(existingFunds[0] as FundInfo);
        }
      }
    } catch (err) {
      console.error('Error loading birthday page:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    return _handleSendMessage();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !page || user.id !== page.user_id) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Format non supporté. Utilise JPG, PNG ou WebP.");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/cover-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const newUrl = urlData.publicUrl;
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("user_id", user.id);
      if (profErr) throw profErr;
      setBirthdayPerson((prev) => ({ ...prev, avatar_url: newUrl }));
      supabase.functions
        .invoke("purge-birthday-og-cache", { body: { slug: page.slug } })
        .catch(() => {});
      toast.success("Photo de profil mise à jour ✨");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ? `Impossible de mettre à jour la photo: ${err.message}` : "Impossible de mettre à jour la photo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const _handleSendMessage = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/birthday/${slug}`)}&invited=true`);
      return;
    }
    if (!newMessage.trim() || !page) return;

    setSendingMessage(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Un ami' : 'Un ami';

      const { error } = await supabase
        .from('birthday_wishes_messages')
        .insert({
          birthday_user_id: page.user_id,
          birthday_page_id: page.id,
          sender_id: user.id,
          sender_name: senderName,
          message_text: newMessage.trim(),
          celebration_year: page.celebration_year,
        });

      if (error) throw error;

      const newMsg: WishMessage = {
        id: crypto.randomUUID(),
        sender_name: senderName,
        message_text: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_from_fund: false,
      };
      setMessages(prev => [newMsg, ...prev]);
      setNewMessage("");
      toast.success("Message envoyé ! 💖");
    } catch (err) {
      toast.error("Erreur lors de l'envoi du message");
    } finally {
      setSendingMessage(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <PartyPopper className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold font-poppins mb-2">Page introuvable</h1>
        <p className="text-muted-foreground mb-6">Cette page d'anniversaire n'existe pas ou n'est plus active.</p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }

  const pageUrl = buildBirthdayShareUrl(slug || "", {
    updatedAt: page?.updated_at,
    socialSharePhotoId: page?.social_share_photo_id,
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {fromFeed && (
        <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/30 px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="gap-1 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Retour au fil
          </Button>
        </div>
      )}
      {/* Header festif */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <CoverVideoCarousel
          birthdayPageId={page?.id ?? null}
          birthday={birthdayPerson.birthday}
          fallbackImageUrl={page?.cover_image_url ?? null}
          className="h-[58vh] min-h-[360px] md:h-[64vh] md:min-h-[460px]"
          overlay={
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 md:p-6">
              <div className="flex items-end gap-3">
                <div className="relative">
                  <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-white shadow-soft ring-2 ring-white/20">
                    {birthdayPerson.avatar_url ? (
                      <img
                        src={birthdayPerson.avatar_url}
                        alt={firstName}
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary font-poppins font-bold text-lg">
                        {firstName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  {user?.id === page?.user_id && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground border-2 border-white shadow-soft flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60"
                        aria-label="Modifier la photo de profil"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CameraIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl md:text-3xl font-bold font-poppins text-white drop-shadow-lg truncate"
                  >
                    {firstName}
                    {age ? ` · ${age} ans` : ""}
                  </motion.h1>
                  {birthdayPerson.birthday && (
                    <div className="mt-1">
                      <BirthdayCountdown
                        birthday={birthdayPerson.birthday}
                        celebrationYear={page?.celebration_year}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
        >
          {user?.id === page?.user_id && (
            <button
              type="button"
              onClick={() => setShowVideosManager(true)}
              className="absolute top-6 left-3 z-20 h-9 rounded-full bg-black/45 backdrop-blur text-white px-3 text-xs font-medium flex items-center gap-1.5 hover:bg-black/65 transition-colors shadow-card"
              aria-label="Personnaliser les vidéos de couverture"
            >
              <span aria-hidden>🎬</span>
              <span className="hidden sm:inline">Vidéos</span>
            </button>
          )}
        </CoverVideoCarousel>
      </motion.div>

      {page && user?.id === page.user_id && (
        <CoverVideosManagerSheet
          open={showVideosManager}
          onOpenChange={setShowVideosManager}
          birthdayPageId={page.id}
        />
      )}

      <div className="max-w-lg mx-auto px-4 pb-24 space-y-6 mt-6">
        {/* Cagnotte section — toujours visible */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5 text-primary" />
              <h2 className="font-bold font-poppins">Cadeau collectif</h2>
            </div>

            {fund ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">{fund.title}</p>
                <div className="mb-2">
                  <Progress
                    value={fund.target_amount > 0 ? (fund.current_amount / fund.target_amount) * 100 : 0}
                    className="h-3"
                    indicatorClassName="bg-gradient-to-r from-primary to-accent"
                  />
                </div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="font-semibold text-primary">
                    {fund.current_amount.toLocaleString('fr-FR')} XOF
                  </span>
                  <span className="text-muted-foreground">
                    / {fund.target_amount.toLocaleString('fr-FR')} XOF
                  </span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    // Public birthday funds allow guest contributions on /f/:id
                    navigate(`/f/${fund.id}`);
                  }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Participer au cadeau
                </Button>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="text-4xl">🎁</div>
                <p className="text-sm text-muted-foreground font-nunito">
                  Réunissez-vous entre amis pour offrir un cadeau mémorable à <span className="font-semibold text-foreground">{firstName}</span> !
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!user) {
                      navigate(`/auth?redirect=/birthday/${slug}&invited=true`);
                      return;
                    }
                    setShowWishlistPicker(true);
                  }}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  Créer une cagnotte pour {firstName}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Messages section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <MessageWall
            pageId={page!.id}
            slug={slug!}
            firstName={firstName}
            pageOwnerUserId={page!.user_id}
          />
        </motion.div>

        {/* Album souvenir */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <BirthdayAlbumFlickr
            pageId={page!.id}
            slug={slug!}
            firstName={firstName}
            user={user}
            items={albumItems}
            onItemAdded={(item) => setAlbumItems(prev => [item, ...prev])}
            pageOwnerUserId={page!.user_id}
            socialSharePhotoId={page!.social_share_photo_id}
            onSocialSharePhotoChanged={(photoId) =>
              setPage(prev => (prev ? { ...prev, social_share_photo_id: photoId } : prev))
            }
            onItemRemoved={(id) => setAlbumItems(prev => prev.filter(i => i.id !== id))}
            onItemUpdated={(updated) =>
              setAlbumItems(prev => prev.map(i => (i.id === updated.id ? { ...i, ...updated } : i)))
            }
          />
        </motion.div>
      </div>

      {/* Floating share button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90"
          onClick={() => setShowShareMenu(true)}
        >
          <Share2 className="h-6 w-6" />
        </Button>
      </div>

      <BirthdayPageShareButton
        open={showShareMenu}
        onOpenChange={setShowShareMenu}
        firstName={firstName}
        pageUrl={pageUrl}
        age={age}
      />

      {page && (
        <WishlistFundPickerModal
          isOpen={showWishlistPicker}
          onClose={() => setShowWishlistPicker(false)}
          onFundCreated={() => loadPage()}
          beneficiaryUserId={page.user_id}
          beneficiaryFirstName={firstName}
          beneficiaryAvatarUrl={birthdayPerson.avatar_url || undefined}
        />
      )}
    </div>
  );
};

export default BirthdayPage;
