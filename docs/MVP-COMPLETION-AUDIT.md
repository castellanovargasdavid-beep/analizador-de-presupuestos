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
