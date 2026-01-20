// Shared utilities for OG image caching
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET_NAME = "og-images-cache";
const CACHE_DURATION_DAYS = 7;

/**
 * Generate a simple hash from data string for change detection
 */
export function hashData(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get Supabase clients for cache operations
 */
export function getCacheClients() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  return {
    supabase: createClient(supabaseUrl, supabaseAnonKey),
    supabaseAdmin: createClient(supabaseUrl, serviceRoleKey),
    supabaseUrl,
  };
}

/**
 * Check if a cached image exists and is still valid
 * Returns the public URL if cache hit, null if cache miss
 */
export async function getCachedImage(
  supabase: SupabaseClient,
  cacheKey: string
): Promise<{ url: string; dataHash: string } | null> {
  try {
    const { data: metadata, error } = await supabase
      .from("og_image_cache_metadata")
      .select("storage_path, expires_at, data_hash")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (error || !metadata) {
      return null;
    }

    // Check expiration
    if (new Date(metadata.expires_at) < new Date()) {
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(metadata.storage_path);

    if (!urlData?.publicUrl) {
      return null;
    }

    return {
      url: urlData.publicUrl,
      dataHash: metadata.data_hash,
    };
  } catch (error) {
    console.error("Error checking cache:", error);
    return null;
  }
}

/**
 * Save an image to the cache
 */
export async function cacheImage(
  supabaseAdmin: SupabaseClient,
  entityType: "product" | "fund" | "business",
  entityId: string,
  cacheKey: string,
  imageBuffer: ArrayBuffer,
  dataHash: string
): Promise<string | null> {
  try {
    const storagePath = `${entityType}s/${entityId}_${dataHash}.png`;

    // Upload image to storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "public, max-age=604800", // 7 days
      });

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      return null;
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CACHE_DURATION_DAYS);

    // Save metadata
    const { error: metadataError } = await supabaseAdmin
      .from("og_image_cache_metadata")
      .upsert(
        {
          entity_type: entityType,
          entity_id: entityId,
          cache_key: cacheKey,
          storage_path: storagePath,
          data_hash: dataHash,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "cache_key" }
      );

    if (metadataError) {
      console.error("Error saving cache metadata:", metadataError);
      // Don't return null here - image is already uploaded
    }

    // Return public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error("Error caching image:", error);
    return null;
  }
}

/**
 * Create a redirect response to a cached image
 */
export function createCacheRedirectResponse(cachedUrl: string): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: cachedUrl,
      "Cache-Control": "public, max-age=86400", // 24 hours browser cache
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Calculate progress bucket for funds (0, 10, 20, ..., 100)
 * This reduces cache regeneration frequency for funds
 */
export function calculateProgressBucket(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  const percentage = (currentAmount / targetAmount) * 100;
  return Math.min(Math.floor(percentage / 10) * 10, 100);
}
