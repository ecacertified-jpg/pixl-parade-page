import { useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { 
  playCelebrationSound, 
  triggerVibration, 
  type SoundType, 
  type VibrationPattern 
} from "@/utils/celebrationFeedback";
import { cn } from "@/lib/utils";

interface CelebrationTestSectionProps {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const soundTests = [
  { type: 'pop' as SoundType, label: 'Pop', description: 'Court et léger', icon: '🎈' },
  { type: 'chime' as SoundType, label: 'Carillon', description: 'Mélodie douce', icon: '🔔' },
  { type: 'tada' as SoundType, label: 'Tada!', description: 'Fanfare joyeuse', icon: '🎉' },
];

const vibrationTests = [
  { type: 'gentle' as VibrationPattern, label: 'Douce', description: '50ms', icon: '💫' },
  { type: 'celebration' as VibrationPattern, label: 'Festive', description: '250ms', icon: '🎊' },
  { type: 'birthday' as VibrationPattern, label: 'Anniversaire', description: '500ms', icon: '🎂' },
  { type: 'urgent' as VibrationPattern, label: 'Urgente', description: '500ms', icon: '⚡' },
];

export function CelebrationTestSection({ soundEnabled, vibrationEnabled }: CelebrationTestSectionProps) {
  const [testingSound, setTestingSound] = useState<SoundType | null>(null);
  const [testingVibration, setTestingVibration] = useState<VibrationPattern | null>(null);

  const handleTestSound = async (type: SoundType) => {
    if (!soundEnabled) {
      toast.info("Activez les sons pour tester");
      return;
    }
    
    setTestingSound(type);
    playCelebrationSound(type);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setTestingSound(null);
    toast.success(`Son "${type}" joué !`);
  };

  const handleTestVibration = async (type: VibrationPattern) => {
    if (!vibrationEnabled) {
      toast.info("Activez les vibrations pour tester");
      return;
    }
    
    setTestingVibration(type);
    const success = triggerVibration(type);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    setTestingVibration(null);
    
    if (success) {
      toast.success(`Vibration "${type}" déclenchée !`);
    } else {
      toast.info("Vibrations non supportées sur cet appareil");
    }
  };

  const handleTestAll = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    if (soundEnabled) {
      playCelebrationSound('tada');
    }
    
    if (vibrationEnabled) {
      triggerVibration('celebration');
    }
    
    toast.success("🎉 Célébration complète !");
  };

  return (
    <div className="space-y-4">
      <Separator />
      
      {/* Test des sons */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Tester les sons</Label>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {soundTests.map((test) => (
            <motion.div
              key={test.type}
              animate={testingSound === test.type ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={() => handleTestSound(test.type)}
                disabled={!soundEnabled}
                className={cn(
                  "flex flex-col h-auto py-3 w-full transition-all",
                  testingSound === test.type && "ring-2 ring-primary ring-offset-2",
                  !soundEnabled && "opacity-50"
                )}
              >
                <span className="text-xl mb-1">{test.icon}</span>
                <span className="font-medium text-xs">{test.label}</span>
                <span className="text-[10px] text-muted-foreground">{test.description}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Info mobile */}
      <Alert className="bg-muted/50">
        <Smartphone className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Les vibrations fonctionnent uniquement sur mobile
        </AlertDescription>
      </Alert>

      {/* Test des vibrations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Tester les vibrations</Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {vibrationTests.map((test) => (
            <motion.div
              key={test.type}
              animate={testingVibration === test.type ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={() => handleTestVibration(test.type)}
                disabled={!vibrationEnabled}
                className={cn(
                  "flex flex-col h-auto py-3 w-full transition-all",
                  testingVibration === test.type && "ring-2 ring-primary ring-offset-2",
                  !vibrationEnabled && "opacity-50"
                )}
              >
                <span className="text-xl mb-1">{test.icon}</span>
                <span className="font-medium text-xs">{test.label}</span>
                <span className="text-[10px] text-muted-foreground">{test.description}</span>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Test complet */}
      <Button
        onClick={handleTestAll}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        disabled={!soundEnabled && !vibrationEnabled}
      >
        🎉 Tester la célébration complète
      </Button>
    </div>
  );
}
