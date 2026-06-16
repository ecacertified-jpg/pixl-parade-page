import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Search, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JDVBusiness {
  id: string;
  business_name: string;
  business_type: string | null;
  logo_url: string | null;
  city: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultCategory?: string;
  onSelect: (b: JDVBusiness) => Promise<void> | void;
}

export const BrowseJDVModal = ({ open, onOpenChange, defaultCategory, onSelect }: Props) => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<JDVBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ(''); setResults([]);
    void search('');
  }, [open]);

  const search = async (term: string) => {
    setLoading(true);
    let query: any = (supabase as any)
      .from('business_accounts')
      .select('id, business_name, business_type, logo_url, city')
      .eq('is_active', true)
      .eq('status', 'active')
      .limit(30)
      .order('business_name');
    if (term.trim()) query = query.ilike('business_name', `%${term.trim()}%`);
    else if (defaultCategory) query = query.ilike('business_type', `%${defaultCategory}%`);
    const { data, error } = await query;
    if (error) { toast.error('Recherche impossible'); setResults([]); }
    else setResults((data ?? []) as JDVBusiness[]);
    setLoading(false);
  };

  const pick = async (b: JDVBusiness) => {
    setPicking(b.id);
    try { await onSelect(b); onOpenChange(false); }
    finally { setPicking(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-poppins flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" /> Réserver via JDV
          </DialogTitle>
          <DialogDescription className="text-xs">
            Choisis un prestataire vérifié JDV pour ton événement.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un prestataire…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(q)}
          />
          <Button size="icon" variant="outline" onClick={() => search(q)}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {loading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}

        {!loading && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun prestataire trouvé.</p>
        )}

        <ul className="space-y-2">
          {results.map((b) => (
            <li key={b.id}>
              <Card className="p-3 flex items-center gap-3">
                {b.logo_url
                  ? <img src={b.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  : <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center"><Store className="h-5 w-5 text-muted-foreground" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="font-nunito text-sm font-medium truncate">{b.business_name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[b.business_type, b.city].filter(Boolean).join(' · ') || 'Prestataire JDV'}
                  </p>
                </div>
                <Button size="sm" disabled={picking === b.id} onClick={() => pick(b)}>
                  {picking === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Choisir'}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};