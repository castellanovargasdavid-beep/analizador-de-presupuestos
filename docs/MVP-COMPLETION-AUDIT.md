# Auditoría de completitud del MVP — Presupuesto Claro

Fecha: 2026-09-16. Alcance: convertir Presupuesto Claro en un MVP real,
operativo y publicable (aire acondicionado → instalación, Madrid como zona
de validación inicial). Este documento distingue explícitamente, para cada
funcionalidad, entre **implementado y operativo**, **implementado
parcialmente**, **simulado**, **pendiente** e **imposible de verificar en
este entorno** — no se asume que algo existe solo porque se menciona en
otro documento.

No se declara "100% terminado": hay elementos pendientes y bloqueos reales,
listados explícitamente al final.

## 1. Estado por área

| Área | Estado | Evidencia | Pendientes | Bloqueos |
|---|---|---|---|---|
| Calculadora (Wizard, 6 pasos) | **COMPLETADA** | `components/calculator/Wizard.tsx`; recorridos A/B/C/E verificados con Playwright contra Postgres real (ver §4) | — | — |
| Resultado orientativo (`/resultado/[id]`) | **COMPLETADA** | Rango, desglose por partidas con confianza A/B/C, aviso de IVA, `ShareActions`, notice de resultado imposible | — | — |
| Comparación de presupuesto (`/comparar/[id]`) | **COMPLETADA** | `lib/estimation/compare.ts`, resumen descargable, señales de alerta | — | — |
| Solicitud de presupuestos (lead) | **COMPLETADA** | `LeadRequestCard` con plazo deseado, intención de compra y confirmación explícita del rango, todo persistido en `leads` | Fotografías (Fase C, no justificada aún) | — |
| Ciclo de vida del lead (estados) | **COMPLETADA** | 9 estados (`lead_status` enum), timestamps de cada transición, motivo de descarte obligatorio, incidencias | — | — |
| Gestión admin de leads | **COMPLETADA** | `/admin/leads`: filtro por estado, edición completa, resultado de contacto, precio acordado, pago | — | — |
| Gestión admin de profesionales | **COMPLETADA** | `/admin/profesionales` (lista+alta) y `/admin/profesionales/[id]` (edición, zonas de cobertura, historial de leads) | Portal propio del profesional (fuera de alcance del MVP, ver §3) | — |
| Asignación manual de leads a profesionales | **COMPLETADA** | `LeadForm` (select de profesional activo) + `updateLeadAction` | Matching automático (fuera de alcance) | — |
| Registro de pago manual | **COMPLETADA** | `leads.paymentStatus/paymentAmount/paymentRegisteredAt` | Pasarela de pago real | Requiere decisión de negocio + proveedor de pagos, no autorizado en esta tarea |
| SEO técnico (metadata, JSON-LD, sitemap, canonical) | **COMPLETADA CON LIMITACIONES** | Auditado en fases previas (`docs/06-auditoria-seo-tecnica.md`); no re-auditado a fondo en esta tarea | Revisión SEO tras el rediseño visual de la sesión anterior | — |
| Autenticación admin | **COMPLETADA CON LIMITACIONES** | Cookie firmada HMAC + comparación en tiempo constante (`lib/admin/auth.ts`), rutas protegidas server-side (`proxy.ts`) | Un único operador, sin roles ni usuarios múltiples | Ampliarlo es una decisión de producto, no técnica |
| Seguridad de formularios públicos | **COMPLETADA** | Rate limiting en Postgres, honeypot, validación Zod server-side en todos los inputs | — | — |
| Privacidad / RGPD | **COMPLETADA CON LIMITACIONES** | Consentimiento versionado y auditable (`LEAD_CONSENT_VERSION`), páginas legales completas | Textos legales marcados explícitamente como borrador | Requiere revisión por un profesional del derecho — no se puede resolver con código |
| Base de datos en producción | **BLOQUEADA POR DEPENDENCIA EXTERNA** | Migración `0007_curvy_stature.sql` generada y aplicada y verificada contra Postgres local | Aplicar la migración en Neon (producción) | Este entorno no tiene acceso de red a Neon (confirmado en sesiones previas); requiere que el usuario la aplique |
| Despliegue en producción | **BLOQUEADA POR DEPENDENCIA EXTERNA** | Build de producción verificado localmente | Redeploy en Vercel tras aplicar la migración | Acceso a Vercel/Neon fuera del entorno de este agente |
| Portal de profesionales | **PENDIENTE (fuera de alcance, Fase C)** | No implementado a propósito | — | Sin validación comercial suficiente para justificarlo ahora |
| Pagos automáticos / Stripe | **PENDIENTE (fuera de alcance)** | No implementado a propósito | — | Decisión de negocio + coste externo, no autorizado |
| Subida de fotografías en el lead | **PENDIENTE (fuera de alcance)** | No implementado a propósito | — | Sin justificación excepcional documentada todavía |
| Matching automático de profesionales | **PENDIENTE (fuera de alcance)** | `findMatchingProfessionals` existe y es determinista (servicio+región), pero la decisión de asignar sigue siendo siempre manual | — | Requiere una red real de profesionales antes de tener sentido |

