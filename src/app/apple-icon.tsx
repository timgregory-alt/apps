import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5e1a2e",
        }}
      >
        <div
          style={{
            width: 148,
            height: 148,
            borderRadius: "50%",
            border: "3px solid #b0904f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="122" height="122" viewBox="0 0 64 64">
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
    size
  );
}
