import { CheckCircleIcon, ClockIcon, InfoIcon } from "@/components/ui/icons";
import type { ServiceAvailability } from "@/lib/catalog/repository";

const CONFIG: Record<ServiceAvailability, { label: string; className: string; icon: typeof CheckCircleIcon }> = {
  disponible: { label: "Calculadora disponible", className: "bg-good-bg text-good-text", icon: CheckCircleIcon },
  solo_solicitud: { label: "Solicitud sin calculadora", className: "bg-info-bg text-info-text", icon: InfoIcon },
  proximamente: { label: "Próximamente", className: "bg-neutral-100 text-neutral-600", icon: ClockIcon },
};

/**
 * Igual de importante que exista como que sea honesto: nunca se etiqueta
 * un servicio sin calculadora como "disponible", y el estado siempre va
 * con icono + texto, nunca solo color (misma convención que Badge).
 */
export function ServiceStatusBadge({ status }: { status: ServiceAvailability }) {
  const { label, className, icon: Icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
