export interface Business {
  id?: string;
  user_id?: string;
  business_name: string;
  business_type?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  email?: string;
  opening_hours: Record<string, { open: string; close: string; closed?: boolean }>;
  delivery_zones: Array<{ name: string; radius: number; cost: number; active?: boolean }>;
  delivery_settings: { free_delivery_threshold: number; standard_cost: number };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  latitude?: number | null;
  longitude?: number | null;
  setup_tier?: string | null;
  // Payment info now lives in business_payment_info (private). Kept here as an
  // in-memory edit buffer for forms that load/save via upsert_business_payment_info RPC.
  payment_info?: { mobile_money?: string; account_holder?: string };
  wave_merchant_phone?: string;
  mobile_money_merchant_phone?: string;
  wave_payment_link?: string;
}

export interface BusinessPaymentInfo {
  business_account_id: string;
  wave_merchant_phone: string | null;
  mobile_money_merchant_phone: string | null;
  wave_payment_link: string | null;
  payment_info: { mobile_money?: string; account_holder?: string } | null;
}