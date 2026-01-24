import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { Mail, Calendar, RefreshCw, Trash2, Search } from 'lucide-react';
import { Invitation } from '@/hooks/useInvitations';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface InvitationHistoryTableProps {
  invitations: Invitation[];
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function InvitationHistoryTable({
  invitations,
  onResend,
  onDelete,
  loading,
}: InvitationHistoryTableProps) {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'pending' | 'expired'>('all');
  const [search, setSearch] = useState('');

  const filteredInvitations = invitations.filter(inv => {
    const matchesFilter = filter === 'all' || inv.status === filter;
    const matchesSearch = inv.invitee_email.toLowerCase().includes(search.toLowerCase()) ||
                          (inv.invitee_phone && inv.invitee_phone.includes(search));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">✅ Acceptée</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20">⏰ En attente</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/10 text-red-700 hover:bg-red-500/20">❌ Expirée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Historique des invitations</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Toutes</TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs sm:text-sm">Acceptées</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">En attente</TabsTrigger>
              <TabsTrigger value="expired" className="text-xs sm:text-sm">Expirées</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email ou téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredInvitations.length === 0 ? (
          <EmptyState
            icon={Mail}
            title="Aucune invitation trouvée"
            description={search ? "Essayez avec d'autres termes de recherche" : undefined}
            iconColor="text-primary"
            showDecorations={false}
            size="sm"
            className="py-8"
          />
        ) : (
          <div className="space-y-3">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium truncate">{invitation.invitee_email}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(invitation.invited_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                    {invitation.status === 'accepted' && (
                      <span className="text-green-600 font-medium">+50 points gagnés</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(invitation.status)}
                  {(invitation.status === 'pending' || invitation.status === 'expired') && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResend(invitation.id)}
                        className="h-8"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Renvoyer
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(invitation.id)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
