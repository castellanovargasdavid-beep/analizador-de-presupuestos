# Plan: plataforma real de leads multi-servicio

Auditoría + arquitectura + plan de implementación, tal y como pide la
misión. Este documento se escribió **después** de inspeccionar el
repositorio real (no es una lista de ideas genéricas) y **antes** de
implementar — el resultado de la implementación se documenta en
`docs/MVP-COMPLETION-AUDIT.md` y en el informe final de la conversación.

## 1. Estado actual (auditoría)

Ya existe, y funciona, de la sesión anterior:

- **Catálogo multi-servicio real**: `service_categories` → `professions` →
  `service_types`, con `availabilityStatus` (`disponible` /
  `solo_solicitud` / `proximamente`). Público en `/servicios`,
  `/profesiones`. Admin en `/admin/categorias`, `/admin/profesiones`,
  `/admin/servicios`.
- **Leads con 9 estados** (`nuevo`, `validado`, `descartado`, `asignado`,
  `enviado`, `contactado`, `sin_cobertura`, `cerrado`, `con_incidencia`),
  gestión manual completa desde `/admin/leads`, con `discardReason`,
  `contactOutcome`, `agreedPrice`, `paymentStatus`. Sin máquina de estados
  formal ni transiciones validadas más allá de un `enum` de Postgres —
  cualquier admin puede poner cualquier estado sin comprobar que la
  transición tenga sentido.
- **Profesionales**: tabla `professionals` (nombre, email, teléfono,
  `verificationStatus`, `isActive`, notas) + `professional_service_areas`
  (servicio + región, `regionId` null = toda España). Gestión completa en
  `/admin/profesionales`. **Sin autenticación propia, sin capacidad
  máxima, sin horarios, sin historial estructurado más allá de la lista de
  leads asignados.**
- **Asignación**: `findMatchingProfessionals()` filtra por servicio +
  verificado + activo + región compatible, pero la asignación en sí es
  **100% manual** desde `/admin/leads` (un select). No hay rotación, no
  hay bloqueo transaccional (no hace falta hoy: un único admin, sin
  concurrencia), no hay reasignación automática.
- **Sin timers, sin cron, sin colas.** No existe `vercel.json` con
  `crons`, no hay ningún proceso programado.
- **Sin sistema de notificaciones.** No hay ningún proveedor de email/SMS
  configurado (`.env.example` solo tiene `DATABASE_URL`,
  `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`). Cero dependencias de
  `resend`/`sendgrid`/`twilio`/`nodemailer` en `package.json`.
- **Sin portal de profesional.** Solo existe `/admin` (un operador).
- **Auth**: `lib/admin/auth.ts` — contraseña compartida por variable de
  entorno + cookie firmada HMAC. Sin tabla de usuarios. Patrón reutilizable
  para un segundo tipo de sesión (profesional), pero no hay nada montado.
- **Rate limiting propio** en Postgres (`rate_limit_buckets`), sin Redis.
- **Auditoría admin** (`admin_audit_log`) para cambios desde `/admin`,
  pero es un log plano de texto, no una máquina de estados con
  transiciones tipadas.

Conclusión de la auditoría: la base de datos y el catálogo están
realmente preparados para crecer. Lo que falta es exactamente lo que pide
la misión — máquina de estados formal, asignación algorítmica con
exclusividad y bloqueo, temporizadores/cron, notificaciones (aunque sea
en modo mock), y un portal mínimo de profesional.

## 2. Qué NO está disponible (dependencias externas)

- **Ningún proveedor de email transaccional, SMS o WhatsApp Business
  configurado.** No se puede enviar ninguna notificación real hoy. Se
  implementa la capa de notificaciones completa con un **adaptador
  `mock`** (registra la notificación en base de datos y la imprime en el
  log del servidor, nunca la envía de verdad) — ver
  `docs/NOTIFICATION-SYSTEM.md` para qué hace falta configurar en
  producción.
- **Sin cron nativo en este entorno de desarrollo.** Vercel sí soporta
  Cron Jobs (`vercel.json` → `crons`) en producción; se deja configurado
  para producción, pero en local/CI el mismo endpoint se puede invocar
  manualmente o con un cron de sistema — documentado en
  `docs/PRODUCTION-SETUP.md`.
- **Sin profesionales reales incorporados.** Todo se prueba con
  profesionales de prueba, creados y eliminados durante la verificación,
  igual que en la sesión anterior.
