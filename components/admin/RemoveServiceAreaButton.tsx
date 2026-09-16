"use client";

import { useActionState } from "react";
import { removeServiceAreaAction, type ActionResult } from "@/lib/admin/professionals/actions";

const initialState: ActionResult = { ok: true };

export function RemoveServiceAreaButton({ areaId, professionalId }: { areaId: string; professionalId: string }) {
  const [, formAction] = useActionState(removeServiceAreaAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="areaId" value={areaId} />
      <input type="hidden" name="professionalId" value={professionalId} />
      <button type="submit" className="text-xs font-semibold text-critical-text hover:underline">
        Quitar
      </button>
    </form>
  );
}
