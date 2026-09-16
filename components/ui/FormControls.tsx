"use client";

import type { ReactNode } from "react";
import { CheckCircleIcon } from "./icons";

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-2">
      <span className="block text-sm font-semibold text-neutral-950">{children}</span>
      {hint && <span className="mt-0.5 block text-sm text-neutral-500">{hint}</span>}
    </div>
  );
}

export function RadioCardGroup<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  name: string;
  options: { value: T; title: string; description?: string; icon?: ReactNode }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <label
            key={opt.value}
            className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition-colors ${
              checked ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-neutral-200 hover:border-brand-300"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {checked && <CheckCircleIcon className="absolute right-3 top-3 size-5 text-brand-600" />}
            {opt.icon && (
              <span className={`mb-2 ${checked ? "text-brand-700" : "text-neutral-500"}`}>{opt.icon}</span>
            )}
            <span className="pr-6 font-semibold text-neutral-950">{opt.title}</span>
            {opt.description && <span className="mt-1 text-sm text-neutral-600">{opt.description}</span>}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Par de botones Sí/No (u otras dos opciones exclusivas) con el mismo
 * lenguaje visual que RadioCardGroup. Sustituye a los botones ad-hoc que
 * se repetían con clases inline en distintos pasos del asistente.
 */
export function ToggleButtonGroup<T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  name: string;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3" role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const checked = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
              checked ? "border-brand-600 bg-brand-50 text-brand-800 ring-1 ring-brand-600" : "border-neutral-200 text-neutral-600 hover:border-brand-300"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={Number.isNaN(value) ? "" : value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="w-32 rounded-lg border border-neutral-200 px-3 py-2 text-neutral-950 focus:border-brand-500 focus:outline-none"
      />
      {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  suffix,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-40 rounded-lg border border-neutral-200 px-3 py-2 text-neutral-950 focus:border-brand-500 focus:outline-none"
      />
      {suffix && <span className="text-sm text-neutral-500">{suffix}</span>}
    </div>
  );
}

export function CheckboxRow({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3 hover:bg-neutral-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
      />
      <span>
        <span className="block font-medium text-neutral-950">{label}</span>
        {hint && <span className="block text-sm text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}
