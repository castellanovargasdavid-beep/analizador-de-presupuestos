import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/content/Breadcrumbs";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Cookies",
  description:
    "Presupuesto Claro no usa cookies de analítica ni de publicidad. Qué guardamos en tu navegador y por qué no hace falta un banner de consentimiento.",
  path: "/legal/cookies",
  robots: { index: true, follow: true },
});

export default function CookiesPage() {
  return (
    <Container className="max-w-2xl py-12 text-neutral-700">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Cookies" }]} />
      <h1 className="mt-3 text-3xl font-bold text-neutral-950">Cookies</h1>
      <div className="prose-neutral mt-6 space-y-6">
        <p>
          <strong>Borrador pendiente de revisión legal formal (LSSICE).</strong> No usamos cookies de analítica ni
          de publicidad, propias o de terceros. No hay ningún píxel ni script de un proveedor externo cargando en
          este sitio.
        </p>

        <section>
          <h2 className="font-bold text-neutral-950">Qué guardamos en tu navegador</h2>
          <p className="mt-2">
            Usamos <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">sessionStorage</code> — un
            almacenamiento de sesión del navegador, no una cookie — para dos cosas: generar un identificador de
            sesión aleatorio, y recordar qué página de entrada trajo tu visita. Ambos datos se borran solos al
            cerrar la pestaña o el navegador, y nunca salen de tu dispositivo salvo cuando registramos en nuestro
            servidor que ha ocurrido un evento de uso (una página vista, un paso de la calculadora completado, etc.),
            para poder saber qué contenido resulta útil.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-neutral-950">Por qué no hay un banner de consentimiento</h2>
          <p className="mt-2">
            La LSSICE exige consentimiento para cookies o tecnologías equivalentes de seguimiento no esenciales.
            Nuestro almacenamiento es estrictamente de sesión, propio, sin fines publicitarios y sin crear un perfil
            persistente entre visitas — por eso hoy no mostramos un banner. Si en el futuro incorporamos analítica
            de terceros o almacenamiento persistente con fines de seguimiento, actualizaremos este apartado y
            añadiremos el gestor de consentimiento correspondiente antes de activarlo.
          </p>
        </section>
      </div>
    </Container>
  );
}
