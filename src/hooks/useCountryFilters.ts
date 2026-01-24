/**
 * Hook for differentiated country filtering
 * 
 * Provides separate filters for:
 * - Local content (shops, products, experiences) → current navigation country
 * - Social following content (posts from friends) → no country filter
 * - Discovery content (public posts, leaderboards) → current navigation country
 */

import { useCountry } from "@/contexts/CountryContext";

export function useCountryFilters() {
  const { countryCode, showAllCountries, profileCountryCode, isVisiting } = useCountry();

  return {
    // Filter for local content (shops, products, experiences, public funds)
    // Uses the current navigation country
    localFilter: showAllCountries ? null : countryCode,

    // Filter for social content from followed users
    // No country filter - users see posts from ALL their friends regardless of location
    socialFollowingFilter: null,

    // Filter for discovery/explore content (public posts, leaderboards)
    // Uses the current navigation country
    discoveryFilter: showAllCountries ? null : countryCode,

    // Is the user visiting a different country than their profile?
    isVisiting,

    // The user's home country (from their profile)
    homeCountry: profileCountryCode,

    // Current navigation country
    currentCountry: countryCode,
  };
}
