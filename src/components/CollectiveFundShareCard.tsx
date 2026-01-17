import { forwardRef } from "react";
import { Gift, Users } from "lucide-react";

interface CollectiveFundShareCardProps {
  fund: {
    title: string;
    beneficiaryName: string;
    targetAmount: number;
    currentAmount: number;
    currency: string;
    productImage?: string;
    productName?: string;
    occasion?: string;
  };
}

export const CollectiveFundShareCard = forwardRef<HTMLDivElement, CollectiveFundShareCardProps>(
  ({ fund }, ref) => {
    const progressPercent = Math.min(
      Math.round((fund.currentAmount / fund.targetAmount) * 100),
      100
    );

    const formatAmount = (amount: number) => {
      return new Intl.NumberFormat("fr-FR").format(amount);
    };

    const getOccasionEmoji = (occasion?: string) => {
      const emojis: Record<string, string> = {
        birthday: "🎂",
        wedding: "💒",
        graduation: "🎓",
        baby: "👶",
        retirement: "🎉",
        promotion: "🚀",
        other: "🎁",
      };
      return emojis[occasion || "other"] || "🎁";
    };

    return (
      <div
        ref={ref}
        className="w-[600px] h-[315px] relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #7A5DC7 0%, #C084FC 50%, #FAD4E1 100%)",
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-6xl">🎁</div>
          <div className="absolute bottom-4 left-4 text-4xl">✨</div>
          <div className="absolute top-1/2 right-1/4 text-3xl">🎉</div>
        </div>

        <div className="relative h-full flex p-6 gap-6">
          {/* Left: Product Image */}
          <div className="flex-shrink-0 w-[180px] h-full flex items-center justify-center">
            {fund.productImage ? (
              <div className="w-full h-[200px] rounded-2xl overflow-hidden shadow-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <img
                  src={fund.productImage}
                  alt={fund.productName || "Produit"}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            ) : (
              <div className="w-full h-[200px] rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Gift className="w-16 h-16 text-white/80" />
              </div>
            )}
          </div>

          {/* Right: Fund Info */}
          <div className="flex-1 flex flex-col justify-center text-white">
            {/* Occasion badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 w-fit mb-3">
              <span className="text-lg">{getOccasionEmoji(fund.occasion)}</span>
              <span className="text-sm font-medium">Cagnotte collective</span>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-2 line-clamp-2 drop-shadow-lg">
              {fund.title}
            </h2>

            {/* Beneficiary */}
            <div className="flex items-center gap-2 mb-4 text-white/90">
              <Users className="w-4 h-4" />
              <span className="text-sm">Pour {fund.beneficiaryName}</span>
            </div>

            {/* Product name if available */}
            {fund.productName && (
              <p className="text-sm text-white/80 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                {fund.productName}
              </p>
            )}

            {/* Progress bar */}
            <div className="mb-2">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    background: "linear-gradient(90deg, #FFD700 0%, #FFA500 100%)",
                  }}
                />
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">
                {formatAmount(fund.currentAmount)} {fund.currency}
              </span>
              <span className="text-white/70">
                / {formatAmount(fund.targetAmount)} {fund.currency}
              </span>
              <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm font-semibold">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2 text-white/90">
          <span className="text-xl">🎉</span>
          <span className="text-sm font-semibold tracking-wide">JOIE DE VIVRE</span>
        </div>
      </div>
    );
  }
);

CollectiveFundShareCard.displayName = "CollectiveFundShareCard";
