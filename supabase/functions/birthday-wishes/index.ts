import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting birthday wishes check...');

    // Get today's date (MM-DD format)
    const today = new Date();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    
    console.log(`Checking birthdays for: ${todayMonth}-${todayDay}`);

    // Find all users whose birthday is today
    const { data: birthdayUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, birthday')
      .not('birthday', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`Found ${birthdayUsers?.length || 0} users with birthdays`);

    const todayBirthdays = birthdayUsers?.filter(user => {
      if (!user.birthday) return false;
      const birthday = new Date(user.birthday);
      const birthMonth = String(birthday.getMonth() + 1).padStart(2, '0');
      const birthDay = String(birthday.getDate()).padStart(2, '0');
      return birthMonth === todayMonth && birthDay === todayDay;
    }) || [];

    console.log(`${todayBirthdays.length} users have birthdays today`);

    // Process each birthday user
    for (const user of todayBirthdays) {
      try {
        // Calculate age if birth year is available
        let age = null;
        if (user.birthday) {
          const birthYear = new Date(user.birthday).getFullYear();
          if (birthYear && birthYear > 1900) {
            age = today.getFullYear() - birthYear;
          }
        }

        // Generate personalized AI message
        const firstName = user.full_name?.split(' ')[0] || 'cher utilisateur';
        const ageText = age ? ` vos ${age} ans` : ' votre anniversaire';
        
        const messages = [
          `🎉 Joyeux anniversaire ${firstName} ! Toute l'équipe JOIE DE VIVRE vous souhaite une merveilleuse journée remplie de bonheur et de surprises ! 🎂✨`,
          `🎈 C'est votre jour spécial ${firstName} ! Que cette nouvelle année soit pleine de joie, de réussite et de moments inoubliables ! 🎁`,
          `🎊 Bon anniversaire ${firstName} ! Profitez de cette journée magique entouré(e) de vos proches. JOIE DE VIVRE célèbre${ageText} avec vous ! 🎂`,
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        // Check if notification already exists for today
        const { data: existingNotif } = await supabase
          .from('scheduled_notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('notification_type', 'birthday_wish_ai')
          .gte('created_at', new Date(today.setHours(0, 0, 0, 0)).toISOString())
          .single();

        if (existingNotif) {
          console.log(`Notification already exists for user ${user.id}`);
          continue;
        }

        // Create birthday notification
        const { error: notifError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            notification_type: 'birthday_wish_ai',
            title: `🎉 Joyeux anniversaire ${firstName} !`,
            message: randomMessage,
            priority_score: 100, // Highest priority
            scheduled_for: new Date().toISOString(),
            metadata: {
              age: age,
              is_birthday: true,
              can_generate_music: true,
              celebration_emojis: ['🎂', '🎉', '🎁', '🎈', '✨', '🎊']
            }
          });

        if (notifError) {
          console.error(`Error creating notification for user ${user.id}:`, notifError);
        } else {
          console.log(`Birthday notification created for ${firstName} (${user.id})`);
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        birthdaysProcessed: todayBirthdays.length,
        message: `Processed ${todayBirthdays.length} birthday(s)` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Birthday wishes error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
