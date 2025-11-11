import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Templates de messages personnalisés selon l'âge
function getBirthdayMessagesByAge(age: number | null, firstName: string) {
  // Messages pour les âges marquants
  const milestoneMessages: Record<number, string[]> = {
    18: [
      `🎓 Joyeux 18 ans ${firstName} ! Bienvenue dans le monde des adultes ! Que cette année soit remplie de nouvelles aventures, de découvertes passionnantes et de rêves réalisés ! 🎉✨`,
      `🌟 18 ans ${firstName} ! C'est un tournant majeur de ta vie ! Toute l'équipe JOIE DE VIVRE te souhaite le meilleur pour cette nouvelle étape pleine de promesses ! 🎂🎈`,
      `🎊 Bon anniversaire ${firstName}, tu as 18 ans ! L'avenir t'appartient ! Que cette année t'apporte réussite, bonheur et moments inoubliables ! 🎁✨`
    ],
    20: [
      `🎉 Joyeux 20 ans ${firstName} ! Bienvenue dans tes années 20 ! Que cette décennie soit remplie d'aventures, d'amitié et de succès ! 🎂✨`,
      `🌈 20 ans ${firstName} ! Le début d'une nouvelle décennie extraordinaire ! JOIE DE VIVRE célèbre avec toi ce cap magnifique ! 🎊🎁`,
      `✨ Bon anniversaire ${firstName}, 20 ans aujourd'hui ! Que tes rêves se réalisent et que chaque jour t'apporte du bonheur ! 🎈🎉`
    ],
    21: [
      `🎊 Joyeux 21 ans ${firstName} ! L'âge de la maturité et des nouvelles opportunités ! Que cette année soit exceptionnelle ! 🎂🌟`,
      `🎉 21 ans ${firstName} ! Un âge symbolique pour une année magique ! Toute l'équipe te souhaite le meilleur ! 🎁✨`,
      `🌟 Bon anniversaire ${firstName}, tu as 21 ans ! Que cette année t'apporte sagesse, bonheur et réalisations ! 🎈🎊`
    ],
    25: [
      `🎉 Joyeux quart de siècle ${firstName} ! 25 ans, c'est magnifique ! Que cette année soit remplie de succès et de moments précieux ! 🎂✨`,
      `🌟 25 ans ${firstName} ! Un âge parfait pour réaliser tes ambitions ! JOIE DE VIVRE célèbre avec toi cette étape importante ! 🎊🎁`,
      `🎈 Bon anniversaire ${firstName}, 25 ans aujourd'hui ! Que cette nouvelle année t'apporte tout ce que tu désires ! 🎉💫`
    ],
    30: [
      `🎊 Joyeux 30 ans ${firstName} ! Bienvenue dans la trentaine ! Une décennie de sagesse, de succès et d'épanouissement t'attend ! 🎂🌟`,
      `✨ 30 ans ${firstName} ! L'âge de la maturité et de l'accomplissement ! Que cette année soit exceptionnelle sur tous les plans ! 🎉🎁`,
      `🎈 Bon anniversaire ${firstName}, tu entres dans tes 30 ans ! Que cette décennie soit la plus belle de ta vie ! 🎊💖`
    ],
    40: [
      `🎉 Joyeux 40 ans ${firstName} ! La vie commence à 40 ans ! Que cette année soit remplie de sagesse, de bonheur et de nouvelles aventures ! 🎂✨`,
      `🌟 40 ans ${firstName} ! Un âge d'or pour profiter de la vie pleinement ! JOIE DE VIVRE célèbre avec toi ce cap magnifique ! 🎊🎁`,
      `🎈 Bon anniversaire ${firstName}, 40 ans aujourd'hui ! Que cette année t'apporte sérénité, joie et accomplissement ! 🎉💫`
    ],
    50: [
      `🎊 Joyeux demi-siècle ${firstName} ! 50 ans de vie, d'expériences et de souvenirs précieux ! Que cette année soit mémorable ! 🎂🌟`,
      `✨ 50 ans ${firstName} ! L'âge de la sagesse et de la plénitude ! Toute l'équipe te souhaite une année exceptionnelle ! 🎉🎁`,
      `🎈 Bon anniversaire ${firstName}, 50 ans aujourd'hui ! Que cette nouvelle décennie soit la plus épanouissante ! 🎊💖`
    ],
    60: [
      `🎉 Joyeux 60 ans ${firstName} ! Six décennies de bonheur, de sagesse et d'amour ! Que cette année soit remplie de joie et de paix ! 🎂✨`,
      `🌟 60 ans ${firstName} ! L'âge de la sérénité et du bonheur bien mérité ! JOIE DE VIVRE célèbre avec toi ! 🎊🎁`,
      `🎈 Bon anniversaire ${firstName}, 60 ans aujourd'hui ! Que cette année t'apporte santé, bonheur et moments précieux ! 🎉💫`
    ],
    70: [
      `🎊 Joyeux 70 ans ${firstName} ! Sept décennies d'une vie extraordinaire ! Que cette année soit douce et remplie d'amour ! 🎂🌟`,
      `✨ 70 ans ${firstName} ! L'âge de la sagesse suprême ! Toute l'équipe te souhaite santé, bonheur et sérénité ! 🎉🎁`,
      `🎈 Bon anniversaire ${firstName}, 70 ans aujourd'hui ! Que cette année soit bénie et paisible ! 🎊💖`
    ],
    80: [
      `🎉 Joyeux 80 ans ${firstName} ! Huit décennies de vie merveilleuse ! Que cette année soit remplie de douceur et d'amour ! 🎂✨`,
      `🌟 80 ans ${firstName} ! Un trésor de souvenirs et de sagesse ! JOIE DE VIVRE t'honore en ce jour spécial ! 🎊🎁`,
      `🎈 Bon anniversaire ${firstName}, 80 ans aujourd'hui ! Que cette année t'apporte paix, santé et bonheur ! 🎉💫`
    ]
  };

  // Messages génériques par tranche d'âge
  const genericMessagesByRange = {
    // 1-17 ans - Enfants et adolescents
    young: [
      `🎉 Joyeux anniversaire ${firstName} ! Profite bien de ta journée spéciale entouré(e) de ceux que tu aimes ! 🎂🎈`,
      `🎊 Bon anniversaire ${firstName} ! Que cette nouvelle année t'apporte plein de bonheur et de belles surprises ! 🎁✨`,
      `🎈 C'est ta fête ${firstName} ! JOIE DE VIVRE te souhaite une journée magique et inoubliable ! 🎉🎂`
    ],
    // 18-29 ans - Jeunes adultes
    youngAdult: [
      `🎉 Joyeux anniversaire ${firstName} ! Que cette année t'apporte succès, bonheur et réalisation de tes rêves ! 🎂✨`,
      `🎊 Bon anniversaire ${firstName} ! Continue à briller et à conquérir le monde ! JOIE DE VIVRE célèbre avec toi ! 🎁🌟`,
      `🎈 C'est ton jour ${firstName} ! Que cette nouvelle année soit remplie d'aventures et de moments précieux ! 🎉💫`
    ],
    // 30-49 ans - Adultes
    adult: [
      `🎉 Joyeux anniversaire ${firstName} ! Que cette année t'apporte épanouissement, bonheur et succès dans tous tes projets ! 🎂✨`,
      `🎊 Bon anniversaire ${firstName} ! Profite de cette journée spéciale avec tes proches ! JOIE DE VIVRE célèbre avec toi ! 🎁🌟`,
      `🎈 C'est ta fête ${firstName} ! Que cette nouvelle année soit remplie de joie, de santé et de réalisations ! 🎉💖`
    ],
    // 50-69 ans - Seniors
    senior: [
      `🎉 Joyeux anniversaire ${firstName} ! Que cette année t'apporte sérénité, bonheur et moments précieux avec tes proches ! 🎂✨`,
      `🎊 Bon anniversaire ${firstName} ! Profite pleinement de ta journée spéciale ! JOIE DE VIVRE célèbre avec toi ! 🎁🌟`,
      `🎈 C'est ton jour ${firstName} ! Que cette nouvelle année soit douce et remplie de bonheur ! 🎉💖`
    ],
    // 70+ ans - Aînés
    elder: [
      `🎉 Joyeux anniversaire ${firstName} ! Que cette journée soit douce et remplie de l'amour de tes proches ! 🎂✨`,
      `🎊 Bon anniversaire ${firstName} ! JOIE DE VIVRE t'honore en ce jour spécial et te souhaite santé et bonheur ! 🎁🌟`,
      `🎈 C'est ta fête ${firstName} ! Que cette année t'apporte paix, joie et sérénité ! 🎉💖`
    ]
  };

  // Si l'âge correspond à un âge marquant
  if (age && milestoneMessages[age]) {
    return milestoneMessages[age];
  }

  // Sinon, utiliser les messages par tranche d'âge
  if (!age) {
    return genericMessagesByRange.adult; // Par défaut
  }

  if (age < 18) {
    return genericMessagesByRange.young;
  } else if (age < 30) {
    return genericMessagesByRange.youngAdult;
  } else if (age < 50) {
    return genericMessagesByRange.adult;
  } else if (age < 70) {
    return genericMessagesByRange.senior;
  } else {
    return genericMessagesByRange.elder;
  }
}

