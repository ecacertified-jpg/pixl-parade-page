import { useMemo } from 'react';
import { Users, Trash2 } from 'lucide-react';
import { useFamilyVault } from '@/hooks/useFamilyVault';
import { useAggregatedMemories } from '@/hooks/useAggregatedMemories';
import { Button } from '@/components/ui/button';

export function FamilyVaultSection() {
  const { data: shares = [], unshare } = useFamilyVault();
  const { data } = useAggregatedMemories();

  const items = useMemo(() => {
    if (!data?.items) return [];
    const memMap = new Map(data.items.map((m) => [`${m.source}-${m.id}`, m]));
    return shares
      .map((s) => ({ share: s, mem: memMap.get(`${s.memory_source}-${s.memory_id}`) }))
      .filter((x) => !!x.mem);
  }, [shares, data?.items]);

  return (
    <section className="bg-card rounded-2xl p-4 border border-border/40">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="font-poppins font-medium text-sm">Coffre familial privé</h3>
        <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Partage des souvenirs avec ton cercle « Famille » : ils seront visibles uniquement par eux.
          Depuis la galerie, ouvre un souvenir et choisis « Ajouter au coffre familial ».
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map(({ share, mem }) => (
            <div key={share.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <img src={mem!.thumbnailUrl ?? mem!.mediaUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition"
                onClick={() => unshare.mutate(share.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}