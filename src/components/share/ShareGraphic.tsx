import { forwardRef } from "react";

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

interface ShareGraphicProps {
  /** e.g. "✓ WOODFEATHER FARM" or the completion headline */
  headline: string;
  subheadline: string;
  tagline?: string;
  visited: number;
  total: number;
  /** Optional per-stop checklist shown on the completion share graphic */
  checklist?: string[];
}

/**
 * The literal pixel-dimension Instagram Stories graphic (1080×1920), rendered
 * off-screen and rasterized with html-to-image. Kept as a plain component so
 * the same template can be reused for both a single check-in and the full
 * passport completion share.
 */
export const ShareGraphic = forwardRef<HTMLDivElement, ShareGraphicProps>(function ShareGraphic(
  { headline, subheadline, tagline, visited, total, checklist },
  ref
) {
  const dots = Array.from({ length: total }, (_, i) => i < visited);

  return (
    <div
      ref={ref}
      style={{
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        background:
          "radial-gradient(circle at 50% 0%, #7c2a41 0%, #5e1a2e 42%, #24211d 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 90px",
        fontFamily: "var(--font-inter), sans-serif",
        color: "#faf6ee",
        textAlign: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 30%, rgba(232,220,184,0.16), transparent 60%)",
        }}
      />

      <div
        style={{
          border: "1.5px solid rgba(232,220,184,0.55)",
          borderRadius: 32,
          padding: "72px 56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          position: "relative",
        }}
      >
        <p
          style={{
            fontSize: 30,
            letterSpacing: 8,
            fontWeight: 600,
            color: "#cfb579",
            margin: 0,
          }}
        >
          TENNESSEE WINE PASSPORT
        </p>

        <div style={{ height: 1, width: 140, background: "#b0904f" }} />

        <p
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 66,
            lineHeight: 1.15,
            margin: 0,
            maxWidth: 760,
          }}
        >
          {headline}
        </p>

        <p style={{ fontSize: 34, letterSpacing: 3, color: "#e8dcb8", margin: 0 }}>
          {subheadline}
        </p>

        {checklist && checklist.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
            {checklist.map((name) => (
              <p
                key={name}
                style={{ fontSize: 30, letterSpacing: 1, color: "#faf6ee", margin: 0 }}
              >
                ✓ {name}
              </p>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
            {dots.map((filled, i) => (
              <span
                key={i}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: filled ? "#cfb579" : "transparent",
                  border: "2px solid #cfb579",
                }}
              />
            ))}
          </div>
        )}

        {tagline && (
          <p
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: 40,
              color: "#faf6ee",
              marginTop: 16,
            }}
          >
            {tagline}
          </p>
        )}
      </div>

      <p
        style={{
          position: "absolute",
          bottom: 90,
          fontSize: 24,
          letterSpacing: 3,
          color: "rgba(250,246,238,0.6)",
        }}
      >
        tennesseewinepassport.com
      </p>
    </div>
  );
});

export const SHARE_GRAPHIC_DIMENSIONS = { width: STORY_WIDTH, height: STORY_HEIGHT };
