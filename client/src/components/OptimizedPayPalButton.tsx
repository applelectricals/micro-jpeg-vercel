import { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

// Lazy load the PayPal button to improve initial page load
const PayPalButton = lazy(() => import("./PayPalButton"));

interface OptimizedPayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
  className?: string;
  children?: React.ReactNode;
}

export default function OptimizedPayPalButton({
  amount,
  currency,
  intent,
  className = "",
  children,
}: OptimizedPayPalButtonProps) {
  const [shouldLoadPayPal, setShouldLoadPayPal] = useState(false);
  const [isUserInterested, setIsUserInterested] = useState(false);

  // Only load PayPal when user shows intent to use it
  const handleLoadPayPal = () => {
    setIsUserInterested(true);
    setShouldLoadPayPal(true);
  };

  // Preload PayPal after a delay if user hasn't interacted
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isUserInterested) {
        setShouldLoadPayPal(true);
      }
    }, 3000); // Load after 3 seconds if user hasn't interacted

    return () => clearTimeout(timer);
  }, [isUserInterested]);

  if (!shouldLoadPayPal) {
    return (
      <Button
        onClick={handleLoadPayPal}
        className={`${className} bg-[#0070ba] hover:bg-[#005ea6] text-white font-medium`}
      >
        {children || "Pay with PayPal"}
      </Button>
    );
  }

  return (
    <Suspense
      fallback={
        <Button className={className} disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading PayPal...
        </Button>
      }
    >
      <PayPalButton amount={amount} currency={currency} intent={intent} />
    </Suspense>
  );
}