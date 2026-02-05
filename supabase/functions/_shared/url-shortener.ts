 /**
  * URL Shortener Module using TinyURL API
  * Features: caching, fallback, SMS-optimized
  */
 
 import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 // Cache TTL in days
 const CACHE_TTL_DAYS = 30;
 
 export interface ShortenResult {
   success: boolean;
   shortUrl: string;
   originalUrl: string;
   cached: boolean;
   error?: string;
 }
 
 /**
  * Shortens a URL using TinyURL API with database caching
  * Falls back to original URL if shortening fails
  */
 export async function shortenUrl(
   longUrl: string,
   supabaseClient: SupabaseClient
 ): Promise<ShortenResult> {
   
   // 1. Check cache first
   const { data: cached } = await supabaseClient
     .from('shortened_urls')
     .select('short_url, created_at')
     .eq('original_url', longUrl)
     .single();
   
   if (cached) {
     // Check if cache is still valid (30 days)
     const cacheAge = Date.now() - new Date(cached.created_at).getTime();
     if (cacheAge < CACHE_TTL_DAYS * 24 * 60 * 60 * 1000) {
       console.log(`URL cache hit for: ${longUrl}`);
       
       // Increment hit count (fire and forget)
       supabaseClient
         .from('shortened_urls')
         .update({ hit_count: (cached as any).hit_count + 1 || 1 })
         .eq('original_url', longUrl)
         .then(() => {});
       
       return {
         success: true,
         shortUrl: cached.short_url,
         originalUrl: longUrl,
         cached: true
       };
     }
   }
   
   // 2. Call TinyURL API (no auth required)
   try {
     console.log(`Shortening URL via TinyURL: ${longUrl}`);
     
     const response = await fetch(
       `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
     );
     
     if (!response.ok) {
       throw new Error(`TinyURL API error: ${response.status}`);
     }
     
     const shortUrl = await response.text();
     
     // Validate the response looks like a URL
     if (!shortUrl.startsWith('http')) {
       throw new Error(`Invalid TinyURL response: ${shortUrl}`);
     }
     
     console.log(`URL shortened: ${longUrl} -> ${shortUrl}`);
     
     // 3. Cache the result (upsert to handle existing entries)
     await supabaseClient
       .from('shortened_urls')
       .upsert({
         original_url: longUrl,
         short_url: shortUrl,
         hit_count: 0,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString()
       }, { onConflict: 'original_url' });
     
     return {
       success: true,
       shortUrl,
       originalUrl: longUrl,
       cached: false
     };
     
   } catch (error) {
     console.error('URL shortening failed:', error);
     
     // Fallback: return original URL without https://
     const fallback = longUrl.replace(/^https?:\/\//, '');
     return {
       success: false,
       shortUrl: fallback,
       originalUrl: longUrl,
       cached: false,
       error: error.message
     };
   }
 }
 
 /**
  * Shortens URL for SMS (removes https:// from TinyURL result)
  * TinyURL returns: https://tinyurl.com/abc123
  * We return: tinyurl.com/abc123 (saves 8 chars)
  */
 export async function shortenUrlForSms(
   longUrl: string,
   supabaseClient: SupabaseClient
 ): Promise<string> {
   const result = await shortenUrl(longUrl, supabaseClient);
   
   // Remove https:// to save characters in SMS
   return result.shortUrl.replace(/^https?:\/\//, '');
 }