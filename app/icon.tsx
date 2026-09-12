import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Icono generado por código (sin asset binario que mantener): mismo azul de
 * marca que el resto del sitio. Usa una letra ASCII simple ("P") en vez de
 * un glifo Unicode como "✓": `next/og` intenta descargar una fuente
 * dinámica para glifos fuera de la fuente base, y en un entorno sin acceso
 * a esa red la descarga falla y el glifo se renderiza como un cuadro
 * vacío — una letra latina básica siempre está cubierta por la fuente
 * integrada, sin depender de red.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16345a",
          borderRadius: 7,
          color: "white",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
