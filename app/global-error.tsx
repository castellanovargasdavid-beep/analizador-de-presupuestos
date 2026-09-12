"use client";

import { useEffect } from "react";

/**
 * Solo se activa si falla el propio layout raíz (algo que en la práctica
 * casi nunca ocurre, porque el layout raíz no hace fetch de datos). Debe
 * definir su propio <html>/<body> y NO hereda globals.css ni Tailwind
 * (documentado explícitamente por Next.js), así que todo aquí es CSS
 * inline — nada de clases de utilidad que dependan de una hoja de estilos
 * que este documento no carga.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          background: "#f9f9f7",
          color: "#0b0b0b",
        }}
      >
        <div style={{ maxWidth: 420, padding: "0 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Algo ha ido mal</h1>
          <p style={{ marginTop: 12, color: "#52514e" }}>
            No hemos podido cargar Presupuesto Claro. Puede ser un problema temporal — inténtalo de nuevo en un
            momento.
          </p>
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: 20,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#1f5590",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
