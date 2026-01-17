import { Gift } from "lucide-react";
import { forwardRef } from "react";

interface ProductShareCardProps {
  product: {
    name: string;
    price: number;
    currency: string;
    image: string;
    vendor: string;
  };
}

export const ProductShareCard = forwardRef<HTMLDivElement, ProductShareCardProps>(
  ({ product }, ref) => {
    const formattedPrice = `${product.price.toLocaleString()} ${product.currency}`;

    return (
      <div
        ref={ref}
        style={{
          width: 600,
          height: 315,
          background: "linear-gradient(135deg, #E8E2F5 0%, #FAD4E1 100%)",
          display: "flex",
          overflow: "hidden",
          fontFamily: "'Poppins', 'Nunito', sans-serif",
        }}
      >
        {/* Image produit (carré) */}
        <div
          style={{
            width: 315,
            height: 315,
            flexShrink: 0,
            overflow: "hidden",
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

        {/* Infos produit */}
        <div
          style={{
            flex: 1,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Nom et vendeur */}
          <div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#2E2E2E",
                margin: 0,
                lineHeight: 1.3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {product.name}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "#666",
                margin: "8px 0 0 0",
              }}
            >
              🏪 {product.vendor}
            </p>
          </div>

          {/* Prix */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#7A5DC7",
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
            <Gift
              style={{
                width: 20,
                height: 20,
                color: "#7A5DC7",
              }}
            />
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#7A5DC7",
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
