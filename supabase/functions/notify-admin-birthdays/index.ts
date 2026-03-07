import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getDaysUntilBirthday(birthdayStr: string): number {
  const parts = birthdayStr.split('-');
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(today.getFullYear(), month, day);
  next.setHours(0, 0, 0, 0);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('🎂 Starting admin birthday notifications check...');

    // Get active admins
    const { data: admins, error: adminsErr } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('is_active', true);

    if (adminsErr) throw adminsErr;
    if (!admins?.length) {
      console.log('No active admins found');
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch profiles with birthdays
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name, birthday')
      .not('birthday', 'is', null);

    // Fetch contacts with birthdays
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, birthday, user_id')
      .not('birthday', 'is', null);

    // Build upcoming list
    interface BirthdayEntry {
      id: string;
      name: string;
      entityType: string;
      daysUntil: number;
      ownerId?: string;
    }

    const upcoming: BirthdayEntry[] = [];

    for (const p of profiles || []) {
      if (!p.birthday) continue;
      const days = getDaysUntilBirthday(p.birthday);
      if (days <= 1) {
        upcoming.push({
          id: p.user_id,
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Utilisateur',
          entityType: 'user',
          daysUntil: days,
        });
      }
    }

    for (const c of contacts || []) {
      if (!c.birthday) continue;
      const days = getDaysUntilBirthday(c.birthday);
      if (days <= 1) {
        upcoming.push({
          id: c.id,
          name: c.name || 'Contact',
          entityType: 'contact',
          daysUntil: days,
          ownerId: c.user_id,
        });
      }
    }

    console.log(`Found ${upcoming.length} birthdays within 24h`);

    let inserted = 0;

    for (const entry of upcoming) {
      for (const admin of admins) {
        // Check duplicate for today
        const { data: existing } = await supabase
          .from('admin_notifications')
          .select('id')
          .eq('type', 'birthday_approaching')
          .eq('entity_id', entry.id)
          .eq('admin_user_id', admin.user_id)
          .gte('created_at', todayStr)
          .maybeSingle();

        if (existing) continue;

        const isToday = entry.daysUntil === 0;
        const title = isToday
          ? `🎂 Anniversaire aujourd'hui : ${entry.name}`
          : `🎂 Anniversaire demain : ${entry.name}`;
        const message = isToday
          ? `${entry.name} fête son anniversaire aujourd'hui !`
          : `${entry.name} fêtera son anniversaire demain.`;

        const { error: insertErr } = await supabase
          .from('admin_notifications')
          .insert({
            admin_user_id: admin.user_id,
            type: 'birthday_approaching',
            title,
            message,
            severity: isToday ? 'warning' : 'info',
            entity_type: entry.entityType,
            entity_id: entry.id,
            action_url: '/admin/birthdays',
          });

        if (insertErr) {
          console.error(`Insert error for ${entry.name}:`, insertErr.message);
        } else {
          inserted++;
        }
      }
    }

    console.log(`✅ Inserted ${inserted} admin birthday notifications`);

    return new Response(
      JSON.stringify({ success: true, upcoming: upcoming.length, notified: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
