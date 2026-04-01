import { useState } from 'react';
import { Cake, PartyPopper } from 'lucide-react';
import { useBirthdayPages } from '@/hooks/useBirthdayPages';
import { BirthdayGridCard } from '@/components/BirthdayGridCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { BirthdayPageItem } from '@/hooks/useBirthdayPages';

type Period = 'thisYear' | 'souvenirs';
type Owner = 'moi' | 'proches';

export function BirthdaysTab() {
  const [period, setPeriod] = useState<Period>('thisYear');
  const [owner, setOwner] = useState<Owner>('moi');
  const { myThisYear, mySouvenirs, prochesThisYear, prochesSouvenirs, loading } = useBirthdayPages();

  const getPages = (): BirthdayPageItem[] => {
    if (period === 'thisYear' && owner === 'moi') return myThisYear;
    if (period === 'thisYear' && owner === 'proches') return prochesThisYear;
    if (period === 'souvenirs' && owner === 'moi') return mySouvenirs;
    return prochesSouvenirs;
  };

  const pages = getPages();

  const periodBtn = (value: Period, label: string) => (
    <button
      onClick={() => setPeriod(value)}
      className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
        period === value
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted/50'
      }`}
    >
      {label}
    </button>
  );

  const ownerBtn = (value: Owner, label: string) => (
    <button
      onClick={() => setOwner(value)}
      className={`px-4 py-1 text-xs font-medium rounded-full transition-all ${
        owner === value
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-muted/40'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      {/* Period toggle */}
      <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
        {periodBtn('thisYear', 'Cette année')}
        {periodBtn('souvenirs', 'Souvenirs')}
      </div>

      {/* Owner filter */}
      <div className="flex gap-2 justify-center">
        {ownerBtn('moi', 'Moi')}
        {ownerBtn('proches', 'Proches')}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-sm" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {period === 'souvenirs' ? (
            <PartyPopper className="h-10 w-10 text-muted-foreground/40 mb-3" />
          ) : (
            <Cake className="h-10 w-10 text-muted-foreground/40 mb-3" />
          )}
          <p className="text-sm font-medium text-muted-foreground">
            {owner === 'moi'
              ? period === 'thisYear'
                ? 'Créez votre page d\'anniversaire !'
                : 'Pas encore de souvenirs'
              : period === 'thisYear'
                ? 'Aucun anniversaire de proches cette année'
                : 'Pas encore de souvenirs de proches'
            }
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {owner === 'moi'
              ? 'Lancez une cagnotte pour créer votre page'
              : 'Ajoutez des amis et participez à leurs cagnottes'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {pages.map(page => (
            <BirthdayGridCard key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
