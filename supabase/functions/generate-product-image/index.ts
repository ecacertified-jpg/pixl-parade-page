import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function generateImageWithRetry(
  productName: string,
  description?: string,
  category?: string,
  attempt = 1
): Promise<string | null> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const maxAttempts = 2;

  // Prompt plus direct pour forcer la génération d'image
  const prompts = [
    // Premier essai : prompt détaillé
    `[IMAGE GENERATION REQUEST]
Generate a realistic product photograph of: "${productName}"
${category ? `Product category: ${category}` : ""}

Photo specifications:
- Studio product photography
- Clean white background
- Professional lighting
- Centered composition
- High resolution, sharp details
- No text overlays

Generate the image now.`,
    // Deuxième essai : prompt très simple
    `Create a product photo of ${productName}. White background, centered, professional lighting.`
  ];

  const imagePrompt = prompts[Math.min(attempt - 1, prompts.length - 1)];

  console.log(`Attempt ${attempt}: Generating image for: ${productName}`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: imagePrompt }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Attempt ${attempt} - API error:`, response.status, errorText);
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();
  const imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const imageTokens = result.usage?.completion_tokens_details?.image_tokens || 0;

  console.log(`Attempt ${attempt} - Image tokens: ${imageTokens}, Has image URL: ${!!imageUrl}`);

  if (!imageUrl && attempt < maxAttempts) {
    console.log(`No image generated, retrying with simpler prompt...`);
    return generateImageWithRetry(productName, description, category, attempt + 1);
  }

  return imageUrl || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, description, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    if (!productName) {
      throw new Error("productName is required");
    }

    console.log("Starting image generation for product:", productName);

    const imageUrl = await generateImageWithRetry(productName, description, category);

    if (!imageUrl) {
      console.error("Failed to generate image after all attempts for:", productName);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Image generation failed - model did not produce an image",
          canRetry: true 
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image generated successfully for:", productName);

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating product image:", error);
    
    const status = error.message?.includes("429") ? 429 : 
                   error.message?.includes("402") ? 402 : 500;
    
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error", canRetry: status === 500 }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
