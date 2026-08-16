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
          <span
            style={{
              fontSize: 58,
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
    size
  );
}
