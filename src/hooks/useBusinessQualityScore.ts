import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QualityImprovement {
  id: string;
  label: string;
  impact: 'high' | 'medium' | 'low';
  points: number;
  cta?: { label: string; route?: string; action?: string };
}

export interface BusinessQualitySnapshot {
  business_name?: string;
  business_type?: string;
  description?: string;
  has_logo: boolean;
  has_phone: boolean;
  has_address: boolean;
  delivery_zones_count: number;
  has_payment: boolean;
  product_count: number;
  products_with_image: number;
  products_with_description: number;
  setup_tier?: string | null;
  city?: string;
  country_code?: string;
}

export interface BusinessQualityResult {
  score: number; // 0-100
  snapshot: BusinessQualitySnapshot | null;
  improvements: QualityImprovement[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const POINTS = {
  logo: 10,
  description: 10,
  phone: 5,
  address: 5,
  delivery: 15,
  payment: 15,
  firstProduct: 15,
  threeProducts: 10,
  fiveProducts: 5,
  productImages: 5,
  productDescriptions: 5,
};

export const useBusinessQualityScore = (businessId?: string | null): BusinessQualityResult => {
  const [snapshot, setSnapshot] = useState<BusinessQualitySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!businessId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: biz } = await supabase
        .from('business_accounts')
        .select('business_name, business_type, description, logo_url, phone, address, delivery_zones, payment_info, setup_tier, city, country_code')
        .eq('id', businessId)
        .maybeSingle();

      const { data: products } = await supabase
        .from('products')
        .select('id, image_url, description')
        .eq('business_id', businessId);

      const productList = products ?? [];
      const zones = Array.isArray((biz as any)?.delivery_zones) ? (biz as any).delivery_zones : [];
      const payment = (biz as any)?.payment_info ?? {};
      const hasPayment = !!(payment?.mobile_money || payment?.account_holder);

      setSnapshot({
        business_name: (biz as any)?.business_name,
        business_type: (biz as any)?.business_type,
        description: (biz as any)?.description,
        has_logo: !!(biz as any)?.logo_url,
        has_phone: !!(biz as any)?.phone,
        has_address: !!(biz as any)?.address,
        delivery_zones_count: zones.length,
        has_payment: hasPayment,
        product_count: productList.length,
        products_with_image: productList.filter((p: any) => !!p.image_url).length,
        products_with_description: productList.filter((p: any) => !!p.description && p.description.length > 10).length,
        setup_tier: (biz as any)?.setup_tier ?? null,
        city: (biz as any)?.city,
        country_code: (biz as any)?.country_code,
      });
    } catch (err) {
      console.error('useBusinessQualityScore error:', err);
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { refetch(); }, [refetch]);

  const { score, improvements } = computeScore(snapshot);

  return { score, snapshot, improvements, loading, refetch };
};

function computeScore(snap: BusinessQualitySnapshot | null): { score: number; improvements: QualityImprovement[] } {
  if (!snap) return { score: 0, improvements: [] };

  let score = 0;
  const improvements: QualityImprovement[] = [];

  // Profile basics
  if (snap.has_logo) score += POINTS.logo;
  else improvements.push({
    id: 'logo', label: 'Ajoutez un logo (+3,2× clics)', impact: 'high', points: POINTS.logo,
    cta: { label: 'Ajouter mon logo', route: '/business-profile-settings' },
  });

  if (snap.description && snap.description.length >= 40) score += POINTS.description;
  else improvements.push({
    id: 'description',
    label: snap.description ? 'Étoffez votre description (40+ caractères)' : 'Rédigez une description vendeuse',
    impact: 'high', points: POINTS.description,
    cta: { label: "Demander à l'assistant", action: 'open-chat-description' },
  });

  if (snap.has_phone) score += POINTS.phone;
  else improvements.push({
    id: 'phone', label: 'Ajoutez un numéro de contact', impact: 'medium', points: POINTS.phone,
    cta: { label: 'Compléter', route: '/business-profile-settings' },
  });

  if (snap.has_address) score += POINTS.address;
  else improvements.push({
    id: 'address', label: 'Indiquez une adresse', impact: 'low', points: POINTS.address,
    cta: { label: 'Compléter', route: '/business-profile-settings' },
  });

  // Delivery
  if (snap.delivery_zones_count > 0) score += POINTS.delivery;
  else improvements.push({
    id: 'delivery', label: 'Configurez vos zones de livraison (+70% de contacts)',
    impact: 'high', points: POINTS.delivery,
    cta: { label: 'Configurer', route: '/business-profile-settings' },
  });

  // Payment
  if (snap.has_payment) score += POINTS.payment;
  else improvements.push({
    id: 'payment', label: 'Activez un moyen de paiement (Mobile Money/Wave) — ×2 conversions',
    impact: 'high', points: POINTS.payment,
    cta: { label: 'Activer', route: '/business-profile-settings' },
  });

  // Products
  if (snap.product_count >= 1) score += POINTS.firstProduct;
  else improvements.push({
    id: 'first-product', label: 'Ajoutez votre premier produit (×5 chances de commande)',
    impact: 'high', points: POINTS.firstProduct,
    cta: { label: 'Ajouter un produit', action: 'open-add-product' },
  });

  if (snap.product_count >= 3) score += POINTS.threeProducts;
  else if (snap.product_count >= 1) improvements.push({
    id: 'three-products', label: `Ajoutez ${3 - snap.product_count} produit(s) pour atteindre 3 (palier Argent)`,
    impact: 'medium', points: POINTS.threeProducts,
    cta: { label: 'Ajouter un produit', action: 'open-add-product' },
  });

  if (snap.product_count >= 5) score += POINTS.fiveProducts;
  else if (snap.product_count >= 3) improvements.push({
    id: 'five-products', label: `Ajoutez ${5 - snap.product_count} produit(s) pour atteindre 5 (palier Or)`,
    impact: 'medium', points: POINTS.fiveProducts,
    cta: { label: 'Ajouter un produit', action: 'open-add-product' },
  });

  if (snap.product_count > 0) {
    const imgRatio = snap.products_with_image / snap.product_count;
    const descRatio = snap.products_with_description / snap.product_count;
    if (imgRatio >= 0.8) score += POINTS.productImages;
    else improvements.push({
      id: 'product-images', label: 'Ajoutez des photos à tous vos produits',
      impact: 'medium', points: POINTS.productImages,
    });
    if (descRatio >= 0.8) score += POINTS.productDescriptions;
    else improvements.push({
      id: 'product-descriptions', label: 'Décrivez chaque produit (10+ caractères)',
      impact: 'low', points: POINTS.productDescriptions,
      cta: { label: "Demander à l'assistant", action: 'open-chat-product-desc' },
    });
  }

  // Sort improvements by impact then points
  const impactOrder = { high: 3, medium: 2, low: 1 };
  improvements.sort((a, b) => impactOrder[b.impact] - impactOrder[a.impact] || b.points - a.points);

  return { score: Math.min(100, score), improvements };
}