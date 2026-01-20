import { useEffect, useState } from "react";

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";

interface AICatalogData {
  "@context": string;
  "@type": string;
  name: string;
  numberOfItems: number;
  generatedAt: string;
  platform: {
    name: string;
    url: string;
    markets: string[];
    currency: string;
    language: string;
    paymentMethods: string[];
  };
  products: object[];
  businesses: object[];
  categories: object[];
  metadata: {
    totalProducts: number;
    totalBusinesses: number;
    cacheMaxAge: number;
  };
}

/**
 * AI Catalog Page - JSON endpoint for AI agents
 * Fetches and displays the product/business catalog with Schema.org markup
 */
const AICatalog = () => {
  const [catalog, setCatalog] = useState<AICatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set meta tags for AI crawlers
    document.title = "AI Catalog - Joie de Vivre";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "JSON-LD catalog of products and businesses for AI agents. Schema.org structured data.");
    }

    const metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      const meta = document.createElement("meta");
      meta.name = "robots";
      meta.content = "index, follow";
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/ai-catalog`
        );
        if (!response.ok) throw new Error("Failed to fetch catalog");
        const data = await response.json();
        setCatalog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Inject JSON-LD into head for AI crawlers
  useEffect(() => {
    if (catalog) {
      const existingScript = document.querySelector('script[data-ai-catalog]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-ai-catalog", "true");
      script.text = JSON.stringify(catalog);
      document.head.appendChild(script);
      
      return () => {
        const scriptToRemove = document.querySelector('script[data-ai-catalog]');
        if (scriptToRemove) {
          scriptToRemove.remove();
        }
      };
    }
  }, [catalog]);

  if (loading) {
    return (
      <div style={{ 
        fontFamily: "monospace", 
        padding: "20px",
        backgroundColor: "#1a1a2e",
        color: "#a0a0a0",
        minHeight: "100vh"
      }}>
        <pre>Loading AI catalog...</pre>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        fontFamily: "monospace", 
        padding: "20px",
        backgroundColor: "#1a1a2e",
        color: "#ff6b6b",
        minHeight: "100vh"
      }}>
        <pre>Error: {error}</pre>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: "monospace", 
      padding: "20px",
      backgroundColor: "#1a1a2e",
      color: "#e0e0e0",
      minHeight: "100vh"
    }}>
      <header style={{ marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <h1 style={{ color: "#7A5DC7", margin: 0 }}>Joie de Vivre - AI Catalog</h1>
        <p style={{ color: "#888", margin: "5px 0 0 0" }}>
          Schema.org JSON-LD structured data for AI agents
        </p>
        <p style={{ color: "#666", fontSize: "12px", margin: "5px 0 0 0" }}>
          Products: {catalog?.metadata?.totalProducts || 0} | 
          Businesses: {catalog?.metadata?.totalBusinesses || 0} | 
          Generated: {catalog?.generatedAt ? new Date(catalog.generatedAt).toLocaleString() : 'N/A'}
        </p>
      </header>
      <pre style={{ 
        whiteSpace: "pre-wrap", 
        wordWrap: "break-word",
        lineHeight: "1.4"
      }}>
        {JSON.stringify(catalog, null, 2)}
      </pre>
    </div>
  );
};

export default AICatalog;
