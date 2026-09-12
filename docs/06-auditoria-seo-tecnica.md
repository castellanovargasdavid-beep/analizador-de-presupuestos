# Auditoría técnica de SEO — hallazgos y correcciones

Auditoría completa de indexación, HTML/semántica, metadata, JSON-LD, enlazado
interno, rendimiento, mobile e imágenes, sobre el sitio construido en los
documentos 00-05. Cada hallazgo se verificó contra el comportamiento real
(build, HTML servido, consultas a Postgres) antes de corregirlo — no se
"arregla" nada especulativo.

## Hallazgos críticos (indexación real rota)

1. **`robots.txt` bloqueaba `/resultado/*` y `/comparar/*`, contradiciendo su
   propio `robots: {index: false, follow: true}`.** Si Google no puede
   rastrear una URL, no puede leer su etiqueta `noindex` — y una URL
   bloqueada con enlaces entrantes puede acabar indexada igualmente como
   "sin descripción", el resultado contrario al buscado. Se quitó el
   `disallow` de esas rutas (el `noindex` de su metadata ya hace el trabajo)
   y se añadió `disallow: ["/api/"]` en su lugar (higiene de rastreo, nunca
   se enlaza a esas rutas). Ver `app/robots.ts`.

2. **Un id con formato inválido en `/resultado/[id]` o `/comparar/[id]`
   devolvía 500, no 404.** `getEstimateForDisplay`/`getComparisonForDisplay`
   pasaban el `id` directo a una columna `uuid` de Postgres; un id que no
   fuera un UUID válido (un bot probando rutas, un enlace roto, un usuario
   editando la URL a mano) hacía que Postgres lanzara `invalid input syntax
   for type uuid`, sin capturar → error 500 real. Un 500 en una URL
   inventada es mucho peor para SEO que un 404 limpio (afecta a señales de
   calidad del dominio). Se añadió una validación de formato UUID antes de
   la consulta en `lib/estimation/repository.ts`, con test de integración
   cubriendo ambos casos (formato inválido y UUID válido inexistente).

## Metadata

3. **Cero Open Graph / Twitter Card en todo el sitio.** Ninguna página tenía
   vista previa social. Se creó `lib/metadata.ts` (`pageMetadata()`), una
   única función que arma `title` + `description` + `canonical` + OG +
   Twitter de forma consistente, usada ahora en las 19 páginas propias más
   `generateMetadata` de `/preguntas/[slug]`, `/resultado/[id]` y
   `/comparar/[id]`. Ningún título ni descripción quedan duplicados entre
   páginas (verificado explícitamente).
4. **Sin imagen OG/Twitter.** Se generó `app/opengraph-image.tsx` (1200×630,
   `next/og` `ImageResponse`, sin asset binario que mantener). Al principio
   se referenció solo como string (`"/opengraph-image"`), pero el convenio
   de archivo de Next.js **no se hereda automáticamente** en cuanto una
   página define su propio `openGraph` (como hace `pageMetadata()`) — así
   que solo la home mostraba imagen. Se corrigió referenciando la imagen
   explícitamente (con ancho/alto/tipo) dentro de `pageMetadata()`, para que
   todas las páginas la lleven.
5. **Favicon genérico de `create-next-app`, sin marca.** Se sustituyó por
   `app/icon.tsx` y `app/apple-icon.tsx` generados por código (mismo azul de
   marca). Primer intento usó el glifo "✓": `next/og` intenta descargar una
   fuente dinámica para glifos fuera de la fuente base, y en este entorno
   sin esa red la descarga falla silenciosamente y el glifo se renderiza
   como un cuadro vacío — verificado inspeccionando el PNG generado. Se
   cambió a una letra ASCII ("P"), siempre cubierta por la fuente integrada,
   sin depender de red.
6. **Tres páginas legales sin `description` en su metadata** (`/legal/privacidad`,
   `/legal/cookies`, `/legal/aviso-legal`) y sin breadcrumb (ni visible ni
   `BreadcrumbList`). Corregido: descripciones específicas + `Breadcrumbs`
   añadido, igual que el resto del sitio.
7. **Cuatro descripciones superaban los ~160 caracteres** donde Google
   trunca el snippet (home, calculadora, analizador, precios — hasta 192
   caracteres). Recortadas a ≤160 sin perder el significado. Los títulos
   largos se dejaron tal cual: el sufijo de marca (`· Presupuesto Claro`)
   va al final del `template`, así que un título largo pierde el sufijo al
   truncarse, nunca la parte descriptiva — el diseño ya mitigaba esto
   correctamente.
