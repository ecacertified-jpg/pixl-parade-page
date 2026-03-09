import { useNavigate } from "react-router-dom";
import { Cake, RefreshCw, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BirthdayReminderCard } from "@/components/BirthdayReminderCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDaysUntilBirthday } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface BirthdayReminder {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_relationship?: string;
  days_until: number;
  birthday_date: string;
  reminder_type: string;
  has_active_fund: boolean;
  gift_suggestions: any[];
}

interface ContactWithBirthday {
  id: string;
  name: string;
  birthday?: string | Date | null;
  relationship?: string | null;
}

interface SmartBirthdayRemindersProps {
  hideViewAllButton?: boolean;
  contacts?: ContactWithBirthday[];
}

const fetchBirthdayReminders = async (
  userId: string,
  contacts?: ContactWithBirthday[]
): Promise<BirthdayReminder[]> => {
  // Fetch scheduled notifications
  // @ts-ignore - avoiding TS2589 deep type instantiation
  const { data: notifData } = await supabase
    .from('scheduled_notifications')
    .select('id, metadata, priority, created_at')
    .eq('user_id', userId)
    .eq('notification_type', 'birthday_reminder_with_suggestions')
    .eq('status', 'pending')
    .eq('is_archived', false)
    .order('priority', { ascending: false })
    .limit(5);

  const fromNotifs: BirthdayReminder[] = ((notifData || []) as any[]).map((notif) => ({
    id: notif.id,
    contact_id: notif.metadata?.contact_id,
    contact_name: notif.metadata?.contact_name || 'Contact',
    contact_relationship: notif.metadata?.contact_relationship,
    days_until: notif.metadata?.days_until || 0,
    birthday_date: notif.metadata?.birthday_date,
    reminder_type: notif.metadata?.reminder_type || 'standard',
    has_active_fund: notif.metadata?.has_active_fund || false,
    gift_suggestions: notif.metadata?.gift_suggestions || [],
  }));

  // Build upcoming birthdays from contacts (passed as prop or fetched)
  let contactList = contacts;
  if (!contactList) {
    const { data } = await supabase
      .from('contacts')
      .select('id, name, birthday, relationship')
      .eq('user_id', userId)
      .not('birthday', 'is', null);
    contactList = data || [];
  }

  const notifContactIds = new Set(fromNotifs.map(r => r.contact_id));
  const fromContacts: BirthdayReminder[] = [];

  for (const contact of contactList) {
    if (!contact.birthday || notifContactIds.has(contact.id)) continue;
    const daysUntil = getDaysUntilBirthday(contact.birthday as string);
    if (daysUntil <= 14 && daysUntil >= 0) {
      fromContacts.push({
        id: `contact-${contact.id}`,
        contact_id: contact.id,
        contact_name: contact.name,
        contact_relationship: (contact.relationship as string) || undefined,
        days_until: daysUntil,
        birthday_date: contact.birthday as string,
        reminder_type: daysUntil <= 1 ? 'final' : daysUntil <= 3 ? 'urgent' : 'standard',
        has_active_fund: false,
        gift_suggestions: [],
      });
    }
  }

  return [...fromNotifs, ...fromContacts]
    .sort((a, b) => a.days_until - b.days_until)
    .slice(0, 5);
};

export function SmartBirthdayReminders({ hideViewAllButton = false, contacts }: SmartBirthdayRemindersProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading: loading } = useQuery({
    queryKey: ['birthday-reminders', user?.id],
    queryFn: () => fetchBirthdayReminders(user!.id, contacts),
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['birthday-reminders', user?.id] });
  };

  const handleDismiss = async (notificationId: string) => {
    if (!notificationId.startsWith('contact-')) {
      await supabase
        .from('scheduled_notifications')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', notificationId);
    }
    queryClient.invalidateQueries({ queryKey: ['birthday-reminders', user?.id] });
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!notificationId.startsWith('contact-')) {
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notificationId);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (reminders.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Cake className="h-5 w-5 text-pink-500 flex-shrink-0 animate-pulse" />
          <h2 className="font-semibold text-sm sm:text-base whitespace-nowrap">Anniversaires à venir</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate('/notification-settings')}>
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Paramétrer</span>
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {reminders.map((reminder) => (
          <BirthdayReminderCard
            key={reminder.id}
            notification={reminder}
            onDismiss={handleDismiss}
            onMarkAsRead={handleMarkAsRead}
          />
        ))}
      </div>

      {reminders.length > 0 && !hideViewAllButton && (
        <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard?tab=amis')}>
          Voir tous mes contacts
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </section>
  );
}
