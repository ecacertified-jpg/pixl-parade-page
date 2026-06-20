import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Copy, Plus, Share2, Trash2, ExternalLink, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizerClients } from '@/hooks/useOrganizerClients';

interface Props {
  eventPageId?: string;
  canEdit: boolean;
}

export const ClientsManager = ({ eventPageId, canEdit }: Props) => {
  const { list, create, remove } = useOrganizerClients(eventPageId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', email: '', birthday: '' });

  const handleCreate = async () => {
    if (!form.first_name.trim()) {
      toast.error('Prénom requis');
      return;
    }
    try {
      const res = await create.mutateAsync({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        birthday: form.birthday || undefined,
      });
      try {
        await navigator.clipboard.writeText(res.share_message);
        toast.success('Page créée ! Message copié 📋');
      } catch {
        toast.success('Page client créée');
      }
      setForm({ first_name: '', last_name: '', phone: '', email: '', birthday: '' });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Erreur création client');
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Lien copié');
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const sendWhatsApp = (phone: string | null, message: string) => {
    const cleaned = (phone || '').replace(/\D/g, '');
    const url = cleaned
      ? `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const buildShareMessage = (firstName: string, claimUrl: string) =>
    `Salut ${firstName} ! J'ai préparé ta page d'anniversaire sur JOIE DE VIVRE 🎂\nFinalise ton inscription ici : ${claimUrl}`;

  const claimUrlOf = (token: string) =>
    `${window.location.origin}/auth?tab=signup&claim=${token}&intent=express_birthday`;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-poppins font-semibold text-base">Pages de mes clients 👥</h3>
          <p className="text-xs text-muted-foreground font-nunito">
            Crée une page d'anniversaire pour chaque client. Partage-lui le lien d'inscription : tu gardes les droits d'admin sur sa page.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Nouveau
          </Button>
        )}
      </div>

      {list.isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!list.isLoading && (list.data?.length ?? 0) === 0 && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          Aucun client pour le moment.
        </Card>
      )}

      <div className="space-y-2">
        {list.data?.map((c) => {
          const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ');
          const url = claimUrlOf(c.claim_token);
          const msg = buildShareMessage(c.first_name, url);
          const claimed = !!c.claimed_at;
          const slug = c.birthday_page?.slug;
          return (
            <Card key={c.id} className="p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{fullName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.phone || c.email || '—'}
                  </div>
                </div>
                <Badge variant={claimed ? 'default' : 'secondary'} className="shrink-0">
                  {claimed ? 'Réclamé' : 'En attente'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => copyLink(url)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Lien
                </Button>
                <Button size="sm" variant="outline" onClick={() => sendWhatsApp(c.phone, msg)}>
                  <Share2 className="h-3.5 w-3.5 mr-1" /> WhatsApp
                </Button>
                {slug && (
                  <Button size="sm" variant="outline" onClick={() => window.open(`/birthday/${slug}`, '_blank')}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Page
                  </Button>
                )}
                {canEdit && !claimed && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Supprimer ${fullName} ?`)) remove.mutate(c.id);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Créer une page client 🎂</DialogTitle>
            <DialogDescription>
              Une page d'anniversaire sera générée. Tu pourras envoyer le lien d'inscription au client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Prénom *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Nom</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div>
              <Label>Téléphone (WhatsApp)</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225..." />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Date d'anniversaire</Label>
              <Input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={create.isPending} className="w-full">
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Créer et générer le lien
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};