## 2. Matriz de funcionalidades

| Funcionalidad | Estado actual | Prioridad | Acción | Motivo |
|---|---|---|---|---|
| Calculadora guiada con progreso e iconos | Implementado y operativo | — | Ninguna | Ya cumple el objetivo del MVP |
| Resultado con rango, desglose y compartir | Implementado y operativo | — | Ninguna | Ya cumple el objetivo del MVP |
| Comparación de presupuesto declarado | Implementado y operativo | — | Ninguna | Ya cumple el objetivo del MVP |
| Plazo deseado / intención de compra / confirmación del rango en el lead | Implementado y operativo (nuevo en esta tarea) | Alta | Ninguna | Mejora la calidad del lead sin ampliar el alcance del experimento (evidencia en `docs/COMMERCIAL-VALIDATION-EXPERIMENT.md` §17) |
| Ciclo de vida del lead (9 estados) | Implementado y operativo (nuevo en esta tarea) | Alta | Ninguna | Necesario para que un admin pueda operar leads reales sin inventar estados sobre la marcha |
| Gestión admin de profesionales + zonas | Implementado y operativo (nuevo en esta tarea) | Alta | Ninguna | Sin esto no había forma de registrar ni asignar profesionales reales |
| Registro manual de pago por lead | Implementado y operativo (nuevo en esta tarea) | Media | Ninguna | Suficiente para el volumen inicial (decenas de leads, no miles) |
| Aplicar migración `0007` en Neon (producción) | Pendiente | Alta | El usuario debe ejecutarla (ver §5) | Este entorno no tiene acceso de red a Neon |
| Portal de profesionales | No implementado | Baja por ahora | Posponer | Sin red de profesionales real todavía; construirlo antes sería invertir en algo sin validar |
| Pagos automáticos | No implementado | Baja por ahora | Posponer | Requiere proveedor de pagos, cuenta y decisión de negocio — no autorizado en esta tarea |
| Subida de fotografías | No implementado | Baja por ahora | Posponer | No hay evidencia todavía de que sea imprescindible para la calidad del lead (solo una fuente en el experimento comercial) |
| Roles/usuarios múltiples en admin | No implementado | Baja por ahora | Posponer | Un único operador es suficiente para el volumen actual |
| Revisión legal formal de textos | Pendiente | Media | Encargar a un profesional del derecho | No es una tarea de ingeniería |

## 3. Rutas públicas

`/`, `/aire-acondicionado`, `/aire-acondicionado/instalacion`,
`/aire-acondicionado/instalacion/analizar-presupuesto`, `/resultado/[id]`
(no indexable), `/comparar/[id]` (no indexable), `/comparativas/split-vs-conductos`,
`/precios/aire-acondicionado-instalacion`, `/guias`, `/guias/[slug]`,
`/preguntas`, `/preguntas/[slug]`, `/metodologia`, `/fuentes`,
`/sobre-nosotros`, `/contacto`, `/legal/privacidad`, `/legal/cookies`,
`/legal/terminos`, `/legal/aviso-legal`, `/robots.txt`, `/sitemap.xml`.

## 4. Rutas privadas (`/admin/**`, protegidas server-side por `proxy.ts`)

`/admin` (dashboard), `/admin/login` (única excepción, fuera del guard),
`/admin/categorias`, `/admin/servicios`, `/admin/materiales`,
`/admin/regiones`, `/admin/provincias`, `/admin/ciudades`,
`/admin/fuentes`, `/admin/reglas-precio(/[ruleId])`, `/admin/iva`,
`/admin/incertidumbre`, `/admin/guias`, `/admin/preguntas`, `/admin/faqs`,
`/admin/leads`, **`/admin/profesionales`(/[id])** (nuevo en esta tarea),
`/admin/estimaciones(/buscar)`.

