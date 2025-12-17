import { useNotificationSounds } from '@/hooks/useNotificationSounds';

export const NotificationSoundProvider = ({ children }: { children: React.ReactNode }) => {
  useNotificationSounds();
  return <>{children}</>;
};
