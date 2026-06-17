import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Lock, BookOpen, Crown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAggregatedMemories } from '@/hooks/useAggregatedMemories';
import { useMemoryCapsules } from '@/hooks/useMemoryCapsules';
import { usePlan } from '@/features/subscription/usePlan';
import { MemoriesGallery } from '@/components/souvenirs/MemoriesGallery';
import { MemoriesAlbumsGrid } from '@/components/souvenirs/MemoriesAlbumsGrid';
import { MemoriesTimeline } from '@/components/souvenirs/MemoriesTimeline';
import { SealCapsuleModal } from '@/components/souvenirs/SealCapsuleModal';
import { CapsuleCard } from '@/components/souvenirs/CapsuleCard';
import { SEOHead } from '@/components/SEOHead';

export default function Souvenirs() {
  const navigate = useNavigate();
  const { data, isLoading } = useAggregatedMemories();
  const { data: capsules = [], remove } = useMemoryCapsules();
  const { isAtLeast } = usePlan();
  const isPremium = isAtLeast('premium') || isAtLeast('essentiel');
  const [sealOpen, setSealOpen] = useState(false);

  const items = data?.items ?? [];
  const albums = data?.albums ?? [];

  const yearsSpan = useMemo(() => {
    if (items.length === 0) return 0;
    const years = items.map((it) => it.year);
    return Math.max(...years) - Math.min(...years) + 1;
  }, [items]);

  const currentYear = new Date().getFullYear();
  const retrospectiveYear = new Date().getMonth() >= 11 ? currentYear : currentYear - 1;

  return (
    <div className="min-h-screen bg-background pb-16">
      <SEOHead
        title="Souvenirs · JDV"
        description="Conserve tes plus beaux moments pendant des années avec JDV : galerie, albums, timeline émotionnelle et capsules temporelles."
      />

      <header className="px-4 py-3 flex items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label="Retour">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-poppins font-semibold text-lg">Souvenirs</h1>
          <p className="text-xs text-muted-foreground">
            {items.length} {items.length > 1 ? 'souvenirs' : 'souvenir'} · {yearsSpan} {yearsSpan > 1 ? 'années' : 'année'}
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 sm:px-4 py-6 space-y-6">
        <section className="bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/30 rounded-2xl p-5 text-center">
          <Sparkles className="h-7 w-7 text-primary mx-auto mb-2" />
          <h2 className="font-poppins font-semibold text-base">Tes plus beaux moments, gardés pour toujours</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revis tes joies, scelle des capsules pour le futur, garde ta mémoire émotionnelle vivante.
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => (isPremium ? setSealOpen(true) : navigate('/pricing'))}
            className="text-left bg-card rounded-xl p-4 hover:shadow-card transition-shadow border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-primary" />
              <span className="font-poppins text-sm font-medium">Capsule</span>
              {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Scelle un souvenir pour plus tard</p>
          </button>
          <button
            onClick={() => (isPremium ? navigate(`/souvenirs/retrospective/${retrospectiveYear}`) : navigate('/pricing'))}
            className="text-left bg-card rounded-xl p-4 hover:shadow-card transition-shadow border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-poppins text-sm font-medium">Ma rétro {retrospectiveYear}</span>
              {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
            </div>
            <p className="text-xs text-muted-foreground">Ton année en souvenirs</p>
          </button>
        </div>

        {capsules.length > 0 && (
          <section>
            <h3 className="font-poppins font-medium text-sm text-muted-foreground mb-3">
              Tes capsules ({capsules.length})
            </h3>
            <div className="space-y-3">
              {capsules.map((c) => (
                <CapsuleCard key={c.id} capsule={c} onDelete={() => remove.mutate(c.id)} />
              ))}
            </div>
          </section>
        )}

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Galerie</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-4">
            {isLoading ? <Skeleton /> : <MemoriesGallery items={items} />}
          </TabsContent>
          <TabsContent value="albums" className="mt-4">
            {isLoading ? <Skeleton /> : <MemoriesAlbumsGrid albums={albums} />}
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            {isLoading ? <Skeleton /> : <MemoriesTimeline items={items} />}
          </TabsContent>
        </Tabs>
      </main>

      <SealCapsuleModal open={sealOpen} onOpenChange={setSealOpen} availableItems={items} />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );
}