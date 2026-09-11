export function StepIndicator({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-sm font-semibold text-neutral-500">
        <span>
          Paso {step} de {total}
        </span>
        <span>{label}</span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200">
        <div
          className="h-1.5 rounded-full bg-brand-600 transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
