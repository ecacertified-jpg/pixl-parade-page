import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileData {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  birthday: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  email?: string;
}

interface ReminderSettings {
  is_enabled: boolean;
  reminder_1_days: number;
  reminder_2_days: number;
  reminder_3_days: number;
  reminder_final_days: number;
  min_completion_threshold: number;
  max_reminders: number;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  email_subject_1: string;
  email_subject_2: string;
  email_subject_3: string;
  email_subject_final: string;
}

const calculateCompletion = (profile: ProfileData) => {
  const fields = [
    { key: 'first_name', weight: 15, filled: !!profile.first_name, label: 'Prénom' },
    { key: 'last_name', weight: 15, filled: !!profile.last_name, label: 'Nom' },
    { key: 'phone', weight: 15, filled: !!profile.phone, label: 'Téléphone' },
    { key: 'city', weight: 15, filled: !!profile.city, label: 'Ville' },
    { key: 'birthday', weight: 15, filled: !!profile.birthday, label: 'Date de naissance' },
    { key: 'avatar_url', weight: 15, filled: !!profile.avatar_url, label: 'Photo de profil' },
    { key: 'bio', weight: 10, filled: !!profile.bio, label: 'Bio' },
  ];

  const score = fields.reduce((acc, f) => acc + (f.filled ? f.weight : 0), 0);
  const missingFields = fields.filter(f => !f.filled).map(f => f.key);
  const missingLabels = fields.filter(f => !f.filled).map(f => f.label);

  return { score, missingFields, missingLabels };
};

