import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { professionals } from "@/db/schema";
import { Card } from "@/components/ui/Card";
import { getCurrentProfessionalId } from "@/lib/professional/actions";
import { AvailabilityForm } from "@/components/professional/AvailabilityForm";

export const metadata = { robots: { index: false, follow: false } };

export default async function ProfessionalAvailabilityPage() {
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) return null;

  const [professional] = await db.select().from(professionals).where(eq(professionals.id, professionalId)).limit(1);
  if (!professional) return null;

  const isPaused = Boolean(professional.pausedUntil && professional.pausedUntil > new Date());

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-950">Disponibilidad</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Mientras estés pausado, no se te asignará ninguna solicitud nueva. Las que ya tengas asignadas siguen su curso normal.
      </p>

      <Card className="mt-6 max-w-md">
        <AvailabilityForm initiallyPaused={isPaused} currentReason={professional.pauseReason} />
        {isPaused && professional.pausedUntil && (
          <p className="mt-4 text-sm text-neutral-500">
            Pausado hasta {professional.pausedUntil.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}.
          </p>
        )}
      </Card>
    </div>
  );
}
