import { ImageResponse } from "next/og";

export const alt = "Presupuesto Claro — calculadora de precios con metodología transparente";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagen OG por defecto para todo el sitio (las páginas que no definan la
 * suya propia heredan esta). Generada por código: nada que subir ni
 * mantener como asset binario, y consistente con la marca sin depender de
 * una fuente web descargada (solo system-ui, igual que el resto del sitio).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 90px",
          background: "linear-gradient(135deg, #0b1a2e 0%, #16345a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#2a6cb0",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            P
          </div>
          <div style={{ fontSize: 34, fontWeight: 700 }}>Presupuesto Claro</div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 52, fontWeight: 700, lineHeight: 1.15, maxWidth: 950 }}>
          ¿Te están cobrando de más?
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#b3d0ec", maxWidth: 900 }}>
          Calcula el rango de precio razonable y compara tu presupuesto real, con la fuente de cada dato a la vista.
        </div>
      </div>
    ),
    { ...size },
  );
}
