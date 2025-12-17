import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Gift {
  id: string;
  gift_name: string;
  gift_description: string | null;
  gift_date: string;
  occasion: string | null;
  amount: number | null;
  currency: string | null;
  product_id: string | null;
  products?: {
    id: string;
    name: string;
    image_url: string | null;
    price: number | null;
  } | null;
}

interface GiftStats {
  totalGifts: number;
  totalSpent: number;
  favoriteOccasion: string | null;
  lastGiftDate: string | null;
  occasionCounts: Record<string, number>;
}

export function useContactGiftHistory(contactId: string | undefined) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [stats, setStats] = useState<GiftStats>({
    totalGifts: 0,
    totalSpent: 0,
    favoriteOccasion: null,
    lastGiftDate: null,
    occasionCounts: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) {
      setLoading(false);
      return;
    }

    const fetchGiftHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the contact's name to search by receiver_name
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('name')
          .eq('id', contactId)
          .single();

        if (contactError) throw contactError;

        // Get gifts for this contact
        const { data: giftsData, error: giftsError } = await supabase
          .from('gifts')
          .select(`
            id,
            gift_name,
            gift_description,
            gift_date,
            occasion,
            amount,
            currency,
            product_id,
            products (
              id,
              name,
              image_url,
              price
            )
          `)
          .eq('receiver_name', contact.name)
          .order('gift_date', { ascending: false });

        if (giftsError) throw giftsError;

        setGifts(giftsData || []);

        // Calculate stats
        const occasionCounts: Record<string, number> = {};
        let totalSpent = 0;

        (giftsData || []).forEach((gift) => {
          if (gift.occasion) {
            occasionCounts[gift.occasion] = (occasionCounts[gift.occasion] || 0) + 1;
          }
          if (gift.amount) {
            totalSpent += gift.amount;
          }
        });

        const favoriteOccasion = Object.entries(occasionCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

        setStats({
          totalGifts: giftsData?.length || 0,
          totalSpent,
          favoriteOccasion,
          lastGiftDate: giftsData?.[0]?.gift_date || null,
          occasionCounts,
        });
      } catch (err: any) {
        console.error('Error fetching gift history:', err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchGiftHistory();
  }, [contactId]);

  return { gifts, stats, loading, error };
}