8. **`/resultado/[id]` y `/comparar/[id]` usaban `<nav>` a mano en vez del
   componente `Breadcrumbs` compartido** — perdían `BreadcrumbList` y
   quedaban inconsistentes con el resto del sitio. Corregido. Se
   aprovechó para convertir su `metadata` estático a `generateMetadata`
   dinámico: la descripción ahora recoge el rango real calculado (o el
   veredicto real de la comparación), no un texto genérico — mejora directa
   de la vista previa cuando alguien usa "Copiar enlace para compartir".

## Rendimiento (server response)

9. **`generateMetadata` + el componente de página en `/resultado/[id]` y
   `/comparar/[id]` piden la misma Estimate/Comparison** — sin memoización,
   cada vista de página habría duplicado sus consultas a Postgres. Se
   envolvieron `getEstimateForDisplay`/`getComparisonForDisplay` con
   `cache()` de React (`lib/estimation/repository.ts`): dentro de la misma
   request, la segunda llamada es gratis. Mismo cambio sirvió de base para
   el punto 2 (la validación de formato UUID vive en un único sitio).

## JSON-LD (schema)

10. **Los 5 bloques `Article` (precios, comparativas, guía, metodología,
    preguntas) no tenían `author` ni `datePublished`/`dateModified`** —
    propiedades que Google recomienda para elegibilidad de rich results.
    Se añadió `author: Organization` (el contenido lo produce el proyecto,
    no una persona con firma — inventar un autor humano habría sido
    deshonesto) y fechas reales verificadas con `git log --diff-filter=A`
    sobre cada archivo (nunca inventadas).
11. **`/aire-acondicionado/instalacion/analizar-presupuesto` no tenía ningún
    JSON-LD propio** (ni `Service` ni nada), a diferencia de su página
    hermana `/aire-acondicionado/instalacion` que sí declara `Service`.
    Añadido el mismo tipo `Service` para paridad de plantilla.
12. Se revisó cada plantilla para confirmar que ningún schema se declara
    "porque sí": `FAQPage` solo donde hay preguntas reales visibles,
    `BreadcrumbList` solo reflejando la navegación real, `Article` solo en
    contenido editorial real, y se mantiene la regla ya establecida de
    nunca usar `Product`/`Offer` (implicarían un precio fijo de venta).

## HTML / semántica

13. **La home tenía su FAQ hecha a mano** (`<details>` sin `FAQPage`),
    duplicando lo que el componente `FAQSection` ya hace en el resto del
    sitio (contenido + schema en un único sitio). Sustituido por
    `<FAQSection>` — mismo contenido, ahora con schema real.
14. **"Cómo funciona" en la home era una lista de pasos numerados dentro de
    `<div>`, no `<ol>`.** Es semánticamente una secuencia ordenada; se
    cambió a `<ol>`/`<li>` con `list-none` para conservar el estilo visual.
15. Jerarquía de encabezados revisada en todas las plantillas: un único
    `<h1>` por página, `<h2>` de sección, `<h3>` solo donde hay una
    subdivisión real (tarjetas de ejemplo, pasos) — sin saltos de nivel.

## Enlazado interno

16. Mapeado el grafo completo de enlaces (header, footer, `RelatedLinks`,
    índices de guías/preguntas): profundidad máxima de 2 clics desde la
    home para cualquier página indexable, cero páginas huérfanas. Único
    punto con matiz: `/comparativas/split-vs-conductos` no está en
    header/footer pero sí enlazada contextualmente desde 2 páginas de
    contenido — enlace contextual real, no navegación forzada; se dejó así
    a propósito (mejor señal que "rellenar" el footer).
17. **La navegación principal del header desaparecía por debajo de `sm`
    sin ninguna alternativa** ("Guías" y "Metodología" solo eran
    alcanzables bajando hasta el footer en móvil). Se añadió un menú móvil
    con `<details>`/`<summary>` nativo (cero JavaScript), visible solo por
    debajo de `sm`, con los mismos enlaces. Verificado con Playwright a
    390px de ancho: abre, muestra los tres enlaces y navega correctamente.

## Imágenes

18. El sitio no usa ninguna imagen rasterizada en el contenido (todos los
    iconos son SVG inline, sin petición de red, sin CLS) — por eso no
    aplican alt/sizes/lazy loading a nivel de contenido; se documenta el
    porqué en vez de forzar imágenes que no aportan nada. Las únicas
    imágenes rasterizadas del sitio son las generadas por código para
    metadata (favicon, apple-icon, imagen OG), cubiertas en los puntos 4-5.

## Verificación final

`tsc --noEmit`, `eslint .`, `vitest run` (96/96 tests, incluyendo 2 nuevos
para el caso 500→404) y `next build` — todo limpio. QA con Playwright:
flujo completo calculadora → resultado con metadata dinámica verificada
en runtime, menú móvil funcional, capturas de escritorio y móvil.
