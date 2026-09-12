# Arquitectura administrativa

Panel en `/admin` para gestionar todo el negocio sin tocar código:
categorías, servicios, precios, rangos, factores, regiones, provincias,
ciudades, materiales, fuentes, fechas de actualización, páginas SEO
(guías/preguntas), FAQs y leads. Este documento explica cómo se separan
las capas, qué garantiza cada tabla sobre sus propios datos, y cómo se
responde "¿por qué este cálculo ha producido este rango?".

## Principio: Contenido / Lógica / Datos / Presentación

Las cuatro capas ya existían en el proyecto desde el motor de estimación
(docs/03); este turno las hizo explícitas también para todo lo editorial:

| Capa | Dónde vive | Quién la toca |
|---|---|---|
| **Datos** | Postgres (`db/schema.ts`) — precios, factores, geografía, fuentes, guías, preguntas, FAQs, leads | El admin, desde `/admin` |
| **Lógica** | `lib/estimation/*` (motor de cálculo), `lib/admin/*/actions.ts` (validación + escritura) | Solo el código — nunca un dato de negocio hardcodeado dentro |
| **Contenido** | Filas de `seo_guides`, `seo_questions`, `faqs` — antes vivían como arrays TypeScript (`lib/content/guias.ts`, `lib/content/preguntas.ts`, `FAQ_ITEMS` sueltos en cada `page.tsx`) | El admin |
| **Presentación** | `app/**/page.tsx`, componentes React | El código — solo pinta lo que la capa de datos devuelve |

La prueba de que esta separación es real, no aspiracional: `lib/content/guias.ts`
y `lib/content/preguntas.ts` **ya no existen**. `db/migrate-content.ts` movió
su contenido a la base de datos una única vez (`npx tsx --env-file=.env.local
db/migrate-content.ts` — idempotente por `slug`/`pageKey`, no forma parte de
`npm run db:seed`, que sigue siendo solo para datos de precios) y los
archivos se borraron: no hay ninguna ruta por la que el contenido pueda
volver a hardcodearse por accidente. Cada página pública que antes
importaba un array ahora llama a `lib/content/repository.ts`
(`listPublishedGuides`, `getPublishedQuestion`, `listFaqsForPage`, etc.).

**Límite conocido y aceptado**: añadir una FAQ a una página completamente
nueva (un `pageKey` que ningún `page.tsx` consulta todavía) sí requiere que
un desarrollador añada esa llamada a `listFaqsForPage()` una vez — el
`FaqForm` del admin lo advierte explícitamente en su ayuda de campo. Lo que
"sin tocar código" garantiza es que el *contenido* de páginas ya existentes,
y sus precios/factores/geografía, no requieren ningún despliegue.

## Autenticación

Un único operador, sin tabla de usuarios ni roles — lo mínimo que es
honesto construir cuando no existe un sistema multiusuario real:

- `ADMIN_PASSWORD` (variable de entorno) protege el login.
- `lib/admin/auth.ts` firma una cookie de sesión (`admin_session`, 12h de
  validez) con HMAC-SHA256 vía Web Crypto — no el módulo `crypto` de Node,
  porque el mismo código de verificación corre tanto en Server Actions
  (runtime Node) como en `proxy.ts` (runtime Edge).
- `proxy.ts` (el reemplazo de `middleware.ts` en Next 16 — ver AGENTS.md)
  protege `/admin/**` excepto `/admin/login`.
- El login está limitado por el mismo `lib/security/rate-limit.ts` de
  docs/07 (10 intentos / 15 min por IP).

## Módulos del panel

Cada módulo sigue el mismo patrón: `lib/admin/<área>/validation.ts` (Zod)
→ `lib/admin/<área>/actions.ts` (Server Action: parsea, valida, escribe,
registra auditoría, `revalidatePath`) → `components/admin/<Entidad>Form.tsx`
(`useActionState`) → `app/admin/(protected)/<ruta>/page.tsx` (tabla +
formulario de alta, edición inline con `<details>` sin JavaScript extra).

- **Catálogo**: categorías, servicios, niveles de material.
- **Geografía**: regiones, provincias (requieren región), ciudades
  (requieren provincia — la página se bloquea con un aviso si todavía no
  hay ninguna provincia, en vez de ofrecer un formulario que fallaría).
- **Precios** (la parte más sensible — ver la sección siguiente): fuentes,
  reglas de precio, factores (anidados bajo su regla en
  `/admin/reglas-precio/[ruleId]`), IVA, bandas de incertidumbre.
