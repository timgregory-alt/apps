"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onRate,
  disabled,
  size = 26,
}: {
  value: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          onMouseEnter={() => setHovered(star)}
          disabled={disabled}
          aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
          className="p-0.5 disabled:opacity-50"
        >
          <Star
            size={size}
            strokeWidth={1.75}
            className={cn(
              "transition-colors",
              star <= displayValue
                ? "fill-[var(--color-gold)] text-[var(--color-gold)]"
                : "fill-transparent text-[var(--color-charcoal)]/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