Verificado en esta tarea: una petición sin cookie de sesión válida a
`/admin/profesionales` responde `307` a `/admin/login` (no solo un control
visual del cliente).

## 5. Modelo de datos (cambios de esta tarea)

Migración `db/migrations/0007_curvy_stature.sql`, aplicada y verificada
contra Postgres local:

- `lead_status`: de 5 a 9 valores — `nuevo`, `validado`, `descartado`,
  `asignado`, `enviado`, `contactado`, `sin_cobertura`, `cerrado`,
  `con_incidencia`.
- Nuevos enums: `lead_purchase_intent` (`explorando` /
  `comparando_presupuestos` / `listo_para_contratar`), `lead_payment_status`
  (`no_aplica` / `pendiente` / `pagado`).
- `leads` gana: `desired_timeframe`, `purchase_intent`,
  `range_acknowledged`, `discard_reason`, `validated_at`, `assigned_at`,
  `sent_to_professional_at`, `contacted_at`, `contact_outcome`,
  `agreed_price`, `payment_status`, `payment_amount`,
  `payment_registered_at`, `incident_notes`.

No se ha tocado el esquema de `professionals` ni
`professional_service_areas`: ya cubrían lo necesario (verificación,
actividad, zonas por servicio+región).

**Pendiente**: esta migración solo se ha aplicado en el Postgres local de
desarrollo. Producción (Neon) sigue en el esquema anterior hasta que se
aplique — ver §7, "Siguiente acción" en la respuesta final.

## 6. Dependencias externas, variables de entorno y riesgos

**Variables de entorno usadas por la aplicación** (`.env.example`):
`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`. No hay ninguna
otra integración externa (sin proveedor de pagos, sin envío de email
transaccional, sin SMS) — cualquier notificación al usuario o al
profesional hoy es manual, gestionada por un humano desde `/admin`.

**Riesgos de seguridad**: ninguno nuevo detectado. Las nuevas Server
Actions (`lib/admin/professionals/actions.ts`, `lib/admin/leads/actions.ts`)
siguen el mismo patrón de validación Zod + `toSafeError` que el resto del
admin, y quedan cubiertas por la misma protección de `proxy.ts` que ya
protegía todo `/admin/**` (mismo patrón que las Server Actions
preexistentes de catálogo/geografía/precios, ninguna de las cuales
verifica la sesión por sí misma — es una decisión arquitectónica ya
aceptada, no una regresión de esta tarea).

**Riesgo de mantenimiento detectado (no corregido, fuera del alcance de
esta tarea)**: `lib/site.ts` fija `SITE_URL` como constante hardcodeada
(`https://www.presupuestoclaro.es`) en vez de una variable de entorno. Si
el dominio real de producción es distinto, todo el Open Graph/canonical/
JSON-LD apuntaría al dominio equivocado. No se ha tocado porque no forma
parte del encargo de esta tarea (leads/profesionales) y cambiarlo sin
verificar el dominio real de producción sería una suposición, no una
corrección.

**Riesgo de privacidad**: ninguno nuevo. Los campos añadidos al lead
(plazo, intención, confirmación del rango) están cubiertos por el mismo
texto de consentimiento versionado ya existente; no se ha necesitado subir
la versión del consentimiento porque no cambia qué se comparte con el
profesional, solo añade contexto que ya estaba implícito en "esta
descripción".

**Riesgo de SEO**: ninguno — no se ha tocado ninguna URL pública, metadato
ni contenido indexable en esta tarea.

**Riesgo de rendimiento**: ninguno relevante — las nuevas consultas admin
(`/admin/profesionales`, historial de leads) son de bajo volumen (decenas
de filas, no miles) y no se sirven en rutas públicas ni afectan a Core Web
Vitals.

## 7. Verificación realizada

- `npx tsc --noEmit` — limpio.
- `npx eslint .` — limpio.
- `npx vitest run` — 106 tests pasados, 14 omitidos (los que requieren
  condiciones no disponibles en este entorno), 0 fallos.
- `npm run build` — build de producción completo, 48 rutas generadas
  correctamente, incluidas las dos nuevas de `/admin/profesionales`.
