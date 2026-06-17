import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TokenResponse {
  token: string;
  wsUrl: string;
  identity: string;
  role: string;
  roomName: string;
}

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<TokenResponse | null>(null);
  const [title, setTitle] = useState<string>('Live');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !user) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: room, error: roomErr } = await supabase
          .from('live_rooms')
          .select('title')
          .eq('id', roomId)
          .maybeSingle();
        if (roomErr) throw roomErr;
        if (room?.title) setTitle(room.title);

        const { data: tokenData, error: fnErr } = await supabase.functions.invoke(
          'livekit-token',
          { body: { roomId } },
        );
        if (fnErr) throw fnErr;
        if (!tokenData?.token) throw new Error('Aucun token reçu');
        if (!cancelled) setData(tokenData as TokenResponse);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Erreur inconnue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, user]);

  const handleLeave = async () => {
    if (roomId && user) {
      await supabase
        .from('live_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <h1 className="font-poppins text-xl font-semibold text-foreground">
          Impossible de rejoindre le live
        </h1>
        <p className="text-sm text-muted-foreground">{error ?? 'Token indisponible'}</p>
        <Button onClick={() => navigate(-1)}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="font-poppins text-base font-semibold text-foreground">{title}</h1>
        <Button size="sm" variant="destructive" onClick={handleLeave}>
          Quitter
        </Button>
      </header>
      <div className="flex-1" data-lk-theme="default">
        <LiveKitRoom
          token={data.token}
          serverUrl={data.wsUrl}
          connect
          video
          audio
          onDisconnected={handleLeave}
          style={{ height: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}