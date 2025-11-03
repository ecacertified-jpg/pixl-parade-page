import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily notifications check...');
    
    const notificationsCreated = {
      birthdays: 0,
      events: 0,
      deadlines: 0,
    };

    // 1. Check upcoming birthdays (7-10 days before)
    const today = new Date();
    const startRange = new Date(today);
    startRange.setDate(startRange.getDate() + 7);
    const endRange = new Date(today);
    endRange.setDate(endRange.getDate() + 10);

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, user_id, name, birthday')
      .not('birthday', 'is', null);

    if (contactsError) throw contactsError;

    for (const contact of contacts || []) {
      if (!contact.birthday) continue;

      // Calculate this year's birthday
      const birthday = new Date(contact.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      // If birthday already passed this year, check next year
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(thisYearBirthday.getFullYear() + 1);
      }

      const daysUntilBirthday = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Send notification if birthday is 7-10 days away
      if (daysUntilBirthday >= 7 && daysUntilBirthday <= 10) {
        // Check if notification already sent for this period
        const { data: existingNotif } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', contact.user_id)
          .eq('notification_type', 'birthday_reminder')
          .gte('created_at', new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (!existingNotif) {
          await supabase
            .from('scheduled_notifications')
            .insert({
              user_id: contact.user_id,
              notification_type: 'birthday_reminder',
              title: `🎂 Anniversaire de ${contact.name} dans ${daysUntilBirthday} jours`,
              message: `L'anniversaire de ${contact.name} approche ! C'est le moment parfait pour créer une cotisation ou offrir un cadeau.`,
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['push', 'in_app', 'email'],
              metadata: {
                contact_id: contact.id,
                contact_name: contact.name,
                days_until: daysUntilBirthday,
                birthday_date: thisYearBirthday.toISOString(),
              },
            });
          
          notificationsCreated.birthdays++;
        }
      }
    }

    // 2. Check upcoming events (7-10 days before)
    const { data: events, error: eventsError } = await supabase
      .from('contact_events')
      .select(`
        id,
        title,
        event_type,
        event_date,
        contact_id,
        contacts (
          user_id,
          name
        )
      `)
      .gte('event_date', startRange.toISOString().split('T')[0])
      .lte('event_date', endRange.toISOString().split('T')[0]);

    if (eventsError) throw eventsError;

    for (const event of events || []) {
      const eventDate = new Date(event.event_date);
      const daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilEvent >= 7 && daysUntilEvent <= 10) {
        const { data: existingNotif } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', event.contacts.user_id)
          .eq('notification_type', 'event_reminder')
          .gte('created_at', new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

        if (!existingNotif) {
          await supabase
            .from('scheduled_notifications')
            .insert({
              user_id: event.contacts.user_id,
              notification_type: 'event_reminder',
              title: `📅 ${event.title} dans ${daysUntilEvent} jours`,
              message: `L'événement "${event.title}" de ${event.contacts.name} arrive bientôt. Préparez quelque chose de spécial !`,
              scheduled_for: new Date().toISOString(),
              delivery_methods: ['push', 'in_app', 'email'],
              metadata: {
                event_id: event.id,
                event_type: event.event_type,
                contact_name: event.contacts.name,
                days_until: daysUntilEvent,
              },
            });
          
          notificationsCreated.events++;
        }
      }
    }

    // 3. Check funds approaching deadline (3 and 7 days before)
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: funds, error: fundsError } = await supabase
      .from('collective_funds')
      .select('id, creator_id, title, deadline_date, target_amount, current_amount')
      .eq('status', 'active')
      .not('deadline_date', 'is', null)
      .lte('deadline_date', sevenDaysFromNow.toISOString().split('T')[0]);

    if (fundsError) throw fundsError;

    for (const fund of funds || []) {
      if (!fund.deadline_date) continue;

      const deadlineDate = new Date(fund.deadline_date);
      const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Get all contributors
      const { data: contributors } = await supabase
        .from('fund_contributions')
        .select('contributor_id')
        .eq('fund_id', fund.id);

      const uniqueContributors = [...new Set(contributors?.map(c => c.contributor_id) || [])];

      // 7 days warning
      if (daysUntilDeadline === 7) {
        for (const contributorId of uniqueContributors) {
          const { data: existingNotif } = await supabase
            .from('scheduled_notifications')
            .select('id')
            .eq('user_id', contributorId)
            .eq('notification_type', 'fund_deadline_warning')
            .eq('metadata->>fund_id', fund.id)
            .maybeSingle();

          if (!existingNotif) {
            const progress = Math.round((fund.current_amount / fund.target_amount) * 100);
            await supabase
              .from('scheduled_notifications')
              .insert({
                user_id: contributorId,
                notification_type: 'fund_deadline_warning',
                title: '⚠️ Cotisation bientôt expirée',
                message: `La cotisation "${fund.title}" expire dans 7 jours. Objectif: ${progress}% atteint.`,
                scheduled_for: new Date().toISOString(),
                delivery_methods: ['push', 'in_app', 'email'],
                metadata: {
                  fund_id: fund.id,
                  days_remaining: 7,
                  progress_percentage: progress,
                },
              });
            
            notificationsCreated.deadlines++;
          }
        }
      }

      // 3 days final warning
      if (daysUntilDeadline === 3) {
        for (const contributorId of uniqueContributors) {
          const { data: existingNotif } = await supabase
            .from('scheduled_notifications')
            .select('id')
            .eq('user_id', contributorId)
            .eq('notification_type', 'fund_deadline_final_warning')
            .eq('metadata->>fund_id', fund.id)
            .maybeSingle();

          if (!existingNotif) {
            await supabase
              .from('scheduled_notifications')
              .insert({
                user_id: contributorId,
                notification_type: 'fund_deadline_final_warning',
                title: '🚨 URGENT: Cotisation expire dans 3 jours!',
                message: `Dernière chance pour la cotisation "${fund.title}".`,
                scheduled_for: new Date().toISOString(),
                delivery_methods: ['push', 'in_app', 'email', 'sms'],
                metadata: {
                  fund_id: fund.id,
                  days_remaining: 3,
                },
              });
            
            notificationsCreated.deadlines++;
          }
        }
      }
    }

    console.log('Daily notifications check completed:', notificationsCreated);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsCreated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[SERVER] Error in daily-notifications-check:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue lors de la vérification des notifications',
        code: 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