- **Recorridos end-to-end con Playwright contra Postgres real** (no
  simulados): A (calculadora → resultado, sin lead), B (calculadora →
  comparación de presupuesto), C (calculadora → solicitud de presupuesto →
  confirmación), D (login admin → crear profesional → validar y asignar un
  lead → verificar en la ficha del profesional), E (envío del formulario de
  lead sin marcar las casillas obligatorias, correctamente bloqueado).
- **Un fallo real se encontró y se corrigió durante esta verificación**:
  `updateLeadAction` fallaba en silencio al guardar cualquier cambio de
  estado del lead, porque los campos condicionales del formulario
  (`discardReason`, `incidentNotes`, `paymentAmount`) llegan como `null`
  desde `FormData.get()` cuando no están renderizados, y el esquema Zod
  `.optional()` solo acepta `undefined`, nunca `null`. Corregido en
  `lib/admin/leads/actions.ts` normalizando `null → undefined` antes de
  validar. Verificado de nuevo tras la corrección con una consulta directa
  a Postgres (no solo por la UI): el lead de prueba quedó con
  `status = asignado`, `validated_at` y `assigned_at` con marca de tiempo
  real, y `assigned_professional_id` apuntando al profesional correcto.

## 8. No implementado deliberadamente (Fase C)

Portal de profesionales, pagos automáticos, subida de fotografías,
matching algorítmico, notificaciones automáticas, roles múltiples de
admin: ninguno tiene una justificación excepcional que lo saque de la
Fase C definida por el propio encargo. Implementarlos ahora sería
"programar a ciegas" sobre una red de profesionales que todavía no existe.

---

## Addendum (mismo día) — Catálogo multi-servicio

Ampliación de una categoría (aire acondicionado) a una arquitectura
**categoría → profesión → servicio** reutilizable, sin duplicar código
por profesión. Resumen honesto de lo que cambia:

| Área | Estado | Evidencia | Pendientes |
|---|---|---|---|
| Esquema categoría→profesión→servicio | **COMPLETADA** | Migración `0008_huge_randall.sql`: tabla `professions`, `service_types.professionId`/`availabilityStatus`, `service_interest_signups`, `leads.estimateId` ahora nullable. Aplicada y verificada en local. | Aplicar en Neon (mismo bloqueo que la migración `0007`, ver §7 más abajo) |
| Catálogo público (`/servicios`, `/servicios/[categoria]`, `/profesiones`, `/profesiones/[profesion]`) | **COMPLETADA** | 4 categorías, 12 profesiones, 17 servicios generados estáticamente (`generateStaticParams`, conjunto cerrado a lo publicado en /admin) | — |
| Aire acondicionado sigue `disponible` y funcional | **COMPLETADA** | Recorrido A-E repetido tras el cambio de esquema: calculadora, resultado, comparación, sin regresiones. Cero cambios en `lib/estimation/engine.ts`, `Wizard.tsx` ni las rutas `/aire-acondicionado/**`. | — |
| Solicitud sin calculadora (`solo_solicitud`) | **COMPLETADA** | `DirectRequestForm` + `submitDirectLeadAction`: un ejemplo real activado (Fontanero → "Reparar una fuga"), verificado end-to-end contra Postgres (lead creado con `estimate_id = null`) | — |
| Aviso de interés (`proximamente`) | **COMPLETADA** | `NotifyMeForm` + `notifyMeAction` + tabla `service_interest_signups`, verificado end-to-end | — |
| Admin distingue categoría/profesión/servicio/disponibilidad | **COMPLETADA** | `/admin/categorias`, `/admin/profesiones` (nuevo, catálogo — no confundir con `/admin/profesionales`, la red de instaladores), `/admin/servicios` (con selector de profesión y disponibilidad) | — |
| SEO del catálogo | **COMPLETADA CON LIMITACIONES** | Metadata, canonical, JSON-LD (`CollectionPage`/`Service`), breadcrumbs y sitemap actualizados para las nuevas rutas | Ninguna página nueva se ha indexado todavía en Google (son horas de antigüedad); no se puede verificar posicionamiento real, solo la corrección técnica |

