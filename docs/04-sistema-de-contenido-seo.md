# Sistema de contenido SEO

Construido sobre la arquitectura ya decidida en `docs/02-estrategia-seo.md`.
Este documento cubre la implementación: plantillas reutilizables, schema
por tipo de página, reglas de indexación y el sistema de datos que decide
qué páginas programáticas se generan.

## Principio rector

Cada página satisface la intención de búsqueda **antes** de intentar
posicionar. Ninguna página de esta fase es "el precio depende de muchos
factores" sin más: donde el usuario espera un cálculo, hay un cálculo real
(no un enlace prometiendo uno en otra página); donde espera una
comparación, hay una tabla con números reales, no adjetivos.

## Plantillas (componentes en `components/content/`)

| Componente | Uso | Schema que aporta |
|---|---|---|
| `Breadcrumbs` | Migas de pan en toda página de contenido | `BreadcrumbList` |
| `FAQSection` | Preguntas frecuentes reales (nunca relleno) | `FAQPage` |
| `VariablesList` / `TipsList` / `MistakesList` | "Qué mueve el precio" / consejos / errores habituales | — |
| `RelatedLinks` | Enlazado interno explícito, con criterio | — |
| `SourcesNote` | Cierre obligatorio en páginas que usan datos del motor | — |
| `ServiceHubTemplate` | Plantilla "Servicios": hub de categoría | — (la página que lo usa añade `BreadcrumbList`) |
| `ComparisonTable` | Plantilla "Comparaciones": tabla A vs. B genérica | — |
| `QuickRangeLookup` | Herramienta embebida de consulta instantánea (plantilla "Costes") | — |
| `JsonLd` | Inserta cualquier bloque JSON-LD, escapando `</script>` | — |

Las 7 plantillas pedidas y dónde viven:

1. **Calculadoras** — `/aire-acondicionado/instalacion` y `/.../analizar-presupuesto` (el `Wizard`, ya existente).
2. **Costes** — `/precios/aire-acondicionado-instalacion`, con `QuickRangeLookup` + tabla completa.
3. **Comparaciones** — `/comparativas/split-vs-conductos`, con `ComparisonTable`.
4. **Guías** — `/guias/*`, registradas en `lib/content/guias.ts`.
5. **Preguntas** — `/preguntas/[slug]`, registradas en `lib/content/preguntas.ts`.
6. **Servicios** — `/aire-acondicionado` (hub), vía `ServiceHubTemplate`.
7. **Territorios** — sin instancias todavía (ver más abajo): la plantilla es la propia página de servicio/costes, condicionada por `lib/content/territory-gate.ts`.

## Schema por tipo de página

| Página | Schema |
|---|---|
| Todo el sitio (`app/layout.tsx`) | `WebSite`, `Organization` |
| Servicio/calculadora | `Service` + `FAQPage` + `BreadcrumbList` |
| Analizador | `FAQPage` + `BreadcrumbList` (sin `Service`: no es una oferta) |
| Costes (`/precios/...`) | `Article` + `FAQPage` + `BreadcrumbList` |
| Comparación | `Article` + `FAQPage` + `BreadcrumbList` |
| Guía | `Article` + `BreadcrumbList` |
| Pregunta | `Article` + `FAQPage` (una sola pregunta) + `BreadcrumbList` |
| Metodología | `Article` + `BreadcrumbList` |
| Hub de servicio | `BreadcrumbList` |
| Fuentes / Sobre nosotros / Contacto | `BreadcrumbList` |
| `/resultado/[id]`, `/comparar/[id]` | Ninguno (noindex) |

Nunca se usa `Product`/`Offer`: implicaría un precio fijo de venta, que es
exactamente lo que este producto se niega a afirmar.

## Indexación

- `app/robots.ts` bloquea `/resultado/` y `/comparar/` explícitamente.
- Ambas rutas llevan además `robots: { index: false, follow: true }` en su
  metadata (cinturón y tirantes).
- Toda página de contenido indexable declara `alternates.canonical` con su
  ruta limpia — evita que un futuro parámetro de query (utm, filtros)
  compita por el mismo contenido.
- `app/sitemap.ts` se genera desde `staticPaths` + los registros
  `GUIAS`/`PREGUNTAS`: una guía o pregunta nueva entra sola en el sitemap
  con solo añadir la entrada al registro correspondiente, sin tocar el
  archivo del sitemap.
- `/preguntas/[slug]` usa `generateStaticParams` + `dynamicParams = false`:
  **solo** los slugs registrados existen; cualquier otro devuelve 404 real,
  nunca una página generada al vuelo. Verificado en el QA de esta fase.

## Contenido programático — la puerta de territorios

`lib/content/territory-gate.ts` implementa la regla de docs/02 (sección 5)
como función pura y testeada: una página de territorio ("precio instalar
aire acondicionado en Madrid") solo se genera si hay **≥30 estimaciones
propias** para esa región, o una fuente de mercado citable y verificada con
diferencial real (hoy no existe ninguna así curada).

Un test de integración (`repository.integration.test.ts`) recorre las 19
CCAA sembradas contra la base de datos real y confirma que **hoy ninguna
supera el umbral** — por eso no se ha generado ni una sola página de
territorio en esta fase, aunque el mecanismo (plantilla + puerta + conteo
real) ya existe. El test está escrito para fallar el día que sí haya
suficiente dato — ese día toca construir la página de verdad, no subir el
número para que el test pase.

## Páginas nuevas de esta fase

- `/precios/aire-acondicionado-instalacion` (Costes)
- `/comparativas/split-vs-conductos` (Comparación)
- `/preguntas` + 3 páginas `/preguntas/[slug]` (Preguntas)
- `/fuentes` (E-E-A-T: las filas reales de `data_sources`, no una copia estática)
- `/sobre-nosotros`, `/contacto` (E-E-A-T)

Todas enlazadas desde el footer (`components/layout/SiteFooter.tsx`, ahora
con una columna "Confianza") y con enlazado cruzado explícito entre sí
(nunca "todas las páginas enlazan a todas").

## Qué falta a propósito

- OCR, subida de PDF/imagen: fuera de alcance, ver `docs/03`.
- Páginas de territorio: bloqueadas por la puerta hasta tener datos reales.
- Verticales nuevas (reformas, ventanas...): el mismo conjunto de
  plantillas se reutiliza sin cambios cuando lleguen — es precisamente lo
  que las hace plantillas y no páginas ad hoc.
