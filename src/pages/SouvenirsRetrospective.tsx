import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ChevronDown, Sparkles, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useAggregatedMemories } from '@/hooks/useAggregatedMemories';
import { EMOTION_META } from '@/data/memory-emotions';

const MONTHS_FR = [
  'janvier','février','mars','avril','mai','juin',
  'juillet','août','septembre','octobre','novembre','décembre',
];

export default function SouvenirsRetrospective() {
  const { year: yearParam } = useParams();
  const navigate = useNavigate();
  const year = Number(yearParam) || new Date().getFullYear() - 1;
  const { data, isLoading } = useAggregatedMemories();

  const [step, setStep] = useState(0);

  const yearItems = useMemo(() => (data?.items ?? []).filter((it) => it.year === year), [data, year]);

  const stats = useMemo(() => {
    const occasions = new Set(yearItems.map((it) => it.pageId));
    const monthsCount: Record<number, number> = {};
    const occasionCount: Record<string, number> = {};
    yearItems.forEach((it) => {
      const m = new Date(it.createdAt).getMonth();
      monthsCount[m] = (monthsCount[m] ?? 0) + 1;
      occasionCount[it.occasion] = (occasionCount[it.occasion] ?? 0) + 1;
    });
    const topMonth = Object.entries(monthsCount).sort((a, b) => b[1] - a[1])[0];
    const topOccasion = Object.entries(occasionCount).sort((a, b) => b[1] - a[1])[0];
    const topPhotos = yearItems.filter((it) => it.mediaType === 'image').slice(0, 6);
    return {
      total: yearItems.length,
      occasions: occasions.size,
      topMonth: topMonth ? MONTHS_FR[Number(topMonth[0])] : null,
      topOccasion: topOccasion ? topOccasion[0] : null,
      topPhotos,
    };
  }, [yearItems]);

  const slides = useMemo(() => {
    const list: { key: string; render: () => JSX.Element }[] = [
      {
        key: 'cover',
        render: () => (
          <div className="text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <p className="font-poppins text-sm uppercase tracking-widest text-muted-foreground">Ton année</p>
            <h1 className="font-poppins text-6xl font-bold mt-2">{year}</h1>
            <p className="font-nunito text-lg mt-4 text-muted-foreground">en souvenirs</p>
          </div>
        ),
      },
      {
        key: 'stats',
        render: () => (
          <div className="text-center space-y-6">
            <div>
              <p className="text-5xl font-poppins font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-muted-foreground mt-1">souvenirs capturés</p>
            </div>
            <div>
              <p className="text-5xl font-poppins font-bold text-accent">{stats.occasions}</p>
              <p className="text-sm text-muted-foreground mt-1">moments célébrés</p>
            </div>
          </div>
        ),
      },
    ];

    if (stats.topPhotos.length > 0) {
      list.push({
        key: 'top-photos',
        render: () => (
          <div className="w-full">
            <p className="font-poppins text-sm uppercase tracking-widest text-muted-foreground text-center mb-4">
              Tes 6 plus beaux clichés
            </p>
            <div className="grid grid-cols-2 gap-2">
              {stats.topPhotos.map((it) => (
                <div key={`${it.source}-${it.id}`} className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img src={it.thumbnailUrl ?? it.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ),
      });
    }

    if (stats.topMonth) {
      list.push({
        key: 'top-month',
        render: () => (
          <div className="text-center">
            <p className="font-poppins text-sm uppercase tracking-widest text-muted-foreground">Ton mois le plus joyeux</p>
            <p className="font-poppins text-5xl font-bold text-primary mt-3 capitalize">{stats.topMonth}</p>
          </div>
        ),
      });
    }

    if (stats.topOccasion) {
      const emotionMeta = EMOTION_META.joie;
      list.push({
        key: 'top-occasion',
        render: () => (
          <div className="text-center">
            <p className="font-poppins text-sm uppercase tracking-widest text-muted-foreground">Le moment fort</p>
            <p className="font-poppins text-4xl font-bold text-primary mt-3 capitalize">{stats.topOccasion}</p>
            <p className="text-4xl mt-4">{emotionMeta.emoji}</p>
          </div>
        ),
      });
    }

    list.push({
      key: 'end',
      render: () => (
        <div className="text-center space-y-4">
          <Sparkles className="h-10 w-10 mx-auto text-primary" />
          <p className="font-poppins text-2xl font-semibold">Merci pour {year} 💜</p>
          <p className="text-sm text-muted-foreground">Partage ta rétro et continue de célébrer !</p>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <Button onClick={() => navigator.share?.({ title: `Ma rétro ${year}`, url: window.location.href }).catch(() => {})}>
              <Share2 className="h-4 w-4 mr-2" /> Partager
            </Button>
            <Button variant="outline" onClick={() => navigate('/souvenirs')}>
              Retour aux souvenirs
            </Button>
          </div>
        </div>
      ),
    });

    return list;
  }, [year, stats, navigate]);

  const total = slides.length;
  const canPrev = step > 0;
  const canNext = step < total - 1;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement de ta rétro…</div>;
  }

  if (yearItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <p className="font-poppins text-lg mb-2">Pas encore de souvenirs pour {year}</p>
        <p className="text-sm text-muted-foreground mb-6">Crée des pages d'anniversaire ou d'événement pour démarrer ta collection.</p>
        <Button onClick={() => navigate('/souvenirs')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col">
      <header className="px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/souvenirs')} aria-label="Retour">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex gap-1">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">{slides[step].render()}</div>
      </main>

      <footer className="px-4 py-4 flex justify-between max-w-md mx-auto w-full">
        <Button variant="ghost" size="icon" disabled={!canPrev} onClick={() => setStep((s) => s - 1)}>
          <ChevronUp className="h-5 w-5" />
        </Button>
        <span className="text-xs text-muted-foreground self-center">
          {step + 1} / {total}
        </span>
        <Button variant="ghost" size="icon" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
          <ChevronDown className="h-5 w-5" />
        </Button>
      </footer>
    </div>
  );
}