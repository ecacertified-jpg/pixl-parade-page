-- Corriger le search_path de la fonction
CREATE OR REPLACE FUNCTION increment_business_share_metrics(
  p_share_id UUID,
  p_event_type TEXT,
  p_conversion_value NUMERIC DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE public.business_shares
  SET
    click_count = CASE WHEN p_event_type = 'click' THEN click_count + 1 ELSE click_count END,
    view_count = CASE WHEN p_event_type = 'view' THEN view_count + 1 ELSE view_count END,
    follow_count = CASE WHEN p_event_type = 'follow' THEN follow_count + 1 ELSE follow_count END,
    order_count = CASE WHEN p_event_type = 'order' THEN order_count + 1 ELSE order_count END,
    total_order_value = total_order_value + COALESCE(p_conversion_value, 0),
    first_clicked_at = CASE WHEN p_event_type = 'click' AND first_clicked_at IS NULL THEN NOW() ELSE first_clicked_at END,
    last_clicked_at = CASE WHEN p_event_type = 'click' THEN NOW() ELSE last_clicked_at END,
    first_follow_at = CASE WHEN p_event_type = 'follow' AND first_follow_at IS NULL THEN NOW() ELSE first_follow_at END
  WHERE id = p_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;