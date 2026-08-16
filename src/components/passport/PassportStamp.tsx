import { Wine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CheckinStatus } from "@/lib/types";

const SIZES = {
  sm: 88,
  md: 128,
  lg: 176,
} as const;

export function PassportStamp({
  name,
  city,
  status,
  size = "md",
  justStamped = false,
  className,
}: {
  name: string;
  city?: string;
  status: CheckinStatus;
  size?: keyof typeof SIZES;
  justStamped?: boolean;
  className?: string;
}) {
  const px = SIZES[size];
  const id = name.replace(/\s+/g, "-").toLowerCase();
  const visited = status !== "not_visited";
  const arcPathId = `stamp-arc-${id}`;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center gap-2", className)}
      style={{ width: px }}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-500",
          visited ? "text-[var(--color-burgundy)]" : "text-[var(--color-charcoal)]/25",
          justStamped && "animate-stamp-in"
        )}
        style={{ width: px, height: px, transform: visited ? "rotate(-8deg)" : "rotate(0deg)" }}
      >
        <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
          <defs>
            <path id={arcPathId} d="M 30,105 A 70,70 0 1 1 170,105" fill="none" />
          </defs>
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="currentColor"
            strokeWidth={visited ? 2.5 : 1.5}
            strokeDasharray={visited ? undefined : "4 6"}
            opacity={visited ? 0.9 : 0.6}
          />
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth={visited ? 1.5 : 1}
            opacity={visited ? 0.55 : 0.35}
          />
          {visited && (
            <text
              fill="currentColor"
              fontSize="12.5"
              letterSpacing="3"
              fontWeight={600}
              opacity={0.9}
            >
              <textPath href={`#${arcPathId}`} startOffset="50%" textAnchor="middle">
                {(city ?? "TENNESSEE").toUpperCase()} · TN
              </textPath>
            </text>
          )}
        </svg>

        <div className="relative flex flex-col items-center justify-center px-6 text-center">
          <Wine
            className={cn("mb-1", visited ? "opacity-90" : "opacity-40")}
            size={px * 0.18}
            strokeWidth={1.5}
          />
          <span
            className={cn(
              "font-serif-display leading-tight",
              visited ? "opacity-95" : "opacity-50"
            )}
            style={{ fontSize: px * 0.1 }}
          >
            {name}
          </span>
        </div>

        {justStamped && (
          <>
            <Sparkle className="absolute -right-1 top-2" delay="0s" />
            <Sparkle className="absolute -left-2 bottom-6" delay="0.3s" />
            <Sparkle className="absolute right-6 -top-2" delay="0.6s" />
          </>
        )}
      </div>
      {status === "completed" && (
        <span className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-[var(--color-gold)]">
          Completed
        </span>
      )}
    </div>
  );
}

function Sparkle({ className, delay }: { className?: string; delay: string }) {
  return (
    <span
      className={cn("animate-sparkle text-[var(--color-gold)]", className)}
      style={{ animationDelay: delay }}
      aria-hidden="true"
    >
      ✦
    </span>
  );
}
