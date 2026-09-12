"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button, LinkButton } from "@/components/ui/Button";
import { AlertTriangleIcon } from "@/components/ui/icons";

/**
 * Boundary de error de segmento (Next 16: la prop se llama `retry`, no
 * `reset` — `reset` sigue existiendo pero `retry` es la recomendada desde
 * v16.3). Nunca se muestra `error.message` al usuario: en producción Next
 * ya lo sustituye por un mensaje genérico salvo que nosotros mismos lo
 * hayamos escrito pensando en que lo vea un usuario (ver
 * lib/errors/safe-message.ts) — pero este boundary atrapa fallos no
 * previstos (una página que no pasó por una Server Action), así que aquí
 * el mensaje SIEMPRE es genérico.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="max-w-xl py-24 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-critical-bg">
        <AlertTriangleIcon className="size-6 text-critical-text" />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-neutral-950">Algo ha ido mal</h1>
      <p className="mt-2 text-neutral-700">
        No hemos podido cargar esta página. Puede ser un problema temporal en nuestro servidor — inténtalo de nuevo
        en un momento.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={retry}>
          Reintentar
        </Button>
        <LinkButton href="/" variant="secondary">
          Ir al inicio
        </LinkButton>
      </div>
    </Container>
  );
}
