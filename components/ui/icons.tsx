/** Iconos mínimos en SVG inline — sin librería externa, sin dependencia de red. */
import type { ReactElement } from "react";

export function CheckCircleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16Zm3.857-9.323a.75.75 0 00-1.214-.882l-3.483 4.79-1.68-1.68a.75.75 0 00-1.06 1.061l2.32 2.32a.75.75 0 001.137-.089l4-5.52Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AlertTriangleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75Zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function InfoIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 112 10a8 8 0 0116 0Zm-7-4a1 1 0 11-2 0 1 1 0 012 0Zm-1 3a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ArrowRightIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function ShieldIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"
      />
    </svg>
  );
}

export function ChevronDownIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Split de 1 unidad interior: una sola unidad montada en pared. */
export function AcSingleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="3" y="6" width="14" height="5" rx="1.5" strokeLinejoin="round" />
      <circle cx="6" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" d="M5 13.5v2M9 13.5v3M13 13.5v2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 15v3a1.5 1.5 0 001.5 1.5H21" />
    </svg>
  );
}

/** Multisplit de 2 unidades interiores conectadas a una sola exterior. */
export function AcDoubleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="1.5" y="4.5" width="10" height="4.5" rx="1.2" strokeLinejoin="round" />
      <rect x="1.5" y="13" width="10" height="4.5" rx="1.2" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 6.75H18.5a1.5 1.5 0 011.5 1.5V15.25" />
      <rect x="18" y="15" width="4.5" height="6" rx="1" strokeLinejoin="round" />
    </svg>
  );
}

/** Multisplit de 3 unidades interiores conectadas a una sola exterior. */
export function AcTripleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="1" y="2.5" width="9" height="4" rx="1.1" strokeLinejoin="round" />
      <rect x="1" y="10" width="9" height="4" rx="1.1" strokeLinejoin="round" />
      <rect x="1" y="17.5" width="9" height="4" rx="1.1" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 4.5H17.5a1.5 1.5 0 011.5 1.5V15.25" />
      <rect x="18" y="15" width="4.5" height="6" rx="1" strokeLinejoin="round" />
    </svg>
  );
}

/** Sistema por conductos: rejilla de techo. */
export function AcDuctIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1.5" strokeLinejoin="round" />
      <path strokeLinecap="round" d="M6 8h12M6 12h12M6 16h12" />
    </svg>
  );
}

/** Copo de nieve — climatización. */
export function SnowflakeIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" />
      <path strokeLinecap="round" d="M12 2l-2 2m2-2l2 2M12 22l-2-2m2 2l2-2M4.5 6.5l2.7-.4m-2.7.4l.6 2.6M19.5 6.5l-2.7-.4m2.7.4l-.6 2.6M19.5 17.5l-2.7.4m2.7-.4l-.6-2.6M4.5 17.5l2.7.4m-2.7-.4l.6-2.6" />
    </svg>
  );
}

/** Llana de albañil — reformas/obra. */
export function TrowelIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3l7 7-8.5 8.5-7-7L14 3Z" />
      <path strokeLinecap="round" d="M4.5 19.5l3-3" />
    </svg>
  );
}

/** Rodillo de pintor. */
export function PaintIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <rect x="3" y="4" width="12" height="6" rx="1.5" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 10v4h4a2 2 0 012 2v4" />
    </svg>
  );
}

/** Llave inglesa — fontanería/instalaciones. */
export function WrenchIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.7 6.3a4 4 0 00-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 005.4-5.4l-2.5 2.5-2-2 2.5-2.5Z"
      />
    </svg>
  );
}

/** Rayo — electricidad. */
export function BoltIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13 2 3 14h6l-2 8 10-12h-6l2-8Z" />
    </svg>
  );
}

/** Árbol — jardinería y exterior. */
export function TreeIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l5 7h-3l4 6h-4v5h-4v-5H6l4-6H7l5-7Z" />
    </svg>
  );
}

/** Llave — cerrajería. */
export function KeyIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden="true">
      <circle cx="8" cy="15" r="3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 12.5 19 4M19 4l2 2M16.5 6.5l2 2" />
    </svg>
  );
}

/** Reloj — estado "próximamente". */
export function ClockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16Zm.75-12a.75.75 0 00-1.5 0v4c0 .2.08.39.22.53l2.5 2.5a.75.75 0 101.06-1.06L10.75 9.7V6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Lupa — buscador del catálogo. */
export function SearchIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11ZM2 9a7 7 0 1112.45 4.39l3.58 3.58a.75.75 0 11-1.06 1.06l-3.58-3.58A7 7 0 012 9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const CATEGORY_ICON_MAP: Record<string, (props: { className?: string }) => ReactElement> = {
  ac: SnowflakeIcon,
  trowel: TrowelIcon,
  paint: PaintIcon,
  wrench: WrenchIcon,
  bolt: BoltIcon,
  tree: TreeIcon,
  key: KeyIcon,
};

/** Icono genérico por `iconKey` (categoría/profesión), con una casa como último recurso. */
export function CatalogIcon({ iconKey, className = "size-6" }: { iconKey: string | null | undefined; className?: string }) {
  const Icon = (iconKey && CATEGORY_ICON_MAP[iconKey]) || ShieldIcon;
  return <Icon className={className} />;
}
