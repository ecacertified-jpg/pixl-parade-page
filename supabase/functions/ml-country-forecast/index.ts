import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HistoricalDataPoint {
  month: string;
  year: number;
  monthNum: number;
  value: number;
}

interface ForecastRequest {
  countryCode: string;
  countryName: string;
  metricType: 'users' | 'businesses' | 'revenue' | 'orders';
  year: number;
  historicalData: HistoricalDataPoint[];
  context?: {
    objectives?: { month: number; target: number }[];
    correlations?: Record<string, number>;
    events?: string[];
  };
}

interface MLPrediction {
  month: number;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
  trendDirection: 'up' | 'down' | 'stable';
  contributingFactors: Record<string, number>;
}

interface MLForecastResponse {
  predictions: MLPrediction[];
  riskFactors: string[];
  opportunities: string[];
  overallTrend: string;
  seasonalPatterns: string[];
  anomaliesDetected: { month: string; description: string }[];
  modelConfidence: number;
}

const METRIC_LABELS: Record<string, string> = {
  users: 'Nouveaux utilisateurs',
  businesses: 'Nouveaux commerces',
  revenue: 'Revenus (XOF)',
  orders: 'Commandes'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { countryCode, countryName, metricType, year, historicalData, context } = await req.json() as ForecastRequest;

    console.log(`Generating ML forecast for ${countryCode} - ${metricType} - ${year}`);

    // Check for cached valid forecast
    const { data: cachedForecast } = await supabase
      .from('ml_forecast_results')
      .select('*')
      .eq('country_code', countryCode)
      .eq('metric_type', metricType)
      .eq('forecast_year', year)
      .gt('expires_at', new Date().toISOString())
      .order('forecast_month', { ascending: true });

    if (cachedForecast && cachedForecast.length === 12) {
      console.log('Returning cached ML forecast');
      
      // Reconstruct the response from cached data
      const firstRow = cachedForecast[0];
      return new Response(JSON.stringify({
        predictions: cachedForecast.map(row => ({
          month: row.forecast_month,
          predicted: row.predicted_value,
          lowerBound: row.lower_bound,
          upperBound: row.upper_bound,
          confidence: row.confidence_score,
          trendDirection: row.trend_direction,
          contributingFactors: row.contributing_factors
        })),
        riskFactors: firstRow.risk_factors || [],
        opportunities: firstRow.opportunities || [],
        overallTrend: firstRow.overall_trend || '',
        seasonalPatterns: firstRow.seasonal_patterns || [],
        anomaliesDetected: [],
        modelConfidence: firstRow.model_confidence || 75,
        generatedAt: firstRow.generated_at,
        expiresAt: firstRow.expires_at,
        fromCache: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the prompt for ML analysis
    const historicalSummary = historicalData
      .slice(-24)
      .map(d => `${d.month} ${d.year}: ${metricType === 'revenue' ? Math.round(d.value).toLocaleString() : Math.round(d.value)}`)
      .join('\n');

    const objectivesSummary = context?.objectives
      ? context.objectives.map(o => `Mois ${o.month}: objectif ${o.target}`).join(', ')
      : 'Aucun objectif défini';

    const systemPrompt = `Tu es un expert en analyse de données et prévision pour les marchés africains, spécialisé dans le secteur du e-commerce et des services de cadeaux.

CONTEXTE:
- Marché: Côte d'Ivoire et Afrique de l'Ouest francophone
- Monnaie: XOF (Franc CFA)
- Saisonnalité importante: fêtes de fin d'année (Nov-Déc), période des mariages (Avril-Juin), Tabaski/Aïd, rentrée scolaire (Sept)

INSTRUCTIONS:
1. Analyse les tendances historiques avec attention aux patterns saisonniers africains
2. Détecte les anomalies et points de rupture dans les données
3. Identifie les facteurs de risque spécifiques au marché ivoirien
4. Génère des prédictions réalistes pour les 12 mois de ${year}
5. Fournis des intervalles de confiance basés sur la volatilité observée
6. Explique les facteurs contribuant à chaque prédiction`;

    const userPrompt = `DONNÉES HISTORIQUES pour ${countryName}
Métrique: ${METRIC_LABELS[metricType]}

${historicalSummary}

OBJECTIFS ${year}:
${objectivesSummary}

${context?.events?.length ? `ÉVÉNEMENTS CONTEXTUELS:\n${context.events.join('\n')}` : ''}

Analyse ces données et génère des prévisions mensuelles détaillées pour l'année ${year}.`;

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_forecast",
              description: "Génère des prévisions ML détaillées pour les 12 mois avec analyse des risques et opportunités",
              parameters: {
                type: "object",
                properties: {
                  predictions: {
                    type: "array",
                    description: "Prévisions pour chaque mois (1-12)",
                    items: {
                      type: "object",
                      properties: {
                        month: { type: "number", description: "Numéro du mois (1-12)" },
                        predicted: { type: "number", description: "Valeur prédite" },
                        lowerBound: { type: "number", description: "Borne inférieure (intervalle confiance 80%)" },
                        upperBound: { type: "number", description: "Borne supérieure (intervalle confiance 80%)" },
                        confidence: { type: "number", description: "Score de confiance (0-100)" },
                        trendDirection: { type: "string", enum: ["up", "down", "stable"], description: "Direction de la tendance" },
                        contributingFactors: { 
                          type: "object", 
                          description: "Facteurs contributifs avec leur poids (0-1)",
                          additionalProperties: { type: "number" }
                        }
                      },
                      required: ["month", "predicted", "lowerBound", "upperBound", "confidence", "trendDirection"]
                    }
                  },
                  riskFactors: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Facteurs de risque identifiés"
                  },
                  opportunities: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Opportunités de croissance identifiées"
                  },
                  overallTrend: { 
                    type: "string",
                    description: "Description de la tendance générale pour l'année"
                  },
                  seasonalPatterns: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Patterns saisonniers détectés"
                  },
                  anomaliesDetected: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        month: { type: "string" },
                        description: { type: "string" }
                      }
                    },
                    description: "Anomalies détectées dans les données historiques"
                  },
                  modelConfidence: { 
                    type: "number",
                    description: "Confiance globale du modèle (0-100)"
                  }
                },
                required: ["predictions", "riskFactors", "opportunities", "overallTrend", "modelConfidence"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_forecast" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants pour Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract the structured forecast from tool call
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'generate_forecast') {
      throw new Error("Unexpected AI response format");
    }

    const forecast: MLForecastResponse = JSON.parse(toolCall.function.arguments);

    // Validate and normalize predictions
    const normalizedPredictions = forecast.predictions
      .filter(p => p.month >= 1 && p.month <= 12)
      .sort((a, b) => a.month - b.month);

    // Fill missing months if any
    const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
    const existingMonths = new Set(normalizedPredictions.map(p => p.month));
    
    for (const month of allMonths) {
      if (!existingMonths.has(month)) {
        // Interpolate or use average for missing months
        const avgPredicted = normalizedPredictions.reduce((sum, p) => sum + p.predicted, 0) / normalizedPredictions.length;
        normalizedPredictions.push({
          month,
          predicted: Math.round(avgPredicted),
          lowerBound: Math.round(avgPredicted * 0.85),
          upperBound: Math.round(avgPredicted * 1.15),
          confidence: 60,
          trendDirection: 'stable',
          contributingFactors: { interpolated: 1 }
        });
      }
    }

    normalizedPredictions.sort((a, b) => a.month - b.month);

    // Store forecasts in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const generatedAt = new Date().toISOString();

    const forecastRows = normalizedPredictions.map(p => ({
      country_code: countryCode,
      metric_type: metricType,
      forecast_year: year,
      forecast_month: p.month,
      predicted_value: p.predicted,
      lower_bound: p.lowerBound,
      upper_bound: p.upperBound,
      confidence_score: p.confidence,
      trend_direction: p.trendDirection,
      contributing_factors: p.contributingFactors || {},
      risk_factors: forecast.riskFactors || [],
      opportunities: forecast.opportunities || [],
      overall_trend: forecast.overallTrend,
      seasonal_patterns: forecast.seasonalPatterns || [],
      model_confidence: forecast.modelConfidence,
      generated_at: generatedAt,
      expires_at: expiresAt
    }));

    // Upsert forecasts
    const { error: upsertError } = await supabase
      .from('ml_forecast_results')
      .upsert(forecastRows, {
        onConflict: 'country_code,metric_type,forecast_year,forecast_month,model_version'
      });

    if (upsertError) {
      console.error("Error storing forecasts:", upsertError);
    }

    return new Response(JSON.stringify({
      predictions: normalizedPredictions,
      riskFactors: forecast.riskFactors || [],
      opportunities: forecast.opportunities || [],
      overallTrend: forecast.overallTrend || '',
      seasonalPatterns: forecast.seasonalPatterns || [],
      anomaliesDetected: forecast.anomaliesDetected || [],
      modelConfidence: forecast.modelConfidence || 75,
      generatedAt,
      expiresAt,
      fromCache: false
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("ML Forecast error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erreur lors de la génération des prévisions ML" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