- **Sin revisión legal formal.** Se documentan las bases legales
  aplicables (RGPD/LOPDGDD) en `docs/REASSIGNMENT-POLICY.md` y los textos
  públicos, pero no sustituyen una revisión por un profesional del
  derecho.

## 3. Arquitectura propuesta

### 3.1 Máquina de estados del lead

Se **añaden** valores nuevos al enum `lead_status` existente (nunca se
eliminan los 9 actuales: es una migración aditiva, sin pérdida de datos
ni recodificación de leads históricos). Enum final:

```
nuevo, en_validacion, validado, en_cola, sin_cobertura,
asignado, notificado, visto, aceptado,
contacto_pendiente, contacto_confirmado,
presupuesto_pendiente, presupuesto_enviado, en_revision_usuario,
ganado, perdido, rechazado, expirado,
reasignacion_pendiente, reasignado,
cancelado, invalido, descartado, con_incidencia, cerrado
```

Las transiciones válidas viven en **una única tabla** (`lib/leads/state-machine.ts`),
no repartidas en varios archivos. Todo cambio de estado pasa por
`LeadLifecycleService.transitionLead()`, que valida la transición contra
esa tabla, actualiza el lead y escribe una fila en la nueva tabla
`lead_status_history` (auditoría inmutable, con quién/cuándo/por qué) —
todo dentro de una única transacción de Postgres. **Nunca se permite un
cambio de estado directo desde el cliente**: los Server Actions llaman al
servicio, el servicio decide si la transición es legal.

### 3.2 Exclusividad y asignación

- Un lead solo puede tener **un profesional activo a la vez**
  (`leads.assignedProfessionalId`), nunca varios simultáneamente — eso ya
  era así y se mantiene.
- `LeadAssignmentService.assignLead()` usa un **bloqueo advisory de
  Postgres** (`pg_advisory_xact_lock`, con clave derivada del `leadId`)
  para que dos ejecuciones concurrentes (p. ej. el cron y un admin a la
  vez) nunca asignen el mismo lead dos veces.
- Elegibilidad: servicio + profesión coincide, región compatible (o
  cobertura "toda España"), `isActive = true`,
  `verificationStatus = 'verificado'`, no pausado
  (`pausedUntil` vacío o ya pasado), bajo capacidad
  (`leads asignados activos < maxConcurrentLeads`), y no excluido a mano
  para ese lead concreto (`lead_professional_exclusions`).
- Estrategia de rotación: **el profesional elegible con la asignación
  activa más antigua primero** (round-robin real, no aleatorio ni
  ponderado por una puntuación opaca). Se registra en
  `lead_status_history.metadata` por qué se eligió a ese profesional y
  cuántos candidatos había.
- Si no hay ningún profesional elegible, el lead pasa a `sin_cobertura`
  (ya existía) — estado honesto, no un error.

### 3.3 Temporizadores y automatización

Sin Redis ni colas externas: **un único endpoint cron**
(`app/api/cron/lead-deadlines/route.ts`), protegido por un secreto
(`CRON_SECRET`), pensado para Vercel Cron Jobs. Cada ejecución es
**idempotente** (solo actúa sobre filas cuyo plazo ya venció y que no
tienen ya un aviso/reasignación registrados) y usa
`SELECT ... FOR UPDATE SKIP LOCKED` para que ejecuciones solapadas no
procesen la misma fila dos veces. Cada ejecución registra un resumen en
la nueva tabla `automation_runs` (visible en `/admin`).

Plazos centralizados en `lib/leads/deadline-config.ts`, con valores por
defecto razonables y sobreescribibles por variable de entorno (nunca
hardcodeados en varios sitios):

```
CONTACT_CONFIRMATION_DEADLINE_HOURS = 4
CONTACT_WARNING_DELAY_HOURS         = 1   (antes del plazo)
CONTACT_GRACE_PERIOD_HOURS          = 2   (después del plazo)
QUOTE_SUBMISSION_DEADLINE_HOURS     = 72
QUOTE_WARNING_DELAY_HOURS           = 12
QUOTE_GRACE_PERIOD_HOURS            = 24
REASSIGNMENT_COOLDOWN_HOURS         = 1
PROFESSIONAL_RESPONSE_WINDOW_HOURS  = 2   (aceptar/rechazar tras notificación)
```

### 3.4 Notificaciones

