import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ContactWishlistItem {
  id: string;
  product_id: string;
  priority_level: string;
  occasion_type: string | null;
  accept_alternatives: boolean;
  notes: string | null;
  context_usage: string[];
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    image_url: string | null;
  } | null;
}

export function useContactWishlist(contactId: string | undefined) {
  const [wishlist, setWishlist] = useState<ContactWishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkedUserName, setLinkedUserName] = useState<string | null>(null);

  useEffect(() => {
    if (!contactId) return;

    const fetchWishlist = async () => {
      setLoading(true);
      try {
        // 1. Get the contact's linked_user_id
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('linked_user_id, name')
          .eq('id', contactId)
          .single();

        if (contactError || !contact?.linked_user_id) {
          setWishlist([]);
          setLoading(false);
          return;
        }

        setLinkedUserName(contact.name);

        // 2. Load the user_favorites for that linked user
        const { data, error } = await supabase
          .from('user_favorites')
          .select(`
            id,
            product_id,
            priority_level,
            occasion_type,
            accept_alternatives,
            notes,
            context_usage,
            products (id, name, description, price, currency, image_url)
          `)
          .eq('user_id', contact.linked_user_id)
          .order('priority_level', { ascending: true });

        if (error) {
          console.error('Error loading contact wishlist:', error);
          setWishlist([]);
          setLoading(false);
          return;
        }

        const items: ContactWishlistItem[] = (data || []).map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          priority_level: item.priority_level,
          occasion_type: item.occasion_type,
          accept_alternatives: item.accept_alternatives,
          notes: item.notes,
          context_usage: item.context_usage || [],
          product: item.products,
        }));

        setWishlist(items);
      } catch (err) {
        console.error('Error fetching contact wishlist:', err);
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [contactId]);

  return { wishlist, loading, linkedUserName };
}
