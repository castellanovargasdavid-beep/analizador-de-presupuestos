"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatEUR } from "@/lib/format";

export interface RangeMatrixEntry {
  systemTypeSlug: string;
  systemTypeLabel: string;
  materialLevelSlug: string | null;
  materialLevelLabel: string | null;
  min: number;
  max: number;
}

/**
 * Herramienta de consulta instantánea (no el wizard completo): elige tipo
 * de sistema y gama, y ve el rango ya calculado. Todos los valores vienen
 * precalculados con el mismo motor que la calculadora completa — no son
 * cifras de un artículo, y por eso no se puede desincronizar de ella.
 */
export function QuickRangeLookup({ matrix }: { matrix: RangeMatrixEntry[] }) {
  const systemTypes = useMemo(
    () => Array.from(new Map(matrix.map((m) => [m.systemTypeSlug, m.systemTypeLabel])).entries()),
    [matrix],
  );
  const [systemTypeSlug, setSystemTypeSlug] = useState(systemTypes[0]?.[0] ?? "");

  const materialLevels = useMemo(
    () =>
      Array.from(
        new Map(
          matrix
            .filter((m) => m.systemTypeSlug === systemTypeSlug && m.materialLevelSlug)
            .map((m) => [m.materialLevelSlug as string, m.materialLevelLabel as string]),
        ).entries(),
      ),
    [matrix, systemTypeSlug],
  );
  const [materialLevelSlug, setMaterialLevelSlug] = useState<string | null>(materialLevels[0]?.[0] ?? null);

  const match = matrix.find(
    (m) => m.systemTypeSlug === systemTypeSlug && (materialLevels.length === 0 || m.materialLevelSlug === materialLevelSlug),
  );

  function handleSystemTypeChange(slug: string) {
    setSystemTypeSlug(slug);
    const firstLevel = matrix.find((m) => m.systemTypeSlug === slug && m.materialLevelSlug)?.materialLevelSlug ?? null;
    setMaterialLevelSlug(firstLevel);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-semibold text-neutral-950" htmlFor="quick-system-type">
            Tipo de sistema
          </label>
          <select
            id="quick-system-type"
            value={systemTypeSlug}
            onChange={(e) => handleSystemTypeChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-neutral-950 focus:border-brand-500 focus:outline-none"
          >
            {systemTypes.map(([slug, label]) => (
              <option key={slug} value={slug}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {materialLevels.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-neutral-950" htmlFor="quick-material-level">
              Gama del equipo
            </label>
            <select
              id="quick-material-level"
              value={materialLevelSlug ?? ""}
              onChange={(e) => setMaterialLevelSlug(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-neutral-950 focus:border-brand-500 focus:outline-none"
            >
              {materialLevels.map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {match && (
        <div className="mt-6 border-t border-neutral-100 pt-6">
          <p className="text-sm font-semibold text-neutral-500">Estimación orientativa (IVA incluido)</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-brand-800">
            {formatEUR(match.min)} – {formatEUR(match.max)}
          </p>
        </div>
      )}

      <Link
        href="/aire-acondicionado/instalacion"
        className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline"
      >
        Calcular tu caso exacto (con metros de línea, retirada de equipo, ubicación...) →
      </Link>
    </div>
  );
}
