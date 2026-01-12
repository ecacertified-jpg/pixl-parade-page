import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MatchingProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  has_google: boolean;
  has_phone: boolean;
}

export interface DuplicateCheckResult {
  hasPotentialDuplicate: boolean;
  duplicateType: 'phone' | 'name' | 'both' | null;
  matchingProfiles: MatchingProfile[];
  confidence: 'high' | 'medium' | 'low';
}

export function useDuplicateAccountDetection() {
  const [isChecking, setIsChecking] = useState(false);

  const checkForDuplicate = async (
    phone: string,
    firstName?: string,
    city?: string
  ): Promise<DuplicateCheckResult> => {
    setIsChecking(true);
    
    try {
      const matchingProfiles: MatchingProfile[] = [];
      let duplicateType: 'phone' | 'name' | 'both' | null = null;
      let hasPhoneMatch = false;
      let hasNameMatch = false;

      // Normaliser le téléphone (enlever espaces et tirets)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

      // 1. Vérification par téléphone exact
      if (normalizedPhone && normalizedPhone.length >= 8) {
        const { data: phoneMatches, error: phoneError } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, phone, city, avatar_url, created_at')
          .eq('is_suspended', false)
          .or(`phone.ilike.%${normalizedPhone}%,phone.ilike.%${normalizedPhone.slice(-8)}%`)
          .limit(5);

        if (!phoneError && phoneMatches && phoneMatches.length > 0) {
          hasPhoneMatch = true;
          for (const profile of phoneMatches) {
            // Éviter les doublons
            if (!matchingProfiles.some(p => p.user_id === profile.user_id)) {
              matchingProfiles.push({
                ...profile,
                has_google: false, // Sera déterminé ci-dessous
                has_phone: !!profile.phone,
              });
            }
          }
        }
      }

      // 2. Vérification par prénom similaire (si fourni)
      if (firstName && firstName.length >= 2) {
        const normalizedFirstName = firstName.trim().toLowerCase();
        
        let query = supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, phone, city, avatar_url, created_at')
          .eq('is_suspended', false)
          .ilike('first_name', `%${normalizedFirstName}%`);

        // Ajouter le filtre par ville si fourni pour réduire les faux positifs
        if (city && city.length > 0) {
          query = query.ilike('city', `%${city}%`);
        }

        const { data: nameMatches, error: nameError } = await query.limit(5);

        if (!nameError && nameMatches && nameMatches.length > 0) {
          hasNameMatch = true;
          for (const profile of nameMatches) {
            // Éviter les doublons
            if (!matchingProfiles.some(p => p.user_id === profile.user_id)) {
              matchingProfiles.push({
                ...profile,
                has_google: false,
                has_phone: !!profile.phone,
              });
            }
          }
        }
      }

      // Déterminer le type de doublon
      if (hasPhoneMatch && hasNameMatch) {
        duplicateType = 'both';
      } else if (hasPhoneMatch) {
        duplicateType = 'phone';
      } else if (hasNameMatch) {
        duplicateType = 'name';
      }

      // 3. Enrichir avec les informations d'authentification
      if (matchingProfiles.length > 0) {
        // Récupérer les infos auth pour déterminer la méthode de connexion
        // Note: On ne peut pas accéder directement à auth.users depuis le client
        // On utilise donc le téléphone comme indicateur (si téléphone = auth téléphone probable)
        for (const profile of matchingProfiles) {
          profile.has_phone = !!profile.phone && profile.phone.length > 0;
          // Si pas de téléphone mais compte existe, probablement Google
          profile.has_google = !profile.has_phone;
        }
      }

      // Calculer la confiance
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (duplicateType === 'phone' || duplicateType === 'both') {
        confidence = 'high';
      } else if (duplicateType === 'name' && city) {
        confidence = 'medium';
      }

      return {
        hasPotentialDuplicate: matchingProfiles.length > 0,
        duplicateType,
        matchingProfiles,
        confidence,
      };
    } catch (error) {
      console.error('Error checking for duplicate accounts:', error);
      return {
        hasPotentialDuplicate: false,
        duplicateType: null,
        matchingProfiles: [],
        confidence: 'low',
      };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkForDuplicate,
    isChecking,
  };
}
