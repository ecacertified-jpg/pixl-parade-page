import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reminder schedule configuration
const REMINDER_SCHEDULE = [
  { daysBefore: 14, type: 'early', title: '📅 Dans 2 semaines', priority: 'low' },
  { daysBefore: 7, type: 'standard', title: '🎂 Dans 1 semaine', priority: 'medium' },
  { daysBefore: 3, type: 'urgent', title: '⏰ Dans 3 jours', priority: 'high' },
  { daysBefore: 1, type: 'final', title: '🚨 C\'est demain !', priority: 'critical' },
];

// Verify service role authorization for background tasks
function verifyServiceAuth(req: Request): boolean {
  const authHeader = req.headers.get('authorization');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!authHeader || !serviceKey) {
    return false;
  }
  
  const token = authHeader.replace('Bearer ', '');
  return token === serviceKey;
}

// Generate quick AI gift suggestions for a contact
async function generateQuickSuggestions(
  supabase: any,
  userId: string,
  contact: any,
  budgetRange: { min: number; max: number }
): Promise<any[]> {
  try {
    // Get available products within budget
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, currency, image_url, categories(name, name_fr)')
      .eq('is_active', true)
      .gte('price', budgetRange.min)
      .lte('price', budgetRange.max)
      .limit(20);

    if (productsError || !products?.length) {
      console.log('No products found for suggestions');
      return [];
    }

    // Get user's past gifts to this contact to avoid duplicates
    const { data: pastGifts } = await supabase
      .from('gifts')
      .select('product_id, gift_name')
      .eq('giver_id', userId)
      .or(`receiver_name.ilike.%${contact.name}%`);

    const pastProductIds = new Set(pastGifts?.map((g: any) => g.product_id) || []);

    // Filter out past gifts and score products
    const eligibleProducts = products.filter((p: any) => !pastProductIds.has(p.id));
    
    // Simple scoring based on relationship and category relevance
    const scoredProducts = eligibleProducts.map((product: any) => {
      let score = Math.random() * 30 + 70; // Base score 70-100
      
      // Boost for certain categories based on relationship
      const relationship = contact.relationship?.toLowerCase() || '';
      const category = product.categories?.name?.toLowerCase() || '';
      
      if (relationship.includes('famille') || relationship.includes('family')) {
        if (category.includes('bijou') || category.includes('jewelry')) score += 10;
      }
      if (relationship.includes('ami') || relationship.includes('friend')) {
        if (category.includes('tech') || category.includes('mode')) score += 10;
      }
      
      return {
        productId: product.id,
        productName: product.name,
        price: product.price,
        currency: product.currency || 'XOF',
        image_url: product.image_url,
        category: product.categories?.name_fr || product.categories?.name,
        matchScore: Math.min(99, Math.round(score)),
        reason: getReasonForSuggestion(product, contact)
      };
    });

    // Sort by score and return top 3
    return scoredProducts
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 3);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
}

function getReasonForSuggestion(product: any, contact: any): string {
  const reasons = [
    `Parfait pour ${contact.name}`,
    `Populaire pour les anniversaires`,
    `Cadeau apprécié`,
    `Idéal selon vos échanges précédents`,
    `Tendance cette saison`
  ];
  return reasons[Math.floor(Math.random() * reasons.length)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify service role authentication
  if (!verifyServiceAuth(req)) {
    console.error('Unauthorized access attempt to birthday-reminder-with-suggestions');
    return new Response(
      JSON.stringify({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting birthday reminder with suggestions check...');
    
    const notificationsCreated = {
      withSuggestions: 0,
      basic: 0,
      skipped: 0,
    };

    const today = new Date();

    // Get all contacts with birthdays
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, user_id, name, birthday, relationship, phone')
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

      // Check if this matches any reminder schedule
      const matchingSchedule = REMINDER_SCHEDULE.find(s => s.daysBefore === daysUntilBirthday);
      
      if (!matchingSchedule) continue;

      // Check user notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('birthday_notifications, ai_suggestions, birthday_reminder_days')
        .eq('user_id', contact.user_id)
        .single();

      // Skip if user disabled birthday notifications
      if (prefs && !prefs.birthday_notifications) {
        notificationsCreated.skipped++;
        continue;
      }

      // Check if user wants reminders at this day range
      const reminderDays = prefs?.birthday_reminder_days || [14, 7, 3, 1];
      if (!reminderDays.includes(daysUntilBirthday)) {
        notificationsCreated.skipped++;
        continue;
      }

      // Check if notification already sent for this contact and day range
      const { data: existingNotif } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('user_id', contact.user_id)
        .eq('notification_type', 'birthday_reminder_with_suggestions')
        .contains('metadata', { contact_id: contact.id, days_until: daysUntilBirthday })
        .maybeSingle();

      if (existingNotif) {
        notificationsCreated.skipped++;
        continue;
      }

      // Generate AI suggestions if enabled
      let suggestions: any[] = [];
      if (prefs?.ai_suggestions !== false) {
        suggestions = await generateQuickSuggestions(
          supabase,
          contact.user_id,
          contact,
          { min: 5000, max: 50000 } // Default budget range in XOF
        );
      }

      // Build notification message
      const hasActiveFund = await checkActiveFund(supabase, contact.id);
      
      let message = `L'anniversaire de ${contact.name} approche !`;
      if (suggestions.length > 0) {
        message += ` Découvrez nos suggestions personnalisées.`;
      }
      if (!hasActiveFund) {
        message += ` Créez une cotisation pour lui offrir un cadeau collectif.`;
      }

      // Create the enriched notification
      await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: contact.user_id,
          notification_type: 'birthday_reminder_with_suggestions',
          title: `${matchingSchedule.title} - Anniversaire de ${contact.name}`,
          message,
          scheduled_for: new Date().toISOString(),
          delivery_methods: ['push', 'in_app', 'email'],
          priority: matchingSchedule.priority,
          metadata: {
            contact_id: contact.id,
            contact_name: contact.name,
            contact_relationship: contact.relationship,
            days_until: daysUntilBirthday,
            birthday_date: thisYearBirthday.toISOString(),
            reminder_type: matchingSchedule.type,
            has_active_fund: hasActiveFund,
            gift_suggestions: suggestions.map(s => ({
              id: s.productId,
              name: s.productName,
              price: s.price,
              currency: s.currency,
              image: s.image_url,
              match_score: s.matchScore,
              reason: s.reason,
              category: s.category
            }))
          },
          action_data: {
            action_type: 'view_gift_ideas',
            contact_id: contact.id,
            route: `/gift-ideas/${contact.id}`
          }
        });

      if (suggestions.length > 0) {
        notificationsCreated.withSuggestions++;
      } else {
        notificationsCreated.basic++;
      }

      console.log(`Created birthday reminder for ${contact.name} (${daysUntilBirthday} days) with ${suggestions.length} suggestions`);
    }

    console.log('Birthday reminder with suggestions check completed:', notificationsCreated);

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
    console.error('[SERVER] Error in birthday-reminder-with-suggestions:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Une erreur est survenue lors de la génération des rappels',
        code: 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Check if there's an active fund for this contact
async function checkActiveFund(supabase: any, contactId: string): Promise<boolean> {
  const { data } = await supabase
    .from('collective_funds')
    .select('id')
    .eq('beneficiary_contact_id', contactId)
    .eq('status', 'active')
    .maybeSingle();
  
  return !!data;
}
