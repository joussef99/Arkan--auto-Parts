import React, { useState, useEffect } from "react";

interface LabelProps {
  product: {
    id: number;
    part_name_ar?: string;
    name?: string;
    barcode?: string;
    selling_price?: number;
    cost_price?: number;
  };
  showPrice?: boolean;
  size?: "small" | "medium" | "large";
}

/**
 * Reusable barcode label component
 * Displays product name, barcode image, barcode text, and optional price
 */
export const Label: React.FC<LabelProps> = ({ 
  product, 
  showPrice = true,
  size = "medium"
}) => {
  const [barcodeUrl, setBarcodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const productName = product.part_name_ar || product.name || "غير محدد";
  const barcode = product.barcode || "";
  const price = product.selling_price || product.cost_price || 0;

  useEffect(() => {
    if (barcode) {
      // Use timestamp to prevent caching issues
      setBarcodeUrl(`/api/barcode/${encodeURIComponent(barcode)}?t=${Date.now()}`);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [barcode]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error("Barcode failed to load for:", barcode);
    // e.currentTarget.style.display = "none";
  };

  // Size-based styling
  const sizeClasses = {
    small: {
      container: "p-1",
      name: "text-[6px]",
      barcode: "h-6",
      text: "text-[5px]",
      price: "text-[7px]",
    },
    medium: {
      container: "p-1.5",
      name: "text-[7px]",
      barcode: "h-8",
      text: "text-[6px]",
      price: "text-[8px]",
    },
    large: {
      container: "p-2",
      name: "text-[8px]",
      barcode: "h-10",
      text: "text-[7px]",
      price: "text-[9px]",
    },
  };

  const styles = sizeClasses[size];

  if (!barcode) {
    return (
      <div className={`bg-white border border-slate-200 rounded text-center ${styles.container}`}>
        <div className="text-slate-400 text-xs">لا يوجد باركود</div>
        <div className="font-bold text-[8px] mt-1 truncate">{productName}</div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-300 rounded flex flex-col items-center justify-between ${styles.container}`}>
      {/* Product Name */}
      <div className={`font-bold text-slate-800 truncate w-full text-center ${styles.name}`}>
        {productName}
      </div>

      {/* Barcode Image */}
      <div className="flex items-center justify-center my-0.5">
        {isLoading ? (
          <div className={`${styles.barcode} w-full bg-slate-100 animate-pulse rounded`} />
        ) : (
          <img
            src={barcodeUrl}
            alt={`باركود ${barcode}`}
            className={`max-w-full object-contain ${styles.barcode}`}
            onError={handleImageError}
          />
        )}
      </div>

      {/* Barcode Text */}
      <div className={`font-mono text-slate-600 ${styles.text}`}>
        {barcode}
      </div>

      {/* Price (optional) */}
      {showPrice && price > 0 && (
        <div className={`font-bold text-slate-800 mt-0.5 ${styles.price}`}>
          {price.toFixed(2)} د.ل
        </div>
      )}
    </div>
  );
};

export default Label;