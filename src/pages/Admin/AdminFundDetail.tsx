import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { ExternalLink, MessageCircle, Users, Calendar, Gift, Target, AlertCircle } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  target_reached: { label: 'Complétée', variant: 'secondary' },
  completed: { label: 'Complétée', variant: 'secondary' },
  expired: { label: 'Expirée', variant: 'destructive' },
  cancelled: { label: 'Annulée', variant: 'outline' },
};

const formatXOF = (n: number) => `${(n || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

interface Contribution {
  id: string;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  created_at: string;
  contributor_id: string | null;
  contributor_name: string | null;
}

export default function AdminFundDetail() {
  const { fundId } = useParams<{ fundId: string }>();
  const navigate = useNavigate();
  const { canAccessCountry, loading: adminLoading } = useAdmin();

  const [loading, setLoading] = useState(true);
  const [fund, setFund] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!fundId || adminLoading) return;
    fetchData();
  }, [fundId, adminLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: fundData, error } = await supabase
        .from('collective_funds')
        .select('*, contacts!beneficiary_contact_id(name, phone)')
        .eq('id', fundId!)
        .maybeSingle();

      if (error) throw error;
      if (!fundData) {
        toast.error('Cagnotte introuvable');
        navigate('/admin/countries');
        return;
      }

      // Regional access check
      if (fundData.country_code && !canAccessCountry(fundData.country_code)) {
        setAccessDenied(true);
        return;
      }

      setFund(fundData);
      setBeneficiary(fundData.contacts || null);

      // Fetch creator profile
      if (fundData.creator_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, display_name, phone, city, country_code, avatar_url')
          .eq('user_id', fundData.creator_id)
          .maybeSingle();
        setCreator(creatorData);
      }

      // Fetch contributions + contributor names
      const { data: contribs } = await supabase
        .from('fund_contributions')
        .select('id, amount, message, is_anonymous, created_at, contributor_id')
        .eq('fund_id', fundId!)
        .order('created_at', { ascending: false });

      const contributorIds = Array.from(
        new Set((contribs || []).map((c: any) => c.contributor_id).filter(Boolean)),
      );
      let nameMap: Record<string, string> = {};
      if (contributorIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, display_name')
          .in('user_id', contributorIds);
        (profs || []).forEach((p: any) => {
          nameMap[p.user_id] =
            p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Utilisateur';
        });
      }

      setContributions(
        (contribs || []).map((c: any) => ({
          ...c,
          contributor_name: c.is_anonymous ? null : nameMap[c.contributor_id] || null,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading || adminLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (accessDenied) {
    return (
      <AdminLayout>
        <Card className="max-w-md mx-auto mt-12">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
            <p>Vous n'avez pas accès aux cagnottes de ce pays.</p>
            <Button onClick={() => navigate('/admin/countries')}>Retour</Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  if (!fund) return null;

  const progress = fund.target_amount > 0
    ? Math.min(100, Math.round(((fund.current_amount || 0) / fund.target_amount) * 100))
    : 0;
  const statusCfg = STATUS_LABELS[fund.status] || { label: fund.status, variant: 'outline' as const };
  const remaining = Math.max(0, (fund.target_amount || 0) - (fund.current_amount || 0));

  const creatorName =
    creator?.display_name ||
    `${creator?.first_name || ''} ${creator?.last_name || ''}`.trim() ||
    'Inconnu';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={fund.title}
          description={`Cagnotte ${fund.occasion || 'générique'} • ${fund.country_code || '—'}`}
          backPath="/admin/countries"
          showCountryIndicator={false}
          actions={
            <>
              {fund.share_token && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/f/${fund.share_token}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Page publique
                </Button>
              )}
              {creator?.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`https://wa.me/${creator.phone.replace(/\D/g, '')}`, '_blank')
                  }
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contacter créateur
                </Button>
              )}
            </>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{formatXOF(fund.target_amount)}</p>
              <p className="text-xs text-muted-foreground">Objectif</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Gift className="h-5 w-5 mx-auto mb-1 text-success" />
              <p className="text-xl font-bold">{formatXOF(fund.current_amount || 0)}</p>
              <p className="text-xs text-muted-foreground">Collecté ({progress}%)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-xl font-bold">{formatXOF(remaining)}</p>
              <p className="text-xs text-muted-foreground">Restant</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{contributions.length}</p>
              <p className="text-xs text-muted-foreground">Contributeurs</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Progression
              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-3" />
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
              <span><Calendar className="h-4 w-4 inline mr-1" />Créée : {formatDate(fund.created_at)}</span>
              <span><Calendar className="h-4 w-4 inline mr-1" />Échéance : {formatDate(fund.deadline_date)}</span>
              {fund.is_surprise && <Badge variant="outline">Surprise</Badge>}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Créateur</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{creatorName}</p>
              {creator?.phone && <p className="text-muted-foreground">📞 {creator.phone}</p>}
              {creator?.city && <p className="text-muted-foreground">📍 {creator.city}</p>}
              {creator?.country_code && <p className="text-muted-foreground">🌍 {creator.country_code}</p>}
              {creator?.user_id && (
                <Button
                  variant="link"
                  size="sm"
                  className="px-0"
                  onClick={() => navigate(`/admin/users?search=${encodeURIComponent(creator.phone || creatorName)}`)}
                >
                  Voir le profil →
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Bénéficiaire</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {beneficiary ? (
                <>
                  <p className="font-medium">{beneficiary.name}</p>
                  {beneficiary.phone && <p className="text-muted-foreground">📞 {beneficiary.phone}</p>}
                </>
              ) : (
                <p className="text-muted-foreground italic">Auto-bénéficiaire (créateur)</p>
              )}
              {fund.surprise_message && (
                <div className="mt-3 p-3 bg-muted rounded text-xs italic">
                  💌 {fund.surprise_message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contributions ({contributions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contributeur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                        Aucune contribution pour l'instant
                      </TableCell>
                    </TableRow>
                  ) : (
                    contributions.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          {c.is_anonymous ? (
                            <span className="italic text-muted-foreground">Anonyme</span>
                          ) : (
                            c.contributor_name || 'Utilisateur'
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{formatXOF(c.amount)}</TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                          {c.message || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(c.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
