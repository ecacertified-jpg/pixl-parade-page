import { useSessionHistory } from '@/hooks/useSessionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users, Timer, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function RealtimeSessionHistory() {
  const { sessions, stats, loading } = useSessionHistory();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 Historique des connexions</CardTitle>
        <CardDescription>Sessions utilisateurs et statistiques</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.totalSessionsToday}</p>
              <p className="text-xs text-muted-foreground">Sessions aujourd'hui</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.uniqueUsersToday}</p>
              <p className="text-xs text-muted-foreground">Utilisateurs uniques</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Timer className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{stats.avgDurationMinutes} min</p>
              <p className="text-xs text-muted-foreground">Durée moyenne</p>
            </div>
          </div>
        </div>

        {/* Sessions table */}
        <div className="max-h-[400px] overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Dernière activité</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Aucune session enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => {
                  const isOnline = !session.ended_at;
                  const initials = `${(session.first_name || '?')[0]}${(session.last_name || '')[0] || ''}`;
                  const name = session.first_name
                    ? `${session.first_name} ${session.last_name || ''}`.trim()
                    : 'Utilisateur';
                  const duration = session.duration_minutes != null
                    ? session.duration_minutes < 1
                      ? '< 1 min'
                      : `${Math.round(session.duration_minutes)} min`
                    : '-';

                  return (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={session.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.started_at), { addSuffix: true, locale: fr })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true, locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm">{duration}</TableCell>
                      <TableCell>
                        {isOnline ? (
                          <Badge className="bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20">
                            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                            En ligne
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Hors ligne
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
