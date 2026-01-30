/**
 * Centralized Mapbox configuration for JOIE DE VIVRE
 * 
 * This file contains all Mapbox-related constants and defaults.
 * The token is URL-restricted to *.lovable.app domains for security.
 */

// Storage key for localStorage
export const MAPBOX_TOKEN_KEY = "joie_de_vivre_mapbox_token";

// Default public token with URL restrictions (*.lovable.app, pixl-parade-page.lovable.app)
export const DEFAULT_MAPBOX_TOKEN = "pk.eyJ1IjoiamR2IiwiYSI6ImNtbDB1bm5iZDAwdXgzZHNhMmdkMmU2aHIifQ.vjA42a2nsRAs2Y6rg1Eisg";

// Default map center (Abidjan, Côte d'Ivoire)
export const MAPBOX_DEFAULT_CENTER = {
  lat: 5.3364,
  lng: -4.0267,
};

// Default zoom level
export const MAPBOX_DEFAULT_ZOOM = 12;

// Default map style
export const MAPBOX_DEFAULT_STYLE = "mapbox://styles/mapbox/streets-v12";

// Dark style for admin dashboards
export const MAPBOX_DARK_STYLE = "mapbox://styles/mapbox/dark-v11";

// Light style for city pages
export const MAPBOX_LIGHT_STYLE = "mapbox://styles/mapbox/light-v11";
