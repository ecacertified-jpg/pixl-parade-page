import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEnsureProfile } from '@/hooks/useEnsureProfile';
import { toast } from 'sonner';

const SUGGESTED_AMOUNTS = [5000, 10000, 25000, 50000];

interface CashGiftFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (fundId: string) => void;
  /** Beneficiary (another JDV user). Omitted = fund for myself. */
  beneficiaryUserId?: string;
  beneficiaryName?: string;
  beneficiaryContactId?: string | null;
  occasion?: string;
}

export function CashGiftFundModal({
  isOpen,
  onClose,
  onSuccess,
  beneficiaryUserId,
  beneficiaryName,
  beneficiaryContactId,
  occasion = 'birthday',
}: CashGiftFundModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ensureProfile = useEnsureProfile();

  const isForSelf = !beneficiaryUserId || beneficiaryUserId === user?.id;
  const displayName = isForSelf ? 'moi' : (beneficiaryName?.trim() || 'un proche');

  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setTitle('');
      setDescription('');
      setDeadline('');
      setLoading(false);
      return;
    }
    setTitle(isForSelf ? 'Mon cadeau en argent' : `Cadeau en argent pour ${displayName}`);
  }, [isOpen, isForSelf, displayName]);

  const formatPrice = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vous devez être connecté.');
      return;
    }
    const target = Number(amount);
    if (!Number.isFinite(target) || target <= 0) {
      toast.error('Veuillez saisir un montant valide.');
      return;
    }
    if (!title.trim()) {
      toast.error('Le titre est requis.');
      return;
    }

    setLoading(true);
    try {
      await ensureProfile();

      const { data: fund, error } = await supabase
        .from('collective_funds')
        .insert({
          creator_id: user.id,
          title: title.trim().slice(0, 120),
          description:
            description.trim() ||
            (isForSelf
              ? "Participez à ma cagnotte : le montant collecté est directement le cadeau."
              : `Offrons un cadeau en argent à ${displayName}. Le montant collecté lui est directement versé.`),
          target_amount: target,
          currency: 'XOF',
          occasion,
          status: 'active',
          is_public: true,
          is_cash_gift: true,
          beneficiary_user_id: beneficiaryUserId ?? user.id,
          beneficiary_contact_id: beneficiaryContactId ?? null,
          deadline_date: deadline || null,
        } as any)
        .select('id')
        .single();

      if (error || !fund) throw error ?? new Error('insert failed');

      // Best-effort: link the fund to the beneficiary's birthday page
      try {
        await supabase.functions.invoke('link-fund-to-birthday-page', {
          body: { fund_id: fund.id, beneficiary_user_id: beneficiaryUserId ?? user.id },
        });
      } catch (err) {
        console.warn('link-fund-to-birthday-page failed (non-blocking):', err);
      }

      toast.success('Cagnotte créée ! Partagez-la pour démarrer la collecte.');
      onSuccess?.(fund.id);
      onClose();
      navigate(`/f/${fund.id}`);
    } catch (err: any) {
      console.error('Failed to create cash gift fund', err);
      toast.error(err?.message ?? 'Impossible de créer la cagnotte. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-poppins">
            <Banknote className="h-5 w-5 text-primary" />
            {isForSelf ? 'Cagnotte en argent' : `Offrir de l'argent à ${displayName}`}
          </DialogTitle>
          <DialogDescription>
            Pas d'article : le montant collecté constitue directement le cadeau et sera versé
            {isForSelf ? ' sur votre compte' : ' au bénéficiaire'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Montant objectif *</Label>
            <div className="grid grid-cols-4 gap-2">
              {SUGGESTED_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                    Number(amount) === a
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  {formatPrice(a)}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="Autre montant (XOF)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-title">Titre *</Label>
            <Input
              id="cash-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-desc">Message (optionnel)</Label>
            <Textarea
              id="cash-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Expliquez à quoi servira ce cadeau…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cash-deadline">Date limite (optionnel)</Label>
            <Input
              id="cash-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              Créer la cagnotte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
