import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { PREGUNTAS } from "@/lib/content/preguntas";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export const metadata: Metadata = {
  title: "Preguntas concretas sobre instalar aire acondicionado",
  description: "Respuestas directas a preguntas puntuales y reales sobre instalar aire acondicionado en España.",
  alternates: { canonical: "/preguntas" },
};

export default function PreguntasIndexPage() {
  return (
    <Container className="max-w-2xl py-12">
      <PageViewTracker />
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Preguntas" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Preguntas concretas</h1>
      <p className="mt-4 text-neutral-700">
        Respuestas directas a preguntas puntuales que de verdad se hace la gente antes de instalar aire
        acondicionado — cada una con la respuesta corta primero, no un rodeo.
      </p>

      <div className="mt-8 space-y-4">
        {PREGUNTAS.map((p) => (
          <Link key={p.slug} href={`/preguntas/${p.slug}`} className="block">
            <Card className="transition-colors hover:border-brand-400">
              <h2 className="font-bold text-neutral-950">{p.pregunta}</h2>
              <p className="mt-1 text-sm text-neutral-700">{p.respuestaCorta}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
