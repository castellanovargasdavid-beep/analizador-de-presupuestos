import Link from "next/link";

/** Nota de cierre obligatoria en toda página que use datos del motor de precios. */
export function SourcesNote({ note }: { note?: string }) {
  return (
    <p className="border-t border-neutral-200 pt-6 text-sm text-neutral-500">
      {note ? `${note} ` : ""}
      Los datos usados en esta página están documentados en{" "}
      <Link href="/fuentes" className="font-semibold text-brand-700 hover:underline">
        fuentes
      </Link>{" "}
      y explicados en la{" "}
      <Link href="/metodologia" className="font-semibold text-brand-700 hover:underline">
        metodología
      </Link>
      . Esto no es una tasación profesional.
    </p>
  );
}
