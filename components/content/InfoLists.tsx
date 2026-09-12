import { CheckCircleIcon, AlertTriangleIcon, InfoIcon } from "@/components/ui/icons";
import type { ReactNode } from "react";

function List({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="flex items-center gap-2 text-xl font-bold text-neutral-950">
        {icon}
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/** "Variables que afectan al precio" */
export function VariablesList({ items }: { items: string[] }) {
  return <List title="Qué mueve el precio" icon={<InfoIcon className="size-5 text-info-text" />} items={items} />;
}

/** "Consejos" */
export function TipsList({ items }: { items: string[] }) {
  return <List title="Consejos" icon={<CheckCircleIcon className="size-5 text-good-text" />} items={items} />;
}

/** "Errores habituales" */
export function MistakesList({ items }: { items: string[] }) {
  return (
    <List title="Errores habituales" icon={<AlertTriangleIcon className="size-5 text-warning-text" />} items={items} />
  );
}
