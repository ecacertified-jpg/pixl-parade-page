import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Plus, Radio, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface LiveRoom {
  id: string;
  host_id: string;
  title: string;
  status: string;
  max_participants: number;
  is_public: boolean;
  created_at: string;
}

export default function Rooms() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<LiveRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState(20);

  const loadRooms = async () => {
    const { data, error } = await supabase
      .from('live_rooms')
      .select('id, host_id, title, status, max_participants, is_public, created_at')
      .in('status', ['live', 'scheduled'])
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) {
      toast.error('Impossible de charger les rooms');
      return;
    }
    setRooms((data ?? []) as LiveRoom[]);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadRooms().finally(() => setLoading(false));

    const channel = supabase
      .channel('live_rooms_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_rooms' },
        () => {
          loadRooms();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    const trimmed = title.trim();
    if (!trimmed || trimmed.length > 80) {
      toast.error('Le titre doit faire entre 1 et 80 caractères');
      return;
    }
    const safeMax = Math.min(100, Math.max(2, Number(maxParticipants) || 20));
    setCreating(true);
    const { data, error } = await supabase
      .from('live_rooms')
      .insert({
        host_id: user.id,
        title: trimmed,
        livekit_room_name: `room-${crypto.randomUUID()}`,
        status: 'live',
        is_public: isPublic,
        max_participants: safeMax,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    setCreating(false);
    if (error || !data) {
      toast.error(error?.message ?? 'Création impossible');
      return;
    }
    setOpen(false);
    toast.success('Room créée');
    navigate(`/live/${data.id}`);
  };

  const handleEnd = async (roomId: string) => {
    const { error } = await supabase
      .from('live_rooms')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', roomId);
    if (error) {
      toast.error('Impossible de terminer la room');
      return;
    }
    toast.success('Room terminée');
    loadRooms();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              <ArrowLeft />
            </Button>
            <div>
              <h1 className="font-poppins text-2xl font-semibold text-foreground">
                Rooms en direct
              </h1>
              <p className="font-nunito text-sm text-muted-foreground">
                Rejoins une room ou démarre la tienne.
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus />
                Nouvelle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une room</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={80}
                    placeholder="Ex: Anniversaire d'Aminata"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Participants max</Label>
                  <Input
                    id="max"
                    type="number"
                    min={2}
                    max={100}
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div>
                    <Label htmlFor="public">Room publique</Label>
                    <p className="text-xs text-muted-foreground">
                      Visible par tous les utilisateurs connectés.
                    </p>
                  </div>
                  <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? <Loader2 className="animate-spin" /> : <Radio />}
                  Démarrer le live
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Radio className="h-10 w-10 text-muted-foreground" />
              <p className="font-nunito text-sm text-muted-foreground">
                Aucune room pour le moment.
              </p>
              <Button variant="outline" onClick={() => setOpen(true)}>
                Créer la première
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {rooms.map((room) => {
              const isHost = room.host_id === user?.id;
              return (
                <Card key={room.id} className="transition-all hover:shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-poppins text-base">
                        {room.title}
                      </CardTitle>
                      <Badge
                        variant={room.status === 'live' ? 'default' : 'secondary'}
                        className="shrink-0 capitalize"
                      >
                        {room.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {room.max_participants} max
                      </span>
                      <span>•</span>
                      <span>{isHost ? 'Vous êtes l\'hôte' : 'Invité'}</span>
                      {!room.is_public && (
                        <>
                          <span>•</span>
                          <span>Privée</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/live/${room.id}`)}
                      >
                        Rejoindre
                      </Button>
                      {isHost && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnd(room.id)}
                        >
                          Terminer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}