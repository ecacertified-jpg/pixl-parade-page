import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useMemoryCapsules } from '@/hooks/useMemoryCapsules';

export default function SouvenirsCapsule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: capsules = [], isLoading } = useMemoryCapsules();

  const capsule = useMemo(() => capsules.find((c) => c.id === id), [capsules, id]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;
  }

  if (!capsule) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Capsule introuvable.</p>
        <Button className="mt-4" onClick={() => navigate('/souvenirs')}>
          Retour aux souvenirs
        </Button>
      </div>
    );
  }

  const unlockDate = new Date(capsule.unlock_date + 'T00:00:00');
  const daysLeft = differenceInDays(unlockDate, new Date());
  const unlocked = capsule.is_unlocked || daysLeft <= 0;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="px-4 py-3 flex items-center gap-2 border-b border-border/40 sticky top-0 bg-background/95 backdrop-blur z-20">
        <Button variant="ghost" size="icon" onClick={() => navigate('/souvenirs')} aria-label="Retour">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-poppins font-semibold text-lg flex-1 truncate">{capsule.title}</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <section className="bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/30 rounded-2xl p-6 text-center">
          {unlocked ? <Unlock className="h-12 w-12 mx-auto text-primary" /> : <Lock className="h-12 w-12 mx-auto text-primary" />}
          <h2 className="font-poppins font-semibold text-xl mt-3">{capsule.title}</h2>
          <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
            <Calendar className="h-4 w-4" />
            {unlocked ? 'Ouverte le' : 'Ouverture le'} {format(unlockDate, 'd MMMM yyyy', { locale: fr })}
          </p>
          {!unlocked && daysLeft > 0 && (
            <p className="font-poppins text-3xl font-bold text-primary mt-3">J-{daysLeft}</p>
          )}
        </section>

        {unlocked ? (
          <>
            {capsule.message && (
              <section className="bg-card rounded-xl p-4">
                <h3 className="font-poppins text-sm font-medium text-muted-foreground mb-2">Message</h3>
                <p className="font-nunito whitespace-pre-wrap">{capsule.message}</p>
              </section>
            )}

            {capsule.media_refs.length > 0 && (
              <section>
                <h3 className="font-poppins text-sm font-medium text-muted-foreground mb-2">
                  Souvenirs ({capsule.media_refs.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {capsule.media_refs.map((ref, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {ref.thumbnailUrl ? (
                        <img src={ref.thumbnailUrl} alt="Souvenir" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="text-center text-muted-foreground italic px-4">
            Le contenu de cette capsule reste secret jusqu'à son ouverture. Patience… 🌱
          </p>
        )}
      </main>
    </div>
  );
}