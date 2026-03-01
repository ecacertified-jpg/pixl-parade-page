import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicFundResult {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  occasion: string | null;
  status: string;
  deadline_date: string | null;
  created_at: string;
  creator_id: string | null;
  beneficiary_name: string | null;
  creator_first_name: string | null;
  creator_last_name: string | null;
  creator_avatar_url: string | null;
  product_name: string | null;
  product_image_url: string | null;
  contributions_count: number;
  isOwn: boolean;
}

export function useSearchPublicFunds(currentUserId?: string) {
  const [results, setResults] = useState<PublicFundResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchFunds = useCallback((query: string, occasion?: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2 && !occasion) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const searchPattern = query.trim().length >= 2 ? `%${query.trim()}%` : null;

        const buildQuery = () => {
          let q = supabase
            .from('collective_funds')
            .select(`
              id, title, target_amount, current_amount, occasion, status, deadline_date, created_at, creator_id,
              beneficiary_contact_id,
              profiles!collective_funds_creator_id_fkey(first_name, last_name, avatar_url),
              products!collective_funds_business_product_id_fkey(name, image_url)
            `)
            .eq('status', 'active')
            .eq('is_public', true);

          if (occasion) {
            q = q.eq('occasion', occasion);
          }
          return q;
        };

        let byTitle: any[] = [];
        if (searchPattern) {
          const { data } = await buildQuery().ilike('title', searchPattern).limit(10);
          byTitle = data || [];
        }

        let byBeneficiary: any[] = [];
        if (searchPattern) {
          const { data: contactMatches } = await supabase
            .from('contacts')
            .select('id')
            .ilike('name', searchPattern)
            .limit(20);

          if (contactMatches && contactMatches.length > 0) {
            const contactIds = contactMatches.map(c => c.id);
            const { data } = await buildQuery()
              .in('beneficiary_contact_id', contactIds)
              .limit(10);
            byBeneficiary = data || [];
          }
        }

        // If only occasion filter (no text query), fetch all matching
        let byOccasionOnly: any[] = [];
        if (!searchPattern && occasion) {
          const { data } = await buildQuery().limit(20);
          byOccasionOnly = data || [];
        }

        // Merge and deduplicate
        const allFunds = [...byTitle, ...byBeneficiary, ...byOccasionOnly];
        const seen = new Set<string>();
        const unique = allFunds.filter(f => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return true;
        });

        // Get beneficiary names and contribution counts
        const fundIds = unique.map(f => f.id);
        const contactIds = unique
          .map(f => f.beneficiary_contact_id)
          .filter(Boolean) as string[];

        const [contactsRes, contribRes] = await Promise.all([
          contactIds.length > 0
            ? supabase.from('contacts').select('id, name').in('id', contactIds)
            : Promise.resolve({ data: [] }),
          fundIds.length > 0
            ? supabase.from('fund_contributions').select('fund_id').in('fund_id', fundIds)
            : Promise.resolve({ data: [] }),
        ]);

        const contactMap = new Map(
          (contactsRes.data || []).map(c => [c.id, c.name])
        );
        const contribCounts = new Map<string, number>();
        (contribRes.data || []).forEach(c => {
          contribCounts.set(c.fund_id, (contribCounts.get(c.fund_id) || 0) + 1);
        });

        const mapped: PublicFundResult[] = unique.map(f => {
          const profile = f.profiles as any;
          const product = f.products as any;
          return {
            id: f.id,
            title: f.title,
            target_amount: f.target_amount,
            current_amount: f.current_amount,
            occasion: f.occasion,
            status: f.status,
            deadline_date: f.deadline_date,
            created_at: f.created_at,
            creator_id: f.creator_id,
            beneficiary_name: f.beneficiary_contact_id
              ? contactMap.get(f.beneficiary_contact_id) || null
              : null,
            creator_first_name: profile?.first_name || null,
            creator_last_name: profile?.last_name || null,
            creator_avatar_url: profile?.avatar_url || null,
            product_name: product?.name || null,
            product_image_url: product?.image_url || null,
            contributions_count: contribCounts.get(f.id) || 0,
            isOwn: currentUserId ? f.creator_id === currentUserId : false,
          };
        });

        setResults(mapped);
      } catch (error) {
        console.error('Erreur recherche cagnottes:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [currentUserId]);

  const clearResults = useCallback(() => {
    setResults([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return { results, loading, searchFunds, clearResults };
}
