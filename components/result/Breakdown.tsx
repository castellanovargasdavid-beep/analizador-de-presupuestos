import { formatEUR } from "@/lib/format";
import type { Confidence } from "@/lib/estimation/types";
import { ConfidenceTag } from "./ConfidenceTag";

export interface BreakdownItem {
  key: string;
  label: string;
  min: number;
  max: number;
  confidence: Confidence;
  isOptional: boolean;
}

export function Breakdown({ items }: { items: BreakdownItem[] }) {
  return (
    <div className="divide-y divide-neutral-100">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <ConfidenceTag confidence={item.confidence} />
            <div>
              <p className="font-medium text-neutral-950">{item.label}</p>
              {item.isOptional && <p className="text-xs text-neutral-500">Partida opcional/condicional</p>}
            </div>
          </div>
          <p className="whitespace-nowrap font-semibold text-neutral-950">
            {formatEUR(item.min)} – {formatEUR(item.max)}
          </p>
        </div>
      ))}
    </div>
  );
}