const generateEmailHtml = (
  firstName: string,
  completionScore: number,
  missingLabels: string[],
  reminderNumber: number
) => {
  const progressBarWidth = completionScore;
  const progressColor = completionScore >= 80 ? '#22c55e' : completionScore >= 40 ? '#f59e0b' : '#ef4444';
  
  const messages = {
    1: {
      title: "Bienvenue sur JOIE DE VIVRE ! 🎉",
      subtitle: "Complétez votre profil pour recevoir des cadeaux personnalisés",
      cta: "Compléter mon profil"
    },
    2: {
      title: "Vos amis veulent vous gâter ! 💝",
      subtitle: "Un profil complet permet à vos proches de mieux vous connaître",
      cta: "Voir ce que je manque"
    },
    3: {
      title: "Ne manquez pas les moments importants ! 🎂",
      subtitle: "Recevez des rappels pour les anniversaires de vos proches",
      cta: "Gagner mon badge profil complet"
    },
    4: {
      title: "Vous nous manquez ! 💜",
      subtitle: "Dernière chance de profiter de toutes les fonctionnalités",
      cta: "Revenir maintenant"
    }
  };

  const content = messages[reminderNumber as keyof typeof messages] || messages[1];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JOIE DE VIVRE - Complétez votre profil</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7A5DC7 0%, #C084FC 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">JOIE DE VIVRE</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Célébrez chaque moment de bonheur</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1f2937; margin: 0 0 10px; font-size: 24px; font-weight: 600;">${content.title}</h2>
              <p style="color: #6b7280; margin: 0 0 30px; font-size: 16px;">${content.subtitle}</p>
              
              <p style="color: #374151; margin: 0 0 20px; font-size: 16px;">
                Bonjour${firstName ? ` ${firstName}` : ''} ! 👋
              </p>
              
              <!-- Progress bar -->
              <div style="margin: 30px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #374151; font-weight: 500;">Votre profil</span>
                  <span style="color: ${progressColor}; font-weight: 700;">${completionScore}%</span>
                </div>
                <div style="background-color: #e5e7eb; border-radius: 9999px; height: 12px; overflow: hidden;">
                  <div style="background-color: ${progressColor}; width: ${progressBarWidth}%; height: 100%; border-radius: 9999px; transition: width 0.5s;"></div>
                </div>
              </div>
              
              ${missingLabels.length > 0 ? `
              <!-- Missing fields -->
              <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0 0 12px; font-weight: 600; font-size: 14px;">📝 Champs à compléter :</p>
                <ul style="color: #78350f; margin: 0; padding-left: 20px; font-size: 14px;">
                  ${missingLabels.map(label => `<li style="margin: 4px 0;">${label}</li>`).join('')}
                </ul>
              </div>
              ` : ''}
              
              <!-- Badge preview -->
              <div style="text-align: center; margin: 30px 0;">
                <div style="display: inline-block; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 16px 24px;">
                  <span style="font-size: 32px;">🏆</span>
                  <p style="color: #92400e; margin: 8px 0 0; font-size: 12px; font-weight: 600;">Badge "Profil Complet"</p>
                  <p style="color: #b45309; margin: 4px 0 0; font-size: 11px;">À débloquer à 100%</p>
                </div>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://joiedevivre.app/profile/settings" style="display: inline-block; background: linear-gradient(135deg, #7A5DC7 0%, #C084FC 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(122, 93, 199, 0.4);">
                      ${content.cta} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                Vous recevez cet email car vous êtes inscrit sur JOIE DE VIVRE.<br>
                <a href="https://joiedevivre.app/notification-settings" style="color: #7A5DC7; text-decoration: underline;">Se désabonner</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔔 Starting profile completion reminder check...');

    // Get reminder settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('profile_reminder_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Could not fetch reminder settings');
    }

    const settings = settingsData as ReminderSettings;

    if (!settings.is_enabled) {
      console.log('❌ Reminder system is disabled');
      return new Response(JSON.stringify({ message: 'Reminder system is disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all profiles with user emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, phone, city, birthday, avatar_url, bio, created_at');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error('Could not fetch profiles');
    }

    // Get user emails from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error('Could not fetch auth users');
    }

    const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));

    // Get existing reminders
    const { data: existingReminders, error: remindersError } = await supabase
      .from('profile_completion_reminders')
      .select('user_id, reminder_number, sent_at');

    if (remindersError) {
      console.error('Error fetching existing reminders:', remindersError);
    }

    const reminderMap = new Map<string, { maxReminder: number; lastSent: Date }>();
    (existingReminders || []).forEach((r: any) => {
      const existing = reminderMap.get(r.user_id);
      const sentDate = new Date(r.sent_at);
      if (!existing || r.reminder_number > existing.maxReminder) {
        reminderMap.set(r.user_id, { maxReminder: r.reminder_number, lastSent: sentDate });
      }
    });

    const now = new Date();
    const reminderSchedule = [
      { number: 1, days: settings.reminder_1_days, subject: settings.email_subject_1 },
      { number: 2, days: settings.reminder_2_days, subject: settings.email_subject_2 },
      { number: 3, days: settings.reminder_3_days, subject: settings.email_subject_3 },
      { number: 4, days: settings.reminder_final_days, subject: settings.email_subject_final },
    ];

    let emailsSent = 0;
    let inAppNotificationsSent = 0;
    const errors: string[] = [];

    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    for (const profile of (profiles || [])) {
      const { score, missingFields, missingLabels } = calculateCompletion(profile as ProfileData);

      // Skip if profile is complete enough
      if (score >= settings.min_completion_threshold) {
        continue;
      }

      const email = emailMap.get(profile.user_id);
      const accountAgeDays = Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const existingData = reminderMap.get(profile.user_id);
      const nextReminderNumber = existingData ? existingData.maxReminder + 1 : 1;

      // Skip if max reminders reached
      if (nextReminderNumber > settings.max_reminders) {
        continue;
      }

      // Find the right reminder to send
      const scheduledReminder = reminderSchedule.find(r => r.number === nextReminderNumber);
      if (!scheduledReminder) continue;

      // Check if it's time for this reminder
      if (accountAgeDays < scheduledReminder.days) {
        continue;
      }

      console.log(`📧 Sending reminder ${nextReminderNumber} to ${email} (score: ${score}%)`);

      // Send email if enabled and we have Resend
      if (settings.email_enabled && resend && email) {
        try {
          const emailHtml = generateEmailHtml(
            profile.first_name || '',
            score,
            missingLabels,
            nextReminderNumber
          );

          await resend.emails.send({
            from: 'JOIE DE VIVRE <notifications@joiedevivre.app>',
            to: [email],
            subject: scheduledReminder.subject,
            html: emailHtml,
          });

          emailsSent++;
        } catch (emailError) {
          console.error(`Error sending email to ${email}:`, emailError);
          errors.push(`Email to ${email}: ${emailError}`);
        }
      }

      // Create in-app notification if enabled
      if (settings.in_app_enabled) {
        const notificationMessages = {
          1: "Complétez votre profil pour recevoir des cadeaux personnalisés ! 🎁",
          2: "Vos amis veulent vous offrir des cadeaux ! Mettez à jour votre profil. 💝",
          3: "Ne manquez pas les anniversaires de vos proches ! Complétez votre profil. 🎂",
          4: "Dernière chance de compléter votre profil et débloquer toutes les fonctionnalités ! ⏰",
        };

        try {
          await supabase.from('notifications').insert({
            user_id: profile.user_id,
            title: 'Profil incomplet',
            message: notificationMessages[nextReminderNumber as keyof typeof notificationMessages] || notificationMessages[1],
            type: 'profile_reminder',
            action_url: '/profile/settings',
            metadata: {
              reminder_number: nextReminderNumber,
              completion_score: score,
              missing_fields: missingFields
            }
          });

          inAppNotificationsSent++;
        } catch (notifError) {
          console.error(`Error creating notification for ${profile.user_id}:`, notifError);
          errors.push(`Notification for ${profile.user_id}: ${notifError}`);
        }
      }

      // Record the reminder
      try {
        await supabase.from('profile_completion_reminders').insert({
          user_id: profile.user_id,
          reminder_number: nextReminderNumber,
          completion_at_send: score,
          missing_fields: missingFields,
          channel: settings.email_enabled && resend ? 'email' : 'in_app',
        });
      } catch (recordError) {
        console.error(`Error recording reminder for ${profile.user_id}:`, recordError);
        errors.push(`Record for ${profile.user_id}: ${recordError}`);
      }
    }

    console.log(`✅ Profile reminder check complete. Emails: ${emailsSent}, In-app: ${inAppNotificationsSent}`);

    return new Response(JSON.stringify({
      success: true,
      emailsSent,
      inAppNotificationsSent,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in profile-completion-reminder:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
