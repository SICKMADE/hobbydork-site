import React from "react";
import { Star } from "lucide-react";

export function StarRating({ avg, count, size = 18 }: { avg: number | null, count?: number, size?: number }) {
  const rounded = avg ? Math.round(avg * 2) / 2 : 0;
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((n) => (
        <Star
          key={n}
          size={size}
          className={
            n <= Math.floor(rounded)
              ? "text-yellow-400 fill-yellow-400"
              : n - 0.5 === rounded
                ? "text-yellow-400/80 fill-yellow-400/80"
                : "text-muted-foreground"
          }
        />
      ))}
      {typeof avg === "number" && count !== undefined && (
        <span className="ml-2 text-xs text-muted-foreground font-semibold">
          {avg.toFixed(1)}
          {count > 0 ? ` (${count})` : " (No reviews)"}
        </span>
      )}
    </div>
  );
}