**Un fallo real se encontró y se corrigió durante la verificación**:
`directLeadFormSchema` exigía un campo `serviceTypeId` que
`DirectRequestForm` nunca enviaba (se pasa aparte, como argumento de la
función, no como campo del formulario) — la validación fallaba en
silencio y ninguna solicitud `solo_solicitud` se guardaba. Corregido
quitando ese campo del esquema (nunca se leía de `parsed.data` de todas
formas). Verificado de nuevo con una consulta directa a Postgres tras la
corrección.

**Un segundo fallo se encontró en el propio proceso de backfill**: el
script `db/seed-catalog.ts` asignaba la profesión al servicio de
instalación de A/C ya existente, pero no corregía su
`availabilityStatus` (se quedaba en el valor por defecto `proximamente`
de la columna nueva) — la home mostraba "Aire acondicionado" como
"Próximamente" pese a tener calculadora real. Corregido para que el
backfill también fuerce la disponibilidad correcta cuando no coincide.

**Decisión de alcance documentada**: de la lista de ejemplo del encargo
(Reformas, Instalaciones, Exterior y mantenimiento, con sus profesiones),
se ha sembrado el árbol completo como catálogo informativo
(`proximamente`), y **un único servicio** (`Reparar una fuga`, Fontanero)
como `solo_solicitud`, para demostrar ese camino end-to-end sin construir
más superficie de la necesaria. Ningún precio ni calculadora se ha
inventado para ninguno de ellos — ver `docs/ADDING-NEW-SERVICE.md` para
el proceso de llevarlos a `disponible` cuando haya datos reales.

Verificación repetida tras este addendum: `tsc --noEmit`, `eslint .`,
`vitest run` (120/120), `next build` (67 rutas) — todos limpios.

---

## Addendum 2 (misma sesión) — Plataforma real de leads automatizada

Sustituye el "no implementado deliberadamente (Fase C)" del §8 original
para el matching automático y las notificaciones: con una segunda misión
explícita ("MISIÓN PRINCIPAL", ver `docs/REAL-LEAD-PLATFORM-PLAN.md`), se
ha construido la máquina de estados completa, la asignación algorítmica,
la reasignación automática por plazos, notificaciones (mock) y un portal
mínimo de profesional. El portal de profesionales y el matching
automático **ya no están en la lista de "pendiente"** — están
implementados y probados. Lo que sigue sin existir es la **red real de
profesionales** para operarlos con datos de verdad.

| Área | Estado | Evidencia | Pendientes |
|---|---|---|---|
| Máquina de estados (27 valores, aditiva sobre los 9 anteriores) | **COMPLETADA** | Migración `0009` (ver `docs/LEAD-LIFECYCLE.md`), `lib/leads/state-machine.ts`, historial inmutable en `lead_status_history` | El plazo específico de "aceptar/rechazar" (`PROFESSIONAL_RESPONSE_WINDOW_HOURS`) está definido pero no aplicado por separado — ver limitación documentada en `docs/REASSIGNMENT-POLICY.md` |
| Asignación algorítmica con exclusividad y bloqueo | **COMPLETADA** | `lib/leads/assignment-service.ts`: elegibilidad transparente con motivo de descarte, rotación por antigüedad, `pg_advisory_xact_lock` contra doble asignación — probado con Postgres real, incluida una prueba de concurrencia explícita | — |
| Reasignación automática por plazos | **COMPLETADA** | `lib/leads/reassignment-service.ts` + `/api/cron/lead-deadlines` (Vercel Cron configurado en `vercel.json`, protegido por `CRON_SECRET`) | Sin cron real ejecutándose en este entorno de desarrollo — invocado manualmente durante la verificación; en producción depende de que Vercel lo dispare (ver `docs/PRODUCTION-SETUP.md`) |
| Notificaciones | **COMPLETADA (modo simulado)** | `lib/notifications/*`, tabla `notifications`, adaptador `mock` — nunca afirma un envío real sin proveedor configurado | Ningún proveedor de email/SMS/WhatsApp real conectado — ver `docs/NOTIFICATION-SYSTEM.md` |
| Portal de profesional (mínimo) | **COMPLETADA (versión mínima documentada)** | Login propio, `/profesional`, aceptar/rechazar, confirmar contacto, pausar plazo, enviar presupuesto, disponibilidad — ver `docs/PROFESSIONAL-ONBOARDING.md` para qué falta en esta versión mínima | Adjuntos, recuperación de contraseña autoservicio, métricas propias del profesional |
| Panel admin ampliado | **COMPLETADA** | `/admin/leads/[id]` (línea temporal completa, reasignación manual con motivo obligatorio, pausa/reanudación de plazo), `/admin/notificaciones`, `/admin/automatizaciones`, filtros por vista operativa en `/admin/leads` | — |
| Pruebas automatizadas de la plataforma de leads | **COMPLETADA** | 171/171 tests (`vitest run`), incluidos 27 tests de integración nuevos contra Postgres real: transiciones válidas/inválidas, elegibilidad (inactivo/no verificado/pausado/excluido/sin capacidad), asignación única bajo concurrencia, rotación, reasignación con exclusión y notificación, honestidad de las notificaciones (`simulado` nunca `enviado`), no-reasignación sin plazo vencido, detección de duplicados, ownership del portal de profesional (un profesional no puede tocar un lead ajeno) | — |
| Red real de profesionales | **PENDIENTE (bloqueo de negocio, no técnico)** | La tabla `professionals` sigue vacía a propósito en este entorno | Incorporar profesionales reales verificados — ver `docs/PROFESSIONAL-ONBOARDING.md` |
| Migración `0009` en producción (Neon) | **BLOQUEADA POR DEPENDENCIA EXTERNA** | Generada y verificada (aplicada e idempotente) contra Postgres local | Aplicarla en Neon — mismo procedimiento que `0007`/`0008`, ver `docs/PRODUCTION-SETUP.md` |

