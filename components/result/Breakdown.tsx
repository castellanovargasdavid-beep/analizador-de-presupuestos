import { formatEUR } from "@/lib/format";
import type { EstimationLineItem } from "@/lib/pricing/types";
import { ConfidenceTag } from "./ConfidenceTag";

export function Breakdown({ lineItems }: { lineItems: EstimationLineItem[] }) {
  return (
    <div className="divide-y divide-neutral-100">
      {lineItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-2">
            <ConfidenceTag confidence={item.range.confidence} />
            <div>
              <p className="font-medium text-neutral-950">{item.label}</p>
              {!item.siempreIncluido && <p className="text-xs text-neutral-500">Partida opcional/condicional</p>}
            </div>
          </div>
          <p className="whitespace-nowrap font-semibold text-neutral-950">
            {formatEUR(item.range.min)} – {formatEUR(item.range.max)}
          </p>
        </div>
      ))}
    </div>
  );
}
