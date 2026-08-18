import { ImageResponse } from "next/og";

export const alt = "Monitor de Gravata — o pesadelo de Brasília";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem de compartilhamento (WhatsApp, X, LinkedIn). Sem fonte externa — a CSP e o
 * runtime de imagem não baixam recursos de terceiros; usamos as famílias do sistema.
 */
export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#141210",
          color: "#f3ede0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          position: "relative",
        }}
      >
        {/* gravata gigante, marca d'água */}
        <div style={{ position: "absolute", right: -60, top: -40, opacity: 0.09, display: "flex" }}>
          <svg width="520" height="760" viewBox="0 0 64 128">
            <path d="M22 4h20l6 14-16 8-16-8z" fill="#f3ede0" />
            <path d="M18 26h28l8 66-22 32L10 92z" fill="#f3ede0" />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="46" height="92" viewBox="0 0 64 128">
            <path d="M22 4h20l6 14-16 8-16-8z" fill="#c8102e" />
            <path d="M18 26h28l8 66-22 32L10 92z" fill="#c8102e" />
          </svg>
          <div style={{ fontSize: 30, letterSpacing: 6, textTransform: "uppercase", opacity: 0.75 }}>Monitor de Gravata</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>O dinheiro é seu.</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -2, color: "#ffd400" }}>As contas são públicas.</div>
          <div style={{ fontSize: 40, opacity: 0.85, marginTop: 10 }}>O que falta é gente olhando.</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, opacity: 0.7 }}>
          <div style={{ display: "flex", gap: 24 }}>
            <span>políticos</span>
            <span style={{ color: "#c8102e" }}>·</span>
            <span>candidatos 2026</span>
            <span style={{ color: "#c8102e" }}>·</span>
            <span>contratos</span>
            <span style={{ color: "#c8102e" }}>·</span>
            <span>preços</span>
          </div>
          <div>monitor-de-gravata.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