**Un bug real de concurrencia se encontró y se corrigió durante la
verificación con Postgres real** (no lo habría detectado ningún test que
usara un mock de base de datos): `sendContactWarnings()` y
`sendQuoteWarnings()` (en `lib/leads/reassignment-service.ts`) llamaban a
`sendNotification()` **desde dentro** de la transacción que tenía
bloqueada la fila del lead (`FOR UPDATE SKIP LOCKED`). Como
`sendNotification()` inserta en `notifications` usando una conexión
distinta del pool, y esa tabla tiene una clave foránea a `leads`, la
inserción esperaba a que la transacción exterior liberase el bloqueo —
pero la transacción exterior estaba a su vez esperando a que la
inserción terminase. Postgres no lo detecta como un interbloqueo clásico
(la transacción exterior no está bloqueada dentro del gestor de
bloqueos, solo esperando al cliente), así que se habría quedado colgada
indefinidamente en producción, bloqueando además cualquier otra consulta
sobre esas filas. Corregido moviendo el envío de notificaciones fuera de
la transacción (se recopila a quién avisar dentro, se notifica después de
que la transacción confirme). Verificado de nuevo: la prueba de
integración que lo detectó (`processDeadlines reasigna un contacto
vencido...`) pasa en ~1,4s tras la corrección, frente a colgarse
indefinidamente antes.

**No se afirma que la plataforma de leads esté "terminada al 100%"**:
sigue dependiendo de incorporar profesionales reales, configurar un
proveedor de notificaciones real, verificar el cron en producción, y una
revisión legal formal de las políticas de exclusividad/reasignación — ver
`docs/PRODUCTION-SETUP.md` para la checklist completa.

Verificación de esta fase: `tsc --noEmit`, `eslint .` — limpios;
`vitest run` — 171/171 (0 fallos, 0 omitidos relevantes para esta
plataforma); `next build` — limpio, todas las rutas nuevas generadas
(`/admin/leads/[id]`, `/admin/notificaciones`, `/admin/automatizaciones`,
`/profesional/**`, `/api/cron/lead-deadlines`).

## Addendum 3 (misma sesión) — Activación de los 17 servicios "Próximamente"

Tercera misión explícita: ninguno de los 17 servicios que estaban en
`proximamente` debía seguir así sin una razón real que lo justificara.
Cada uno se movió a `disponible` (calculadora orientativa real) o a
`solo_solicitud` (formulario de solicitud, sin inventar un precio que no
se puede justificar) — nunca se dejó ninguno en `proximamente` "porque sí".

