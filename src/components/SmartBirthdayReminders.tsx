import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cake, RefreshCw, ChevronRight, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BirthdayReminderCard } from "@/components/BirthdayReminderCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

interface SmartBirthdayRemindersProps {
  hideViewAllButton?: boolean;
}

export function SmartBirthdayReminders({ hideViewAllButton = false }: SmartBirthdayRemindersProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<BirthdayReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = async () => {
    if (!user) return;
    
    try {
      // Fetch birthday reminder notifications with suggestions
      // @ts-ignore - avoiding TS2589 deep type instantiation
      const { data, error } = await supabase
        .from('scheduled_notifications')
        .select('id, metadata, priority, created_at')
        .eq('user_id', user.id)
        .eq('notification_type', 'birthday_reminder_with_suggestions')
        .eq('status', 'pending')
        .eq('is_archived', false)
        .order('priority', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedReminders: BirthdayReminder[] = ((data || []) as any[]).map((notif) => ({
        id: notif.id,
        contact_id: notif.metadata?.contact_id,
        contact_name: notif.metadata?.contact_name || 'Contact',
        contact_relationship: notif.metadata?.contact_relationship,
        days_until: notif.metadata?.days_until || 0,
        birthday_date: notif.metadata?.birthday_date,
        reminder_type: notif.metadata?.reminder_type || 'standard',
        has_active_fund: notif.metadata?.has_active_fund || false,
        gift_suggestions: notif.metadata?.gift_suggestions || []
      }));

      setReminders(formattedReminders);
    } catch (error) {
      console.error('Error loading birthday reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Also load from contacts directly for immediate birthdays
  const loadUpcomingBirthdays = async () => {
    if (!user) return;
    
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, name, birthday, relationship')
        .eq('user_id', user.id)
        .not('birthday', 'is', null);

      if (error) throw error;

      const today = new Date();
      const upcomingBirthdays: BirthdayReminder[] = [];

      for (const contact of contacts || []) {
        if (!contact.birthday) continue;

        const birthday = new Date(contact.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
        }

        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Only include upcoming birthdays within 14 days that aren't already in notifications
        if (daysUntil <= 14 && daysUntil >= 0) {
          const existingReminder = reminders.find(r => r.contact_id === contact.id);
          if (!existingReminder) {
            upcomingBirthdays.push({
              id: `contact-${contact.id}`,
              contact_id: contact.id,
              contact_name: contact.name,
              contact_relationship: contact.relationship || undefined,
              days_until: daysUntil,
              birthday_date: thisYearBirthday.toISOString(),
              reminder_type: daysUntil <= 1 ? 'final' : daysUntil <= 3 ? 'urgent' : 'standard',
              has_active_fund: false,
              gift_suggestions: []
            });
          }
        }
      }

      // Merge and sort by days until
      const allReminders = [...reminders, ...upcomingBirthdays]
        .sort((a, b) => a.days_until - b.days_until)
        .slice(0, 5);

      if (upcomingBirthdays.length > 0) {
        setReminders(allReminders);
      }
    } catch (error) {
      console.error('Error loading upcoming birthdays:', error);
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user]);

  useEffect(() => {
    if (!loading && reminders.length >= 0) {
      loadUpcomingBirthdays();
    }
  }, [loading, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    await loadUpcomingBirthdays();
    setRefreshing(false);
  };

  const handleDismiss = async (notificationId: string) => {
    // If it's a notification ID (not contact-xxx), archive in database
    if (!notificationId.startsWith('contact-')) {
      await supabase
        .from('scheduled_notifications')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .eq('id', notificationId);
    }
    
    setReminders(prev => prev.filter(r => r.id !== notificationId));
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

  if (reminders.length === 0) {
    return null; // Don't show if no upcoming birthdays
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Cake className="h-5 w-5 text-pink-500 flex-shrink-0 animate-pulse" />
          <h2 className="font-semibold text-sm sm:text-base whitespace-nowrap">Anniversaires à venir</h2>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-2"
            onClick={() => navigate('/notification-settings')}
          >
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
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/dashboard?tab=amis')}
        >
          Voir tous mes contacts
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </section>
  );
}
