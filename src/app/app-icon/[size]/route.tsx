import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const size = Math.min(1024, Math.max(32, Number(sizeParam) || 512));
  const maskable = request.nextUrl.searchParams.get("maskable") === "1";
  // Maskable icons need the glyph inset within a safe zone so platform masks don't clip it.
  const inset = maskable ? size * 0.16 : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5e1a2e",
        }}
      >
        <div
          style={{
            width: size - inset * 2,
            height: size - inset * 2,
            borderRadius: "50%",
            border: `${Math.max(2, size * 0.02)}px solid #b0904f`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: (size - inset * 2) * 0.34,
              color: "#f2ead9",
              fontFamily: "Georgia, serif",
              letterSpacing: -2,
            }}
          >
            TW
          </span>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
