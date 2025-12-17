// Vibration patterns for different celebration types
export const vibrationPatterns = {
  gentle: [50],
  celebration: [100, 50, 100],
  birthday: [50, 100, 50, 100, 200],
  urgent: [200, 100, 200],
} as const;

export type VibrationPattern = keyof typeof vibrationPatterns;
export type SoundType = 'pop' | 'chime' | 'tada';

// Trigger vibration if supported
export const triggerVibration = (pattern: VibrationPattern): boolean => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(vibrationPatterns[pattern]);
    } catch {
      return false;
    }
  }
  return false;
};

// Create audio context lazily
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  
  // Resume if suspended (required for autoplay policies)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
};

// Generate celebration sounds using Web Audio API
export const playCelebrationSound = (type: SoundType): boolean => {
  const ctx = getAudioContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;

    switch (type) {
      case 'pop': {
        // Short, light pop sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      
      case 'chime': {
        // Melodious chime with harmonics
        const frequencies = [523, 659, 784]; // C5, E5, G5 - major chord
        
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4 + i * 0.05);
          
          osc.start(now + i * 0.05);
          osc.stop(now + 0.5 + i * 0.05);
        });
        break;
      }
      
      case 'tada': {
        // Joyful fanfare with ascending notes
        const notes = [
          { freq: 392, time: 0 },      // G4
          { freq: 523, time: 0.1 },    // C5
          { freq: 659, time: 0.2 },    // E5
          { freq: 784, time: 0.3 },    // G5
        ];
        
        notes.forEach(({ freq, time }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + time);
          gain.gain.setValueAtTime(0.25, now + time);
          gain.gain.exponentialRampToValueAtTime(0.01, now + time + 0.2);
          
          osc.start(now + time);
          osc.stop(now + time + 0.25);
        });
        
        // Add a final sustained chord
        const chordFreqs = [523, 659, 784];
        chordFreqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + 0.4);
          gain.gain.setValueAtTime(0.15, now + 0.4);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          
          osc.start(now + 0.4);
          osc.stop(now + 0.9);
        });
        break;
      }
    }
    
    return true;
  } catch {
    return false;
  }
};

export interface CelebrationFeedbackOptions {
  sound?: SoundType;
  vibration?: VibrationPattern;
}

// Main function to trigger celebration feedback
export const triggerCelebrationFeedback = (
  options: CelebrationFeedbackOptions,
  preferences?: { soundEnabled?: boolean; vibrationEnabled?: boolean }
): void => {
  const { sound, vibration } = options;
  const { soundEnabled = true, vibrationEnabled = true } = preferences || {};

  if (sound && soundEnabled) {
    playCelebrationSound(sound);
  }

  if (vibration && vibrationEnabled) {
    triggerVibration(vibration);
  }
};