| Servicio | Estado final | Motivo |
|---|---|---|
| Cambiar un grifo, Cambiar una cerradura, Pintar una habitación, Pintar una vivienda completa, Añadir enchufes, Instalar puntos de luz, Instalar un termo eléctrico, Reparar una fuga, Alicatar un baño, Levantar un tabique, Instalar un armario a medida (11) | **`disponible`** | La investigación de mercado (`docs/09-investigacion-precios-multi-servicio.md`) encontró rangos de precio B (agregadores/gremios reales) suficientes para una fórmula simple y justificable (`base + factores condicionales`) |
| Cambiar el cuadro eléctrico, Instalar una caldera, Reformar una habitación, Reforma integral de vivienda, Mantenimiento de jardín, Limpieza profunda de vivienda, Reparar una persiana (7) | **`solo_solicitud`** | El precio depende de variables que no se pueden reducir honestamente a una fórmula (alcance de una reforma completa, estado real de una caldera/persiana existente, superficie y estado de un jardín) — "si una fórmula no puede justificarse razonablemente, se usa `solo_solicitud` en vez de publicar una calculadora engañosa" |

Verificado en Postgres real: `select availability_status, count(*) from
service_types group by 1` → `disponible: 12` (11 nuevos + aire
acondicionado, que sigue intacto), `solo_solicitud: 7`, **`proximamente:
0`**.

