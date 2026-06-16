export interface MusicTrack {
  id: string;
  label: string;
  emoji: string;
  url: string;
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "joyeux",
    label: "Joyeux",
    emoji: "🎉",
    url: "https://cdn.pixabay.com/audio/2022/10/25/audio_946bc6c882.mp3",
  },
  {
    id: "tendre",
    label: "Tendre",
    emoji: "💖",
    url: "https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3",
  },
  {
    id: "epique",
    label: "Épique",
    emoji: "✨",
    url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668ca0.mp3",
  },
];

export function getMusicTrack(id?: string | null): MusicTrack | undefined {
  if (!id) return undefined;
  return MUSIC_TRACKS.find((t) => t.id === id);
}