- **Contenido SEO**: guías, preguntas, FAQs por página.
- **Negocio**: leads, explicador de estimaciones.

## Metadatos obligatorios de cada fuente de datos

El requisito era que cada conjunto de datos de precio lleve fuente, fecha,
región, metodología, confianza, estado y versión. Mapeo exacto a schema:

| Requisito | Columna | Tabla |
|---|---|---|
| Fuente | `name`, `url`, `sourceType` | `data_sources` |
| Fecha | `publishedOn` (si se conoce) / `retrievedOn` (siempre, la fecha en la que **nosotros** lo verificamos) | `data_sources` |
| Región | `geographicScope` (texto libre: "España", "Madrid"...) | `data_sources` |
| Metodología | `notes` (de la fuente) + el propio motor documentado en docs/03 (cómo se combinan los factores) | `data_sources` |
| Confianza | `confidence` (`A`/`B`/`C`) | `data_sources`, y heredada por cada `pricing_factor`/`vat_rate` que la cita |
| Estado | `isActive` (una fuente obsoleta se desactiva, nunca se borra — así una `Estimate` ya calculada sigue pudiendo trazarse a la fuente exacta que usó) | `data_sources` |
| Versión | `version` en `pricing_rules` (única por `serviceTypeId`+`version`) — cada regla nueva es una fila nueva, nunca una edición que reescriba el pasado | `pricing_rules` |

`estimates.pricingRuleId` fija para siempre qué versión de la regla se usó:
cambiar los factores mañana no altera una estimación ya compartida con un
usuario (mismo principio que ya regía en docs/03, ahora también editable
desde el admin).

### Seguridad de los factores: condición validada, no solo tipada

Cada `pricing_factor` puede llevar una condición (`condition`, JSONB) que
decide si se aplica al caso concreto de un usuario — el DSL cerrado que ya
existía en `lib/estimation/condition-types.ts`. Como esto ahora se escribe
a mano desde un `<textarea>` del admin, `lib/estimation/condition-schema.ts`
añade un espejo Zod (`factorConditionSchema`) que valida la forma exacta
del JSON *antes* de guardarlo — un JSON malformado o con una forma no
reconocida nunca llega a `pricing_factors.condition`, así que nunca puede
romper el motor de cálculo en producción. Ver
`lib/estimation/condition-schema.test.ts` para los casos cubiertos.

## Contenido SEO: versión y fecha de publicación reales

`seo_guides` y `seo_questions` llevan `status` (`borrador | publicado |
archivado`), `version` y `publishedAt`. Nada de esto se simula:

- `version` se incrementa en cada guardado (`saveGuideAction`/
  `saveQuestionAction`, en `lib/admin/content/actions.ts`).
- `publishedAt` se fija **una sola vez**, en la transición exacta hacia
  `status: "publicado"` — nunca se sobrescribe después, así que sigue
  siendo la fecha real de la primera publicación (la que ya usan el JSON-LD
  `Article` y el listado de `/preguntas`).
- `updatedAt` sí se actualiza en cada guardado — es "cuándo se tocó por
  última vez", no "cuándo se publicó".

Solo el contenido en `publicado` se sirve al público (`/guias/[slug]`,
`/preguntas/[slug]`) y entra en el sitemap; `generateStaticParams` con
`dynamicParams = false` hace que cualquier slug fuera de ese conjunto dé
404, no una página en blanco.

Para que alguien sin conocimientos de JSON pueda escribir el cuerpo de una
guía o sus enlaces relacionados, `lib/content/body-text.ts` define un
formato de texto plano con round-trip completo (parse al guardar, serialize
al rellenar el formulario de edición): `## título` / `- item` / párrafo
suelto para el cuerpo, `ruta | etiqueta | descripción` por línea para
enlaces relacionados.

## Auditoría administrativa

`admin_audit_log` (tabla) + `lib/admin/audit.ts` (`recordAudit`) registran
quién-qué-cuándo de cada acción de escritura del panel (`actor` es siempre
`"admin"` hoy, honestamente, porque no existe todavía más de un operador).
Esto es la mitad "qué botón se pulsó" de la explicabilidad. La otra mitad
— "por qué este cálculo dio este rango" — es un problema distinto y no
necesita esta tabla: se responde reconstruyendo la cadena de datos que ya
se persistió en el momento del cálculo, no un log de acciones.

