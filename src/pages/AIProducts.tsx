import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SUPABASE_URL = "https://vaimfeurvzokepqqqrsl.supabase.co";

interface AICatalogData {
  '@context': string;
  '@type': string;
  name: string;
  numberOfItems: number;
  generatedAt: string;
  filters: {
    category: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    sort: string;
    businessId: string | null;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  itemListElement: Array<{
    '@type': string;
    id: string;
    name: string;
    price: number;
    currency: string;
  }>;
}

const AIProducts = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<AICatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up meta tags on mount
  useEffect(() => {
    document.title = "Products API - Joie de Vivre";
    
    // Add meta tags for AI crawlers
    const metaTags = [
      { name: "robots", content: "index, follow" },
      { name: "description", content: "JSON API endpoint for AI agents - Filtered products from Joie de Vivre marketplace" },
      { property: "og:title", content: "Products API - Joie de Vivre" },
      { property: "og:type", content: "website" },
    ];
    
    const createdTags: HTMLMetaElement[] = [];
    metaTags.forEach(({ name, property, content }) => {
      const meta = document.createElement("meta");
      if (name) meta.name = name;
      if (property) meta.setAttribute("property", property);
      meta.content = content;
      document.head.appendChild(meta);
      createdTags.push(meta);
    });
    
    return () => {
      createdTags.forEach(tag => tag.remove());
    };
  }, []);

  // Fetch products with query params
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Forward all query params to edge function
        const params = new URLSearchParams(searchParams);
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/ai-products?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch products");
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  // Inject JSON-LD into document head
  useEffect(() => {
    if (data) {
      const existingScript = document.querySelector('script[data-ai-products]');
      if (existingScript) existingScript.remove();
      
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-ai-products", "true");
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      
      return () => {
        const s = document.querySelector('script[data-ai-products]');
        if (s) s.remove();
      };
    }
  }, [data]);

  if (loading) {
    return (
      <pre style={{ 
        padding: "20px", 
        fontFamily: "monospace",
        backgroundColor: "#1a1a2e", 
        color: "#e0e0e0", 
        minHeight: "100vh",
        margin: 0
      }}>
        Loading products...
      </pre>
    );
  }

  if (error) {
    return (
      <pre style={{ 
        padding: "20px", 
        fontFamily: "monospace",
        backgroundColor: "#1a1a2e", 
        color: "#ff6b6b", 
        minHeight: "100vh",
        margin: 0
      }}>
        Error: {error}
      </pre>
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
        <h1 style={{ color: "#7A5DC7", margin: "0 0 5px 0", fontSize: "1.5rem" }}>
          Products API
        </h1>
        <p style={{ color: "#888", margin: "0 0 5px 0", fontSize: "0.9rem" }}>
          Filtered product data for AI agents • Schema.org ItemList format
        </p>
        <p style={{ color: "#666", fontSize: "0.75rem", margin: 0 }}>
          Items: {data?.numberOfItems || 0} | 
          Filters: {JSON.stringify(data?.filters || {})} | 
          Generated: {data?.generatedAt?.split('T')[0] || 'N/A'}
        </p>
      </header>
      <pre style={{ 
        whiteSpace: "pre-wrap", 
        wordWrap: "break-word",
        backgroundColor: "#0d0d1a",
        padding: "15px",
        borderRadius: "8px",
        border: "1px solid #333"
      }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default AIProducts;
