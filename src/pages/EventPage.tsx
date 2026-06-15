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
import { Heart, Gift, Send, Share2, MessageCircle, Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { EventAlbum } from "@/components/EventAlbum";
import { EventPageShareButton } from "@/components/EventPageShareButton";
import { useEventPageSEO } from "@/hooks/useEventPageSEO";
import { useSchemaInjector } from "@/components/schema";
import { FundSelector } from "@/components/birthday/FundSelector";
import { CelebrationArtisansSection } from "@/components/birthday/CelebrationArtisansSection";
import { OrganizationSection } from "@/components/organization/OrganizationSection";
import type { CelebrationArtisan } from "@/types/celebrationArtisan";
import { MyOtherPagesSection } from "@/components/MyOtherPagesSection";
import { VisitorConversionCTA } from "@/components/VisitorConversionCTA";
import { CoverVideoCarousel } from "@/components/birthday/CoverVideoCarousel";
import { EventHeroOverlay } from "@/components/event/EventHeroOverlay";
import { CountdownWidget } from "@/components/event/CountdownWidget";
import { EventWishlistSection } from "@/components/event/EventWishlistSection";

const occasionThemes: Record<string, { emoji: string; gradient: string; label: string }> = {
  wedding: { emoji: '💍', gradient: 'from-rose-200/40 via-amber-100/30 to-rose-100/40', label: 'Mariage' },
  mariage_traditionnel: { emoji: '💍', gradient: 'from-rose-200/40 via-amber-100/30 to-rose-100/40', label: 'Mariage traditionnel' },
  mariage_religieux: { emoji: '⛪', gradient: 'from-rose-200/40 via-amber-100/30 to-rose-100/40', label: 'Mariage religieux' },
  mariage_civil: { emoji: '📜', gradient: 'from-rose-200/40 via-amber-100/30 to-rose-100/40', label: 'Mariage civil' },
  baptism: { emoji: '👶', gradient: 'from-sky-200/40 via-blue-100/30 to-sky-100/40', label: 'Baptême' },
  engagement: { emoji: '💑', gradient: 'from-rose-200/40 via-purple-100/30 to-pink-100/40', label: 'Fiançailles' },
  graduation: { emoji: '🎓', gradient: 'from-blue-200/40 via-violet-100/30 to-indigo-100/40', label: 'Diplôme' },
  reussite_academique: { emoji: '🎓', gradient: 'from-blue-200/40 via-violet-100/30 to-indigo-100/40', label: 'Réussite académique' },
  reussite_scolaire: { emoji: '📚', gradient: 'from-blue-200/40 via-violet-100/30 to-indigo-100/40', label: 'Réussite scolaire' },
  promotion: { emoji: '💼', gradient: 'from-violet-200/40 via-amber-100/30 to-purple-100/40', label: 'Promotion' },
  promotion_pro: { emoji: '🏆', gradient: 'from-violet-200/40 via-amber-100/30 to-purple-100/40', label: 'Promotion pro' },
  other: { emoji: '🎊', gradient: 'from-primary/20 via-accent/20 to-secondary/40', label: 'Événement' },
};

interface EventPageData {
  id: string; creator_id: string; occasion: string; title: string; description: string | null;
  slug: string; cover_image_url: string | null; event_date: string | null; fund_id: string | null; is_active: boolean;
  spouse_first_name?: string | null;
  spouse_avatar_url?: string | null;
}

interface WishMessage { id: string; sender_name: string | null; message_text: string; created_at: string; }
interface AlbumItem { id: string; uploader_name: string | null; image_url: string; caption: string | null; created_at: string; media_type: string; video_url: string | null; video_thumbnail_url: string | null; memory_text: string | null; }
interface FundInfo { id: string; title: string; target_amount: number; current_amount: number; share_token: string | null; }

const EventPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromFeed = (location.state as any)?.fromFeed === true;
  const authReturnTo = `${location.pathname}${location.search}`;

  const [page, setPage] = useState<EventPageData | null>(null);
  const [messages, setMessages] = useState<WishMessage[]>([]);
  const [albumItems, setAlbumItems] = useState<AlbumItem[]>([]);
  const [fund, setFund] = useState<FundInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const confettiTriggered = useRef(false);

  const theme = useMemo(() => occasionThemes[page?.occasion || 'other'] || occasionThemes.other, [page?.occasion]);
  const isOwner = !!user?.id && !!page?.creator_id && user.id === page.creator_id;
  const isWedding = !!page?.occasion && (page.occasion.includes('mariage') || page.occasion === 'wedding');

  const [creatorProfile, setCreatorProfile] = useState<{ first_name: string; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!page?.creator_id) return;
    (async () => {
      const { data } = await supabase
        .from('public_profiles')
        .select('first_name, avatar_url')
        .eq('user_id', page.creator_id)
        .maybeSingle();
      if (data) setCreatorProfile(data as any);
    })();
  }, [page?.creator_id]);

  useEventPageSEO({
    title: page?.title || '',
    occasion: page?.occasion || 'other',
    slug: slug || '',
    coverImage: page?.cover_image_url || null,
    eventDate: page?.event_date || null,
    description: page?.description || null,
  });

  const eventSchema = useMemo(() => {
    if (!page) return null;
    return {
      '@context': 'https://schema.org', '@type': 'Event',
      name: page.title,
      description: page.description || `Page de célébration : ${page.title}`,
      startDate: page.event_date || undefined,
      url: `https://joiedevivre-africa.com/event/${slug}`,
      image: page.cover_image_url || 'https://joiedevivre-africa.com/og-image.jpg',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      organizer: { '@type': 'Organization', name: 'JOIE DE VIVRE', url: 'https://joiedevivre-africa.com' },
      location: { '@type': 'VirtualLocation', url: `https://joiedevivre-africa.com/event/${slug}` },
    };
  }, [page, slug]);

  useSchemaInjector('event-page', eventSchema);

  useEffect(() => { if (slug) loadPage(); }, [slug]);

  const reloadAlbum = async (pageData: EventPageData) => {
    const { data: pics } = await supabase
      .from('event_page_photos')
      .select('id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text')
      .eq('event_page_id', pageData.id)
      .order('created_at', { ascending: false });

    const { data: ownBdayPages } = await supabase
      .from('birthday_pages')
      .select('id')
      .eq('user_id', pageData.creator_id)
      .eq('is_active', true);

    let bdayPics: any[] = [];
    if (ownBdayPages && ownBdayPages.length > 0) {
      const ids = ownBdayPages.map((p: any) => p.id);
      const { data: bp } = await supabase
        .from('birthday_page_photos')
        .select('id, uploader_name, image_url, caption, created_at, media_type, video_url, video_thumbnail_url, memory_text')
        .in('birthday_page_id', ids)
        .order('created_at', { ascending: false });
      if (bp) bdayPics = bp;
    }

    const merged = [...((pics as any[]) || []), ...bdayPics].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setAlbumItems(merged as AlbumItem[]);
  };

  useEffect(() => {
    if (!page) return;
    let cancelled = false;
    const trigger = () => { if (!cancelled) reloadAlbum(page); };
    const channel = supabase
      .channel(`event-album-${page.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_page_photos', filter: `event_page_id=eq.${page.id}` }, trigger)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'birthday_page_photos' }, trigger)
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [page?.id, page?.creator_id]);

  useEffect(() => {
    if (page && !confettiTriggered.current) {
      confettiTriggered.current = true;
      const colors = ['#7A5DC7', '#FAD4E1', '#C084FC', '#F7C948', '#FF4D6D'];
      setTimeout(() => confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors, zIndex: 9999 }), 500);
    }
  }, [page]);

  const loadPage = async () => {
    try {
      setLoading(true);
      const { data: pageData, error } = await supabase.from('event_pages').select('*').eq('slug', slug).eq('is_active', true).single();
      if (error || !pageData) { setNotFound(true); return; }
      setPage(pageData as EventPageData);

      const { data: msgs } = await supabase.from('event_wishes_messages').select('id, sender_name, message_text, created_at').eq('event_page_id', pageData.id).order('created_at', { ascending: false });
      if (msgs) setMessages(msgs);

      await reloadAlbum(pageData as EventPageData);

      if (pageData.fund_id) {
        const { data: fundData } = await supabase.from('collective_funds').select('id, title, target_amount, current_amount, share_token').eq('id', pageData.fund_id).single();
        if (fundData) setFund(fundData as FundInfo);
      }
    } catch { setNotFound(true); } finally { setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!user) { navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(authReturnTo)}&intent=post_message&invited=true`); return; }
    if (!newMessage.trim() || !page) return;
    setSendingMessage(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('user_id', user.id).maybeSingle();
      const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Un ami' : 'Un ami';
      const { error } = await supabase.from('event_wishes_messages').insert({
        event_page_id: page.id, sender_id: user.id, sender_name: senderName, message_text: newMessage.trim(),
      });
      if (error) throw error;
      setMessages(prev => [{ id: crypto.randomUUID(), sender_name: senderName, message_text: newMessage.trim(), created_at: new Date().toISOString() }, ...prev]);
      setNewMessage("");
      toast.success("Message envoyé ! 💖");
    } catch { toast.error("Erreur lors de l'envoi du message"); } finally { setSendingMessage(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="text-6xl mb-4">🎊</div>
      <h1 className="text-2xl font-bold font-poppins mb-2">Page introuvable</h1>
      <p className="text-muted-foreground mb-6">Cette page d'événement n'existe pas ou n'est plus active.</p>
      <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
    </div>
  );

  const pageUrl = `${getAppBaseUrl()}/event/${slug}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      {fromFeed && (
        <div className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border/30 px-4 py-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/home')} className="gap-1 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Retour au fil
          </Button>
        </div>
      )}
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden">
        <CoverVideoCarousel
          birthdayPageId={null}
          birthday={page?.event_date ?? null}
          fallbackImageUrl={page?.cover_image_url ?? null}
          context="wedding"
          className="h-[58vh] min-h-[360px] md:h-[64vh] md:min-h-[460px]"
          overlay={
            page ? (
              <EventHeroOverlay
                page={page}
                creatorProfile={creatorProfile}
                isWedding={isWedding}
                emoji={theme.emoji}
              />
            ) : null
          }
        />
      </motion.div>

      <div className="max-w-lg mx-auto px-4 pb-24 space-y-6 mt-6">
        {page?.event_date && (
          <CountdownWidget eventDate={page.event_date} occasionEmoji={theme.emoji} />
        )}
        {page && (
          <CelebrationArtisansSection
            artisans={((page as any).celebration_artisans ?? []) as CelebrationArtisan[]}
            editable={
              isOwner
                ? {
                    pageId: page.id,
                    table: 'event_pages',
                    onUpdated: (next) =>
                      setPage((prev) =>
                        prev ? ({ ...prev, celebration_artisans: next } as any) : prev
                      ),
                  }
                : undefined
            }
          />
        )}
        {page && (
          <OrganizationSection
            pageType="event"
            pageId={page.id}
            ownerUserId={page.creator_id}
            pageTitle={page.title}
          />
        )}
        {/* Fund section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="h-5 w-5 text-primary" />
              <h2 className="font-bold font-poppins">Cadeau collectif</h2>
            </div>
            {fund ? (
              <>
                {isOwner && page && (
                  <FundSelector
                    ownerUserId={page.creator_id}
                    pageType="event"
                    pageId={page.id}
                    currentFundId={fund.id}
                    onChange={async (newId) => {
                      if (!newId) return;
                      const { data: f } = await supabase
                        .from('collective_funds')
                        .select('id, title, target_amount, current_amount, share_token')
                        .eq('id', newId)
                        .single();
                      if (f) setFund(f as FundInfo);
                    }}
                    onCreateNew={() => navigate('/gifts')}
                  />
                )}
                <p className="text-sm text-muted-foreground mb-3">{fund.title}</p>
                <div className="mb-2"><Progress value={fund.target_amount > 0 ? (fund.current_amount / fund.target_amount) * 100 : 0} className="h-3" indicatorClassName="bg-gradient-to-r from-primary to-accent" /></div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="font-semibold text-primary">{fund.current_amount.toLocaleString('fr-FR')} XOF</span>
                  <span className="text-muted-foreground">/ {fund.target_amount.toLocaleString('fr-FR')} XOF</span>
                </div>
                <Button className="w-full" onClick={() => { if (!user) { navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(authReturnTo)}&intent=contribute_fund&invited=true`); return; } navigate(`/f/${fund.id}`); }}>
                  <Gift className="h-4 w-4 mr-2" /> Participer au cadeau
                </Button>
              </>
            ) : (
              <div className="text-center py-4 space-y-3">
                {isOwner && page && (
                  <FundSelector
                    ownerUserId={page.creator_id}
                    pageType="event"
                    pageId={page.id}
                    currentFundId={null}
                    onChange={async (newId) => {
                      if (!newId) return;
                      const { data: f } = await supabase
                        .from('collective_funds')
                        .select('id, title, target_amount, current_amount, share_token')
                        .eq('id', newId)
                        .single();
                      if (f) setFund(f as FundInfo);
                    }}
                    onCreateNew={() => navigate('/gifts')}
                  />
                )}
                <div className="text-4xl">🎁</div>
                <p className="text-sm text-muted-foreground font-nunito">Réunissez-vous pour offrir un cadeau collectif !</p>
                <Button className="w-full" onClick={() => { if (!user) { navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(authReturnTo)}&intent=create_fund&invited=true`); return; } navigate('/gifts'); }}>
                  <Gift className="h-4 w-4 mr-2" /> Créer une cagnotte
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Messages */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-5 w-5 text-heart" />
              <h2 className="font-bold font-poppins">Vœux & messages</h2>
              <span className="text-xs text-muted-foreground ml-auto">{messages.length}</span>
            </div>
            <div className="mb-4">
              {user ? (
                <div className="space-y-2">
                  <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Écris un message... ${theme.emoji}`} className="resize-none min-h-[80px]" maxLength={500} />
                  <Button size="sm" className="w-full" disabled={!newMessage.trim() || sendingMessage} onClick={handleSendMessage}>
                    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} Envoyer
                  </Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full border-dashed" onClick={() => navigate(`/auth?tab=signup&returnTo=${encodeURIComponent(authReturnTo)}&intent=post_message&invited=true`)}>
                  <MessageCircle className="h-4 w-4 mr-2" /> Créer un compte pour écrire un message
                </Button>
              )}
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                    <Avatar className="h-8 w-8 flex-shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs">{(msg.sender_name || '?').charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm">{msg.sender_name || 'Un ami'}</span>
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

        {/* Album */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <EventAlbum eventPageId={page!.id} slug={slug!} title={page!.title} user={user} items={albumItems} onItemAdded={(item) => setAlbumItems(prev => [item, ...prev])} />
        </motion.div>

        {/* Les autres pages du créateur */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <MyOtherPagesSection
            ownerUserId={page!.creator_id}
            ownerFirstName={creatorProfile?.first_name || page!.title}
            currentPageId={page!.id}
            showAddButton={isOwner}
          />
        </motion.div>
      </div>

      {/* Floating share */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90" onClick={() => setShowShareMenu(true)}>
          <Share2 className="h-6 w-6" />
        </Button>
      </div>

      <EventPageShareButton open={showShareMenu} onOpenChange={setShowShareMenu} title={page?.title || ''} pageUrl={pageUrl} occasionEmoji={theme.emoji} />

      {/* Visitor conversion CTA — only for non-authenticated visitors */}
      {!user && page && (
        <VisitorConversionCTA refSlug={page.slug} pageKind="event" occasion={page.occasion} />
      )}
    </div>
  );
};

export default EventPage;
