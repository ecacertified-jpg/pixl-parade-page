CREATE OR REPLACE VIEW public.crm_user_overview
WITH (security_invoker = true) AS
 SELECT p.user_id,
    p.first_name,
    p.last_name,
    p.phone,
    u.email,
    p.country_code,
    p.city,
    p.created_at AS signup_date,
    p.birthday,
    p.is_suspended,
    p.is_deleted,
    p.onboarding_completed,
    p.onboarding_furthest_step,
    u.last_sign_in_at,
    bp.slug AS birthday_page_slug,
    bp.created_at AS birthday_page_created_at,
    bp.published_at AS birthday_page_published_at,
    bp.is_active AS birthday_page_active,
    ep.slug AS event_page_slug,
    ep.occasion AS event_page_occasion,
    ep.event_date AS event_page_date,
    ep.created_at AS event_page_created_at,
    ep.is_active AS event_page_active,
    COALESCE(f.funds_count, 0) AS funds_count,
    COALESCE(f.active_funds_count, 0) AS active_funds_count,
    f.first_fund_created_at,
    COALESCE(f.total_collected, 0::numeric) AS total_collected,
    COALESCE(f.contributions_count, 0) AS contributions_count,
    COALESCE(sh.shares_count, 0) AS shares_count,
    sh.last_share_at,
    sh.share_channels,
    COALESCE(ob.onboarding_shares_count, 0) AS onboarding_shares_count,
    COALESCE(msg.messages_received, 0) AS messages_received,
    COALESCE(pv.page_photo_views, 0) AS page_photo_views,
    COALESCE(s.sessions_count, 0) AS sessions_count,
    s.last_session_at,
    GREATEST(COALESCE(u.last_sign_in_at, p.created_at), COALESCE(s.last_session_at, p.created_at)) AS last_activity_at,
    GREATEST(u.last_sign_in_at, s.last_session_at) AS last_real_activity_at
   FROM profiles p
     LEFT JOIN auth.users u ON u.id = p.user_id
     LEFT JOIN LATERAL ( SELECT b.slug, b.created_at, b.published_at, b.is_active
           FROM birthday_pages b
          WHERE b.user_id = p.user_id
          ORDER BY b.celebration_year DESC NULLS LAST, b.created_at DESC
         LIMIT 1) bp ON true
     LEFT JOIN LATERAL ( SELECT e.slug, e.occasion, e.event_date, e.created_at, e.is_active
           FROM event_pages e
          WHERE e.creator_id = p.user_id
          ORDER BY e.created_at DESC
         LIMIT 1) ep ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS funds_count,
            count(*) FILTER (WHERE cf.status = 'active'::text)::integer AS active_funds_count,
            min(cf.created_at) AS first_fund_created_at,
            COALESCE(sum(cf.current_amount), 0::numeric) AS total_collected,
            COALESCE(sum(( SELECT count(*) AS count
                   FROM fund_contributions fc
                  WHERE fc.fund_id = cf.id)), 0::numeric)::integer AS contributions_count
           FROM collective_funds cf
          WHERE cf.creator_id = p.user_id OR cf.beneficiary_user_id = p.user_id) f ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS shares_count,
            max(v.created_at) AS last_share_at,
            array_agg(DISTINCT v.channel) FILTER (WHERE v.channel IS NOT NULL) AS share_channels
           FROM viral_share_events v
          WHERE v.sharer_user_id = p.user_id) sh ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS onboarding_shares_count
           FROM onboarding_shares o
          WHERE o.user_id = p.user_id) ob ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS messages_received
           FROM birthday_wishes_messages m
          WHERE m.birthday_user_id = p.user_id) msg ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS page_photo_views
           FROM birthday_page_photo_views pvw
             JOIN birthday_page_photos ph ON ph.id = pvw.photo_id
             JOIN birthday_pages bpp ON bpp.id = ph.birthday_page_id
          WHERE bpp.user_id = p.user_id) pv ON true
     LEFT JOIN LATERAL ( SELECT count(*)::integer AS sessions_count,
            max(COALESCE(l.last_active_at, l.started_at)) AS last_session_at
           FROM user_session_logs l
          WHERE l.user_id = p.user_id) s ON true;