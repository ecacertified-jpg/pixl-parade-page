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
  Sparkles, Loader2, ArrowLeft
} from "lucide-react";
import { BirthdayAlbum } from "@/components/BirthdayAlbum";
import { BirthdayPageShareButton } from "@/components/BirthdayPageShareButton";
import { WishlistFundPickerModal } from "@/components/WishlistFundPickerModal";
import { BirthdayCountdown } from "@/components/BirthdayCountdown";
import { useBirthdayPageSEO } from "@/hooks/useBirthdayPageSEO";
import { useSchemaInjector } from "@/components/schema";

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

  const confettiTriggered = useRef(false);

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

      setPage(pageData as BirthdayPageData);

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, avatar_url, birthday')
        .eq('user_id', pageData.user_id)
        .single();

      if (profile) setBirthdayPerson(profile as any);

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
        .select('id, uploader_id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text')
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

  const pageUrl = `${getAppBaseUrl()}/birthday/${slug}`;

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
        {page?.cover_image_url ? (
          <div className="h-48 md:h-64 w-full">
            <img src={page.cover_image_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-background" />
          </div>
        ) : (
          <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/40 flex items-center justify-center">
            <div className="text-6xl md:text-8xl animate-bounce">🎂</div>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 text-center">
          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-3xl md:text-4xl font-bold font-poppins text-foreground drop-shadow-lg"
          >
            🎉 {age ? `${age} ans, ${firstName} !` : `Joyeux Anniversaire ${firstName} !`}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground mt-2 font-nunito"
          >
            {page?.title}
          </motion.p>
          {birthdayPerson.birthday && (
            <BirthdayCountdown
              birthday={birthdayPerson.birthday}
              celebrationYear={page?.celebration_year}
            />
          )}
        </div>
      </motion.div>

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
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-heart" />
              <h2 className="font-bold font-poppins">Messages d'anniversaire</h2>
              <span className="text-xs text-muted-foreground ml-auto">{messages.length}</span>
            </div>

            {/* Write message */}
            <div className="mb-4">
              {user ? (
                <div className="space-y-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Écris un message pour ${firstName}... 💖`}
                    className="resize-none min-h-[80px]"
                    maxLength={500}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!newMessage.trim() || sendingMessage}
                    onClick={handleSendMessage}
                  >
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                    Envoyer
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => navigate(`/auth?redirect=/birthday/${slug}&invited=true`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Créer un compte pour écrire un message
                </Button>
              )}
            </div>

            {/* Messages list */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50"
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(msg.sender_name || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{msg.sender_name || 'Un ami'}</span>
                        {msg.is_from_fund && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gift/20 text-gift">💝 Contributeur</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{msg.message_text}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Sois le premier à écrire un message !</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Album souvenir */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <BirthdayAlbum
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
