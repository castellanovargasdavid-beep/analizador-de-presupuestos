import { Card } from "../ui/Card";
import { LinkButton } from "../ui/Button";
import { AlertTriangleIcon } from "../ui/icons";

/**
 * Estado defensivo: el rango guardado para este resultado no tiene
 * sentido (invertido o negativo). No debería ocurrir nunca — el motor y
 * sus tests lo impiden — pero si llegara a pasar (una fila corrupta, un
 * bug futuro), esto evita mostrar una UI rota y en su lugar es honesto
 * sobre que algo ha ido mal con ESE resultado concreto.
 */
export function ImpossibleResultNotice() {
  return (
    <Card className="mt-6 border-critical-bg bg-critical-bg/40">
      <div className="flex gap-3">
        <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 text-critical-text" />
        <div>
          <h2 className="font-bold text-neutral-950">Este resultado no se puede mostrar correctamente</h2>
          <p className="mt-2 text-sm text-neutral-700">
            Hemos detectado un problema con los datos de este resultado concreto y preferimos no enseñarte un rango
            que podría no tener sentido. Genera una nueva estimación o compara tu presupuesto otra vez; si el
            problema se repite, cuéntanoslo en contacto.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LinkButton href="/aire-acondicionado/instalacion">Empezar de nuevo</LinkButton>
            <LinkButton href="/contacto" variant="secondary">
              Contactar
            </LinkButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
