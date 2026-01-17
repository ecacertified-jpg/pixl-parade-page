import { Gift, Sparkles } from "lucide-react";
import { forwardRef } from "react";
import type { ShareCardTemplate } from "./ProductShareCardCustomizer";

interface ProductShareCardProps {
  product: {
    name: string;
    price: number;
    currency: string;
    image: string;
    vendor: string;
  };
  template?: ShareCardTemplate;
  personalMessage?: string;
}

// Template style configurations
const templateStyles = {
  classic: {
    background: "linear-gradient(135deg, #E8E2F5 0%, #FAD4E1 100%)",
    textColor: "#2E2E2E",
    accentColor: "#7A5DC7",
    vendorColor: "#666",
    messageBackground: "rgba(122, 93, 199, 0.1)",
    messageBorder: "rgba(122, 93, 199, 0.3)",
  },
  festive: {
    background: "linear-gradient(135deg, #7A5DC7 0%, #FF85A1 50%, #FFD700 100%)",
    textColor: "#FFFFFF",
    accentColor: "#FFD700",
    vendorColor: "rgba(255, 255, 255, 0.8)",
    messageBackground: "rgba(255, 255, 255, 0.2)",
    messageBorder: "rgba(255, 215, 0, 0.5)",
  },
  elegance: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
    textColor: "#FFFFFF",
    accentColor: "#D4AF37",
    vendorColor: "rgba(255, 255, 255, 0.7)",
    messageBackground: "rgba(212, 175, 55, 0.1)",
    messageBorder: "rgba(212, 175, 55, 0.4)",
  },
  minimal: {
    background: "#FFFFFF",
    textColor: "#1a1a1a",
    accentColor: "#7A5DC7",
    vendorColor: "#666",
    messageBackground: "rgba(122, 93, 199, 0.05)",
    messageBorder: "rgba(122, 93, 199, 0.2)",
  },
};

export const ProductShareCard = forwardRef<HTMLDivElement, ProductShareCardProps>(
  ({ product, template = "classic", personalMessage }, ref) => {
    const formattedPrice = `${product.price.toLocaleString()} ${product.currency}`;
    const styles = templateStyles[template];
    const hasMessage = personalMessage && personalMessage.trim().length > 0;

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          height: 315,
          background: styles.background,
          display: "flex",
          overflow: "hidden",
          fontFamily: "'Poppins', 'Nunito', sans-serif",
          position: "relative",
          border: template === "minimal" ? "2px solid #e5e5e5" : "none",
        }}
      >
        {/* Festive decorations */}
        {template === "festive" && (
          <>
            <div style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontSize: 24,
              opacity: 0.8,
            }}>
              🎉
            </div>
            <div style={{
              position: "absolute",
              bottom: 10,
              left: 320,
              fontSize: 20,
              opacity: 0.6,
            }}>
              ✨
            </div>
            <div style={{
              position: "absolute",
              top: 50,
              right: 50,
              fontSize: 16,
              opacity: 0.5,
            }}>
              🎁
            </div>
          </>
        )}

        {/* Elegance border on image */}
        <div
          style={{
            width: 315,
            height: 315,
            flexShrink: 0,
            overflow: "hidden",
            border: template === "elegance" ? "3px solid #D4AF37" : "none",
          }}
        >
          <img
            src={product.image}
            alt={product.name}
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Product info */}
        <div
          style={{
            flex: 1,
            padding: hasMessage ? 16 : 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Name and vendor */}
          <div>
            <h2
              style={{
                fontSize: hasMessage ? 18 : 22,
                fontWeight: 700,
                color: styles.textColor,
                margin: 0,
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                fontStyle: template === "elegance" ? "normal" : "normal",
                letterSpacing: template === "elegance" ? "0.5px" : "normal",
                textShadow: template === "festive" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {product.name}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: styles.vendorColor,
                margin: "6px 0 0 0",
              }}
            >
              🏪 {product.vendor}
            </p>
          </div>

          {/* Personal message */}
          {hasMessage && (
            <div
              style={{
                background: styles.messageBackground,
                border: `1px solid ${styles.messageBorder}`,
                borderRadius: 8,
                padding: "8px 12px",
                marginTop: 8,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: styles.textColor,
                  margin: 0,
                  fontStyle: "italic",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                "{personalMessage}"
              </p>
            </div>
          )}

          {/* Price */}
          <div
            style={{
              fontSize: hasMessage ? 24 : 28,
              fontWeight: 700,
              color: styles.accentColor,
              textShadow: template === "festive" ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
            }}
          >
            {formattedPrice}
          </div>

          {/* Branding JOIE DE VIVRE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {template === "festive" ? (
              <Sparkles
                style={{
                  width: 20,
                  height: 20,
                  color: styles.accentColor,
                }}
              />
            ) : (
              <Gift
                style={{
                  width: 20,
                  height: 20,
                  color: styles.accentColor,
                }}
              />
            )}
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: styles.accentColor,
                letterSpacing: template === "elegance" ? "2px" : "normal",
              }}
            >
              JOIE DE VIVRE
            </span>
          </div>
        </div>
      </div>
    );
  }
);

ProductShareCard.displayName = "ProductShareCard";