// Fonction pour obtenir les emojis selon l'âge
function getCelebrationEmojisByAge(age: number | null): string[] {
  if (!age) {
    return ['🎂', '🎉', '🎁', '🎈', '✨', '🎊'];
  }

  // Emojis spéciaux pour les âges marquants
  if (age === 18) {
    return ['🎓', '🎉', '🎁', '🎈', '✨', '🌟', '🎊'];
  } else if (age === 21) {
    return ['🎊', '🎉', '🎁', '🥂', '✨', '🌟', '🎈'];
  } else if (age === 30 || age === 40 || age === 50) {
    return ['🎂', '🎉', '🎁', '🎈', '✨', '🎊', '💎', '🌟'];
  } else if (age >= 60) {
    return ['🎂', '🎉', '🎁', '🎈', '✨', '💖', '🌺', '🕊️'];
  } else if (age < 18) {
    return ['🎂', '🎉', '🎁', '🎈', '🎨', '🎪', '🎯', '⚽'];
  }

  return ['🎂', '🎉', '🎁', '🎈', '✨', '🎊'];
}

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

        // Record birthday celebration in history
        const currentYear = today.getFullYear();
        const { error: celebrationError } = await supabase
          .from('birthday_celebrations')
          .insert({
            user_id: user.id,
            celebration_year: currentYear,
            age_at_celebration: age,
            milestone_age: age ? [18, 20, 21, 25, 30, 40, 50, 60, 70, 80].includes(age) : false
          });

        if (celebrationError && celebrationError.code !== '23505') { // Ignore duplicate key error
          console.error(`Error recording celebration for user ${user.id}:`, celebrationError);
        }

        // Get user's celebration count and update profile
        const { count: celebrationsCount } = await supabase
          .from('birthday_celebrations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const totalCelebrations = celebrationsCount || 0;

        // Get first birthday on platform
        const { data: firstCelebration } = await supabase
          .from('birthday_celebrations')
          .select('celebrated_at')
          .eq('user_id', user.id)
          .order('celebrated_at', { ascending: true })
          .limit(1)
          .single();

        // Calculate badge level (0-5)
        let badgeLevel = 0;
        let badgeName = '🎂 Nouveau';
        if (totalCelebrations >= 10) {
          badgeLevel = 5;
          badgeName = '💎 Diamant';
        } else if (totalCelebrations >= 5) {
          badgeLevel = 4;
          badgeName = '⭐ Platine';
        } else if (totalCelebrations >= 3) {
          badgeLevel = 3;
          badgeName = '🏆 Or';
        } else if (totalCelebrations >= 2) {
          badgeLevel = 2;
          badgeName = '🥈 Argent';
        } else if (totalCelebrations >= 1) {
          badgeLevel = 1;
          badgeName = '🥉 Bronze';
        }

        // Update profile with badge info
        await supabase
          .from('profiles')
          .update({
            total_birthdays_celebrated: totalCelebrations,
            birthday_badge_level: badgeLevel,
            first_birthday_on_platform: firstCelebration?.celebrated_at 
              ? new Date(firstCelebration.celebrated_at).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0]
          })
          .eq('user_id', user.id);

        // Check if user earned a new badge
        const earnedNewBadge = totalCelebrations === 1 || totalCelebrations === 2 || 
                               totalCelebrations === 3 || totalCelebrations === 5 || 
                               totalCelebrations === 10;

        // Generate personalized AI message based on age
        const firstName = user.birthday ? (await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', user.id)
          .single()).data?.first_name || 'cher utilisateur' : 'cher utilisateur';
          
        const messages = getBirthdayMessagesByAge(age, firstName);
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const celebrationEmojis = getCelebrationEmojisByAge(age);
        
        // Déterminer si c'est un âge marquant
        const milestoneAges = [18, 20, 21, 25, 30, 40, 50, 60, 70, 80];
        const isMilestone = age ? milestoneAges.includes(age) : false;

        // Create birthday notification
        const { error: notifError } = await supabase
          .from('scheduled_notifications')
          .insert({
            user_id: user.id,
            notification_type: 'birthday_wish_ai',
            title: age 
              ? `🎉 Joyeux ${age} ans ${firstName} !`
              : `🎉 Joyeux anniversaire ${firstName} !`,
            message: randomMessage,
            priority_score: isMilestone ? 110 : 100, // Higher priority for milestones
            scheduled_for: new Date().toISOString(),
            metadata: {
              age: age,
              is_birthday: true,
              is_milestone: isMilestone,
              can_generate_music: true,
              celebration_emojis: celebrationEmojis,
              // Badge information
              loyalty_badge: {
                level: badgeLevel,
                name: badgeName,
                total_celebrations: totalCelebrations,
                earned_new_badge: earnedNewBadge,
                first_birthday_year: firstCelebration?.celebrated_at 
                  ? new Date(firstCelebration.celebrated_at).getFullYear()
                  : currentYear
              }
            }
          });

        if (notifError) {
          console.error(`Error creating notification for user ${user.id}:`, notifError);
        } else {
          console.log(`Birthday notification created for ${firstName} (${user.id}) - Badge: ${badgeName} (${totalCelebrations} anniversaires)`);
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
