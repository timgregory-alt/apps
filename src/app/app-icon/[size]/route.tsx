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
          <svg
            width={(size - inset * 2) * 0.82}
            height={(size - inset * 2) * 0.82}
            viewBox="0 0 64 64"
          >
            <path
              d="M32 12 C27 10, 21 14, 23 20 C27 18, 31 14, 32 12 Z"
              fill="#cfb579"
            />
            <path
              d="M32 12 Q30 18 32 24"
              stroke="#cfb579"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            <g fill="#e8dcb8">
              <circle cx="25" cy="26" r="6.5" />
              <circle cx="39" cy="26" r="6.5" />
              <circle cx="18" cy="37" r="6.5" />
              <circle cx="32" cy="37" r="6.5" />
              <circle cx="46" cy="37" r="6.5" />
              <circle cx="25" cy="48" r="6.5" />
              <circle cx="39" cy="48" r="6.5" />
              <circle cx="32" cy="57" r="6" />
            </g>
          </svg>
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
