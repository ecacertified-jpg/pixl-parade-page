import { Home, ShoppingBag, ShoppingCart, CreditCard, CheckCircle } from "lucide-react";
import { BaseBreadcrumb, BreadcrumbItemConfig } from "./BaseBreadcrumb";

type CheckoutStep = "cart" | "checkout" | "confirmation";

interface CheckoutBreadcrumbProps {
  step: CheckoutStep;
}

/**
 * CheckoutBreadcrumb - For the checkout flow (Cart → Checkout → Confirmation)
 * Path: Accueil > Boutique > Panier > Paiement > Confirmation
 */
export function CheckoutBreadcrumb({ step }: CheckoutBreadcrumbProps) {
  const items: BreadcrumbItemConfig[] = [
    { 
      label: "Accueil", 
      path: "/", 
      icon: <Home className="h-3.5 w-3.5" />, 
      hideTextOnMobile: true 
    },
    { 
      label: "Boutique", 
      path: "/shop", 
      icon: <ShoppingBag className="h-3.5 w-3.5" />,
      hideTextOnMobile: true
    },
    { 
      label: "Panier", 
      path: "/cart", 
      icon: <ShoppingCart className="h-3.5 w-3.5" />, 
      isCurrent: step === "cart" 
    },
  ];

  if (step === "checkout" || step === "confirmation") {
    items.push({ 
      label: "Paiement", 
      path: "/checkout", 
      icon: <CreditCard className="h-3.5 w-3.5" />, 
      isCurrent: step === "checkout" 
    });
  }

  if (step === "confirmation") {
    items.push({ 
      label: "Confirmation", 
      path: "#", 
      icon: <CheckCircle className="h-3.5 w-3.5" />, 
      isCurrent: true 
    });
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border/30">
      <BaseBreadcrumb 
        items={items} 
        containerClassName="max-w-4xl mx-auto px-4 py-2" 
      />
    </div>
  );
}
