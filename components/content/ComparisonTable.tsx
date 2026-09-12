import type { ReactNode } from "react";

export interface ComparisonColumn {
  key: string;
  label: string;
}

export interface ComparisonRow {
  label: string;
  values: Record<string, ReactNode>;
}

/** Plantilla "Comparaciones": tabla genérica reutilizable para cualquier A vs. B futuro. */
export function ComparisonTable({ columns, rows }: { columns: ComparisonColumn[]; rows: ComparisonRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-neutral-500">
            <th className="py-2 pr-4 font-semibold"></th>
            {columns.map((col) => (
              <th key={col.key} className="py-2 pr-4 font-semibold text-neutral-950">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-neutral-100 align-top">
              <td className="py-3 pr-4 font-semibold text-neutral-950">{row.label}</td>
              {columns.map((col) => (
                <td key={col.key} className="py-3 pr-4 text-neutral-700">
                  {row.values[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
