import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone para iOS/Android — a gravata do projeto sobre a cor de tinta. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#141210", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="120" height="120" viewBox="0 0 64 64">
          <g transform="translate(20 6)">
            <path d="M3 2h18l5 12-14 7-14-7z" fill="#c8102e" />
            <path d="M0 22h24l7 26-19 13L-7 48z" fill="#c8102e" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
