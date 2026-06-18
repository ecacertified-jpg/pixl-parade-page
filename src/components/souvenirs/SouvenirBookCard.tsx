import { Download, BookOpen, Loader2, RefreshCw, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSouvenirBooks } from '@/hooks/useSouvenirBooks';
import { usePlan } from '@/features/subscription/usePlan';
import { useNavigate } from 'react-router-dom';

export function SouvenirBookCard({ year }: { year: number }) {
  const { data: books = [], generate } = useSouvenirBooks();
  const { isAtLeast } = usePlan();
  const navigate = useNavigate();
  const isPremium = isAtLeast('premium');

  const book = books.find((b) => b.year === year);
  const isWorking = book?.status === 'generating' || book?.status === 'pending' || generate.isPending;

  const handleGenerate = () => {
    if (!isPremium) {
      navigate('/pricing');
      return;
    }
    generate.mutate(year);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/30 rounded-2xl p-5 border border-border/40">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-poppins font-semibold">Livre souvenir {year}</h3>
            {!isPremium && <Crown className="h-3.5 w-3.5 text-amber-500" />}
          </div>
          <p className="text-xs text-muted-foreground">
            Un PDF imprimable rassemblant tes plus beaux moments.
          </p>
        </div>
      </div>

      {book?.status === 'ready' && book.pdf_url ? (
        <div className="flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <a href={book.pdf_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-1" /> Télécharger ({book.memory_count} souvenirs)
            </a>
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isWorking}>
            <RefreshCw className={`h-4 w-4 ${isWorking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      ) : book?.status === 'failed' ? (
        <div className="space-y-2">
          <p className="text-xs text-destructive">Échec : {book.error_message ?? 'erreur inconnue'}</p>
          <Button size="sm" onClick={handleGenerate} disabled={isWorking} className="w-full">
            Réessayer
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={handleGenerate} disabled={isWorking} className="w-full">
          {isWorking ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Génération en cours…
            </>
          ) : isPremium ? (
            <>Générer mon livre {year}</>
          ) : (
            <>Débloquer avec Premium</>
          )}
        </Button>
      )}
    </div>
  );
}