## Explicabilidad: "¿por qué este cálculo ha producido este rango?"

`lib/admin/explain.ts` (`getEstimateExplanation`) reconstruye, para
cualquier `estimate.id`, la cadena completa sin necesitar ninguna tabla
nueva — todo ya se persistía en `persistEstimate` (docs/03):

```
estimate
 ├─ pricingRuleId  → pricing_rules (nombre, versión, activa/inactiva hoy)
 ├─ regionId / provinceId / materialLevelId → nombres legibles
 ├─ inputs (jsonb)  → exactamente lo que el usuario introdujo
 ├─ vatScenario/vatRatePct → + la fila vat_rates vigente hoy (descripción, fuente) para contexto
 ├─ confidenceScore/uncertaintyPct → + la uncertainty_band vigente hoy que cubre ese score
 └─ estimate_items[] (congelados en el momento del cálculo)
     ├─ factorId → pricing_factors (clave, condición, ¿sigue activo hoy?)
     │              └─ sourceId → data_sources (nombre, confianza, fecha, ¿sigue activa hoy?)
     └─ min/max/confidence ya congelados, no se recalculan
```

Nota importante documentada también en el código: el factor/fuente que se
muestra es su fila **actual** (si alguien la desactiva o edita después del
cálculo, la estimación ya persistida no cambia, pero esta vista de
auditoría sí refleja la versión de hoy del factor citado por id — se marca
explícitamente "desactivado hoy" cuando aplica). Lo que nunca cambia son
los valores ya congelados en `estimate_items`/`estimate_ranges`.

Interfaz: `/admin/estimaciones` (buscador por id + las 20 estimaciones más
recientes, porque no existe una forma sensata de "listar todas" cuando el
volumen crece) → `/admin/estimaciones/[id]` con el contexto completo,
IVA aplicado, incertidumbre aplicada, la tabla partida→factor→fuente, y los
rangos agregados. Un id con formato inválido da 404 limpio (no un 500 de
Postgres al intentar castear a `uuid`), mismo patrón defensivo que
`getEstimateForDisplay` ya usaba en la parte pública.

## Leads

`/admin/leads` lista cada solicitud de contacto (servicio, región,
contacto, estado) y permite, por fila, cambiar su `status`
(`nuevo | en_revision | contactado | sin_cobertura | cerrado`) y asignar un
profesional verificado y activo. Sin red real de profesionales todavía,
el selector de asignación lo dice explícitamente en vez de fingir opciones
("Todavía no hay ningún profesional verificado en la red") — mismo
principio de honestidad que ya regía `findMatchingProfessionals` en
docs/05.

## Verificación

`tsc --noEmit`, `eslint .` y `npx vitest run` (104 tests ejecutados, 14 de
integración omitidos por no tener `DATABASE_URL` cargado en el entorno de
tests — se saltan igual en local sin Postgres arrancado; no hay
regresiones frente a los 118 tests totales del proyecto) — todos limpios.

QA manual con Playwright contra Postgres real y el servidor de desarrollo:

- Login (`/admin/login`) con contraseña correcta/incorrecta, redirección
  de `/admin` sin sesión.
- `/admin/leads`: cambio de estado a "contactado" y asignación de un
  profesional de prueba, verificado tanto en la UI recargada como en la
  tabla `leads`; datos de prueba borrados al terminar (la tabla vuelve a
  quedar vacía, honestamente, como antes del QA).
- `/admin/estimaciones`: listado de recientes, formulario de búsqueda por
  id (redirección GET sin JavaScript hasta `/admin/estimaciones/[id]`), un
  id con formato inválido devuelve 404.
- `/admin/estimaciones/[id]`: contenido verificado contra una estimación
  real — contexto, input crudo, cada partida con su factor y fuente, IVA
  aplicado, banda de incertidumbre, rangos agregados.

## Límite conocido, aceptado por alcance

El `SiteHeader`/`SiteFooter` públicos siguen envolviendo visualmente las
páginas de `/admin/**` (se ve la barra de navegación del sitio de
marketing por encima del panel). Migrar las ~30 páginas públicas
existentes a un route group hermano para eliminar ese acoplamiento se
juzgó fuera de alcance frente al resto de este turno — es un defecto
cosmético, no funcional: `proxy.ts` protege igualmente todas las rutas, y
`metadata.robots = { index: false, follow: false }` en cada página de
admin evita que se indexen.
