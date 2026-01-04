import { useFriendsCircleReminder } from '@/hooks/useFriendsCircleReminder';
import { FriendsCircleReminderCard } from '@/components/FriendsCircleReminderCard';

/**
 * Global sticky banner that appears on all pages when user needs to complete their friends circle.
 * This component should be placed at the top of the main layout, after the header.
 */
export function GlobalFriendsCircleReminder() {
  const { shouldShowReminder, isLoading, isProfileComplete } = useFriendsCircleReminder();

  // Don't show anything while loading or if profile is not complete
  if (isLoading || !isProfileComplete) return null;

  // Don't show if reminder is not needed
  if (!shouldShowReminder) return null;

  return (
    <div className="sticky top-0 z-40">
      <FriendsCircleReminderCard compact />
    </div>
  );
}
