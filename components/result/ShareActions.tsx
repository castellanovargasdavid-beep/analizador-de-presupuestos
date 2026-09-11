"use client";

import { useState } from "react";
import { Button } from "../ui/Button";

/**
 * Guardar el resultado ya es automático (vive en Postgres bajo esta URL).
 * Lo que falta por resolver en el cliente es: compartir el enlace,
 * llevarse un resumen fuera del navegador, e imprimir/guardar como PDF —
 * las tres sin depender de ninguna librería nueva.
 */
export function ShareActions({ summaryText, fileName }: { summaryText: string; fileName: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (permiso denegado, contexto no seguro): no rompemos la página por esto.
    }
  }

  function downloadSummary() {
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <Button type="button" variant="secondary" onClick={copyLink}>
        {copied ? "¡Enlace copiado!" : "Copiar enlace para compartir"}
      </Button>
      <Button type="button" variant="secondary" onClick={downloadSummary}>
        Descargar resumen (.txt)
      </Button>
      <Button type="button" variant="secondary" onClick={() => window.print()}>
        Imprimir / Guardar como PDF
      </Button>
    </div>
  );
}
