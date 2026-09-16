import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { professionals } from "@/db/schema";
import { getCurrentProfessionalId } from "@/lib/professional/actions";
import { ProfessionalShell } from "@/components/professional/ProfessionalShell";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ProfessionalProtectedLayout({ children }: { children: React.ReactNode }) {
  const professionalId = await getCurrentProfessionalId();
  if (!professionalId) redirect("/profesional/login");

  const [professional] = await db.select().from(professionals).where(eq(professionals.id, professionalId)).limit(1);
  if (!professional) redirect("/profesional/login");

  return <ProfessionalShell professionalName={professional.name}>{children}</ProfessionalShell>;
}
