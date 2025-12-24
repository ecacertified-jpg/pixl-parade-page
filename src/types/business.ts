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
  payment_info: { mobile_money?: string; account_holder?: string };
  delivery_settings: { free_delivery_threshold: number; standard_cost: number };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}