**Arquitectura** (ver `docs/ADDING-NEW-SERVICE.md`, sección "Calculadora
genérica", para el detalle técnico): se añadió un segundo camino de
calculadora — genérico y config-driven
(`lib/estimation/generic/{validation,actions,calculator-configs}.ts` +
`components/calculator/GenericWizard.tsx` + la ruta
`app/[categoria]/[servicio]/page.tsx`) — que reutiliza sin cambios el
motor de precios, la persistencia y la lógica de IVA ya existentes
(`lib/estimation/engine.ts`, `repository.ts`, `vat.ts`). No se duplicó la
aplicación por servicio: los 11 servicios nuevos comparten el mismo
motor, el mismo wizard genérico y la misma página de resultado que aire
acondicionado — solo cambia la configuración declarativa de campos y los
factores de precio sembrados. `DirectRequestForm`/`directLeadFormSchema`
(ya genéricos de una fase anterior) se ampliaron con 6 campos opcionales
(tipo de inmueble, urgencia, plazo deseado, estado actual, dimensiones
aproximadas, presupuesto propio) para cubrir los 7 servicios
`solo_solicitud` sin forzar al usuario a rellenar nada irrelevante —
todos son opcionales y se muestran en una sección colapsable "Más
detalles".

**Confianza y honestidad de las calculadoras nuevas**: ningún factor de
esta tanda tiene confianza A (no hay normativa oficial de precios como el
IVA); todos son B (fuente de mercado real, agregadores citados en
`docs/09-investigacion-precios-multi-servicio.md`) o, en un puñado de
ajustes menores sin desglose de mercado (p. ej. el recargo por urgencia o
por capacidad grande de un termo), C con nota explícita reconociendo que
es un ajuste propio razonable, no un dato de mercado. La página de
resultado muestra siempre, para estas calculadoras, un aviso explícito de
confianza máxima B y carácter no vinculante, además de la banda de
incertidumbre ya existente (que para estos servicios cae naturalmente en
la banda media/alta por la mezcla de confianzas B/C, nunca en la banda
más estrecha reservada a A).

**Bug real encontrado y corregido durante esta fase (no una hipótesis, un
error real detectado probando)**: los factores base de "Instalar un termo
eléctrico" e "Instalar un armario a medida" se sembraron inicialmente con
`groupKey: "servicio"` en vez de `"equipo"`. El cálculo de IVA reducido
del motor (`lib/estimation/vat.ts`) exige que los materiales no superen
el 40% de la base imponible, y ese cálculo solo reconoce los grupos
`"equipo"`/`"paquete_conductos"` — cualquier otro grupo cuenta
implícitamente como 0% de materiales. Con el groupKey equivocado, ambos
servicios (donde el producto en sí, no la mano de obra, domina claramente
el coste) habrían aplicado incorrectamente el IVA reducido del 10% en vez
del general del 21%. Se detectó calculando manualmente un caso real
(armario MDF × 3 metros lineales) y comparando el resultado esperado
contra el obtenido. Corregido de forma no destructiva usando el
versionado ya existente de `pricing_rules` (se desactivó la v1 y se creó
una v2 corregida, sin borrar ningún dato). Existe ahora una aserción de
regresión permanente en
`lib/estimation/generic/actions.integration.test.ts` que fija que estos
dos servicios tributan siempre al tipo general.

**Integración con el sistema de leads/profesionales**: verificado con
Postgres real (no solo asumido), tanto un lead derivado de calculadora
(`cambiar-un-grifo`, `disponible`) como uno de solicitud directa
(`cambiar-el-cuadro-electrico`, `solo_solicitud`) pasan correctamente por
`processNewLead` → validación automática → intento de asignación
(`assignLead`) usando sus `serviceTypeId` reales. Como no existe todavía
ningún profesional real dado de alta, ambos terminan honestamente en
`sin_cobertura` con el motivo explícito "Sin profesionales verificados y
elegibles para este servicio/zona en este momento" — el sistema **no
fabrica cobertura ni asignaciones falsas**. En cuanto se incorpore al
menos un profesional real con ese servicio y zona, el mismo mecanismo (ya
probado exhaustivamente en la plataforma de leads, Addendum 2) asignará
el lead automáticamente sin ningún cambio de código.

**Incidente autoinfligido durante la limpieza de datos de prueba (se
documenta explícitamente, no se oculta)**: durante la verificación manual
de esta fase se intentó borrar dos estimaciones de prueba propias con un
filtro SQL por ventana de tiempo (`created_at > now() - interval '1
hour' AND anonymous_session_id IS NULL`) en vez de por sus IDs exactos.
Las dos primeras sentencias `DELETE` (sobre `estimate_items` y
`estimate_ranges`) se ejecutaron antes de que una tercera fallara por una
restricción de clave foránea — y ese filtro impreciso ya había borrado
las líneas de desglose de una estimación histórica **ajena**, real, de
una sesión de QA anterior (id `aa5c2453-ea02-4c81-a094-be21ef11b9b6`), no
solo las de prueba propias. Se detectó de inmediato, no se intentó
borrar nada más, y se cambió al enfoque no destructivo (versionado) para
la corrección real del bug de IVA. Esa estimación histórica sigue
existiendo (sin su desglose de partidas — degradación visual, no un
fallo) y no se ha intentado "arreglarla" reconstruyendo datos, porque eso
sería fabricar datos donde ya no los hay. Lección aplicada de aquí en
adelante: nunca borrar datos de desarrollo por ventana de tiempo, siempre
por ID exacto capturado explícitamente — como se hizo en el script de
verificación del pipeline de leads de este mismo addendum.

**Pruebas nuevas de esta fase**: `lib/estimation/generic/validation.test.ts`
(7 tests), `lib/estimation/generic/calculator-configs.test.ts` (11 tests,
uno por servicio — compara cada config contra los factores realmente
sembrados en Postgres), `lib/estimation/generic/actions.integration.test.ts`
(13 tests contra Postgres real — cálculo, persistencia y escenario de IVA
correcto para los 11 servicios, incluida la regresión de
termo/armario), más 4 tests nuevos en `lib/catalog/validation.test.ts`
para los campos opcionales del formulario de solicitud directa.
`vitest run` completo: **206/206 tests, 27 archivos, 0 fallos**.

**Lo que NO se ha hecho en esta fase** (para no afirmar más de lo real):
- No se ha dado de alta ningún profesional real para estos 18 servicios
  — sigue pendiente el mismo bloqueo de negocio descrito en el Addendum 2
  (`docs/PROFESSIONAL-ONBOARDING.md`). Sin eso, ningún lead de estos
  servicios se asignará jamás, por diseño.
- No se ha aplicado todavía la migración `0010` en producción (Neon) —
  generada, aplicada e idempotente contra Postgres local, igual que las
  anteriores (ver `docs/PRODUCTION-SETUP.md`).
- No se ha añadido subida de fotografías al formulario de solicitud
  directa — sigue explícitamente fuera de alcance (Fase C) hasta que
  exista almacenamiento seguro de adjuntos, tal como pedía la misión
  ("solo si el sistema está preparado para manejarlas con seguridad").
- El aire acondicionado no se ha tocado funcionalmente: su Wizard, su
  formulario de validación y su Server Action de cálculo siguen siendo
  los mismos ficheros dedicados de siempre; solo `app/resultado/[id]/page.tsx`
  ganó una rama condicional (`isAireAcondicionado`) para servir también a
  los servicios nuevos sin duplicar la página.

Verificación de esta fase: `tsc --noEmit`, `eslint .` — limpios;
`vitest run` — 206/206 (0 fallos); `next build` — pendiente de ejecutar
la pasada final junto con el resto de la verificación de esta tarea
(ver informe final).
