import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Music, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BirthdayNotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    metadata?: {
      age?: number;
      can_generate_music?: boolean;
      celebration_emojis?: string[];
    };
  };
  onAction?: () => void;
  onOpenChat?: () => void;
}

export const BirthdayNotificationCard = ({ 
  notification, 
  onAction,
  onOpenChat 
}: BirthdayNotificationCardProps) => {
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Trigger confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#95E1D3', '#F38181'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const generateBirthdayMusic = async () => {
    if (isGeneratingMusic) return;

    setIsGeneratingMusic(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-music', {
        body: { 
          prompt: "Joyeux anniversaire, chanson festive et joyeuse avec des voix qui chantent, célébration joyeuse",
          duration: 10
        }
      });

      if (error) throw error;

      if (data?.audioUrl) {
        setMusicUrl(data.audioUrl);
        toast.success('🎵 Votre chanson d\'anniversaire est prête !');
      }
    } catch (error) {
      console.error('Error generating music:', error);
      toast.error('Impossible de générer la musique pour le moment');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const toggleMusic = () => {
    const audio = document.getElementById('birthday-audio') as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const emojis = notification.metadata?.celebration_emojis || ['🎂', '🎉', '🎁'];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border-2 border-primary/40 shadow-xl">
        {/* Animated background emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {emojis.map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl opacity-20"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: -50 
              }}
              animate={{ 
                y: '120%',
                rotate: 360 
              }}
              transition={{ 
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5 
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="relative p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="p-2 rounded-full bg-primary/20"
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-xl text-foreground mb-1">
                {notification.title}
              </h3>
              {notification.metadata?.age && (
                <p className="text-sm text-muted-foreground">
                  🎂 {notification.metadata.age} ans aujourd'hui !
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <p className="text-base leading-relaxed text-foreground">
            {notification.message}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={onOpenChat}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Parler avec l'assistant
            </Button>

            {notification.metadata?.can_generate_music && !musicUrl && (
              <Button
                onClick={generateBirthdayMusic}
                disabled={isGeneratingMusic}
                variant="outline"
                className="flex-1 border-primary/40 hover:bg-primary/10"
              >
                <Music className="h-4 w-4 mr-2" />
                {isGeneratingMusic ? 'Création...' : 'Générer une chanson'}
              </Button>
            )}

            {musicUrl && (
              <div className="w-full space-y-2">
                <audio id="birthday-audio" src={musicUrl} onEnded={() => setIsPlaying(false)} />
                <Button
                  onClick={toggleMusic}
                  variant="outline"
                  className="w-full border-primary/40 hover:bg-primary/10"
                >
                  <Music className="h-4 w-4 mr-2" />
                  {isPlaying ? '⏸ Pause' : '▶️ Écouter la chanson'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