`lib/notifications/service.ts` (capa desacoplada) + tabla `notifications`
(tipo, destinatario, canal, plantilla, lead relacionado, estado,
intentos, error). Un único adaptador activo por entorno, seleccionado por
`NOTIFICATION_ADAPTER` (`mock` por defecto). El adaptador `mock` escribe
la notificación en la tabla con `status = 'simulado'` y la imprime en el
log del servidor — **nunca afirma que se ha enviado si no hay proveedor
real configurado.**

### 3.5 Portal de profesional (mínimo, real)

Autenticación propia (contraseña + cookie firmada, mismo patrón que
`lib/admin/auth.ts`, con `professionals.passwordHash`, fijada por el
admin al dar de alta al profesional). `proxy.ts` protege `/profesional/**`
igual que ya protege `/admin/**`. El profesional puede: ver sus leads
asignados, aceptar/rechazar, confirmar contacto, pedir una pausa
justificada del plazo, indicar visita previa, y enviar un presupuesto
estructurado (importe, IVA, validez, tiempo estimado, condiciones — sin
subida de archivos, para no ampliar el alcance más de lo necesario).

### 3.6 Cambios de base de datos (migración `0009`)

- `lead_status`: **solo se añaden valores** (aditivo, sin
  `DROP TYPE`, sin recodificar leads existentes).
- `leads`: nuevas columnas de temporización (`notified_at`,
  `responded_at`, `viewed_at`, `contact_deadline_at`,
  `contact_warning_sent_at`, `quote_deadline_at`,
  `quote_warning_sent_at`, `reassignment_pending_at`, `reassigned_at`,
  `reassignment_count`, `reassignment_reason`, `paused_until`,
  `pause_reason`, `duplicate_of_lead_id` autorreferencia nullable).
- `professionals`: `password_hash`, `max_concurrent_leads` (default 5),
  `paused_until`, `pause_reason`, `notification_preferences` (jsonb).
- Tablas nuevas: `lead_status_history`, `lead_professional_exclusions`,
  `lead_quotes`, `notifications`, `automation_runs`.

Todas son adiciones puras (nuevas columnas nullable/con default, nuevas
tablas): **cero riesgo de pérdida de datos**, verificado igual que las
migraciones `0007`/`0008` (aplicar y probar en local antes de entregar el
script para Neon).

## 4. Riesgos

- **Volumen de cambio**: esta es la ampliación más grande hecha hasta
  ahora en una sola sesión. Mitigación: verificación exhaustiva
  (typecheck/lint/test/build + recorridos end-to-end reales contra
  Postgres, igual que en sesiones anteriores) antes de dar nada por
  terminado, y no tocar la lógica de cálculo de aire acondicionado ni sus
  rutas.
- **Sin notificaciones reales**: el sistema queda "listo pero no
  operativo" para avisos automáticos hasta que se configure un proveedor.
  Documentado explícitamente, nunca simulado como si funcionara.
- **Sin cron en este entorno**: se prueba el endpoint invocándolo a mano;
  la programación real depende de configurar `vercel.json` en producción
  (ver `docs/PRODUCTION-SETUP.md`).
- **Complejidad operativa nueva para el admin**: más estados y pantallas.
  Mitigado con una vista de línea temporal por lead y filtros por plazo.

## 5. Elementos que funcionan completamente en local

Máquina de estados, asignación con exclusividad y bloqueo, cron de
plazos (invocado a mano), notificaciones mock persistidas, portal de
profesional completo, panel de admin ampliado, todas las pruebas.

## 6. Elementos que requieren configuración de producción

Proveedor de email/SMS/WhatsApp real (`NOTIFICATION_ADAPTER=email` +
credenciales), `CRON_SECRET` + entrada `crons` en `vercel.json`,
incorporación real de profesionales verificados, revisión legal de los
textos de exclusividad/reasignación.

## 7. Plan de implementación (orden real de ejecución)

1. Migración `0009` + `lib/leads/deadline-config.ts`.
2. `lib/leads/state-machine.ts` + `LeadLifecycleService`.
3. `lib/notifications/*` (servicio + adaptador mock + plantillas).
4. `LeadAssignmentService` (elegibilidad + bloqueo + rotación).
5. `LeadReassignmentService` + endpoint cron.
6. Autenticación y portal de profesional.
7. Ampliación del panel de administración (timeline, filtros, reasignación manual, notificaciones, automatizaciones).
8. Conectar `submitLeadAction`/`submitDirectLeadAction` a la nueva máquina de estados.
9. Pruebas (unitarias + integración con Postgres real).
10. Documentación restante y verificación final.
