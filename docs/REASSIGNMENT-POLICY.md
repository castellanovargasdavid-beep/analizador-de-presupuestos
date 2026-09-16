# Política de exclusividad y reasignación

Este documento es la referencia técnica **y** el borrador de la política
comercial pública (adaptar el tono para cara al usuario/profesional, pero
no cambiar las reglas sin actualizar también el código). Si algo aquí no
coincide con `lib/leads/reassignment-service.ts` o
`lib/leads/assignment-service.ts`, el código manda y este documento está
desactualizado.

## Qué significa "exclusivo"

Un lead solo puede estar asignado a **un profesional a la vez**
(`leads.assignedProfessionalId`). Nunca se envía el mismo lead a varios
profesionales simultáneamente. La exclusividad dura **mientras el
profesional cumpla los plazos** descritos abajo — no es indefinida ni
depende de si el usuario acaba contratando.

**Nunca prometemos**:
- que el usuario va a contratar al profesional;
- que el profesional va a ganar el trabajo;
- que todos los leads son válidos o van a generar contacto;
- que el contacto va a producirse siempre;
- que la plataforma garantiza conversión o rentabilidad.

## Cómo se elige al profesional (algoritmo de asignación)

`lib/leads/assignment-service.ts#evaluateEligibility`, en este orden:

1. **Cobertura**: el profesional tiene `professional_service_areas` para
   el mismo `serviceTypeId` del lead, y la región coincide o su cobertura
   es "toda España" (`regionId = null`).
2. **Activo** (`isActive = true`).
3. **Verificado** (`verificationStatus = 'verificado'`) — pendientes y
   rechazados nunca reciben leads.
4. **No pausado** (`pausedUntil` vacío o ya pasado).
5. **No excluido para este lead concreto**
   (`lead_professional_exclusions` — ver más abajo cuándo se genera).
6. **Con capacidad** (`leads activos asignados < maxConcurrentLeads`,
   donde "activo" = no terminal, ver `docs/LEAD-LIFECYCLE.md`).

De los que pasan los seis filtros, se elige **el que lleva más tiempo sin
recibir una asignación** (el que nunca ha recibido ninguna va primero de
todos). Es una rotación real por antigüedad, **nunca** aleatoria ni una
puntuación opaca — cada asignación registra en
`lead_status_history.metadata` cuántos candidatos había y por qué se
descartó a cada uno de los no elegidos, consultable desde
`/admin/leads/[id]`.

Si no hay ningún candidato elegible, el lead queda en `sin_cobertura` —
nunca se fuerza una asignación a alguien no apto.

La asignación usa un bloqueo advisory de Postgres
(`pg_advisory_xact_lock`) para que dos procesos concurrentes (el cron y
un admin, por ejemplo) nunca asignen el mismo lead dos veces.

## Plazos (todos configurables, nunca hardcodeados en más de un sitio)

Definidos en `lib/leads/deadline-config.ts`, sobreescribibles por
variable de entorno:

| Variable | Por defecto | Qué mide |
|---|---|---|
| `CONTACT_CONFIRMATION_DEADLINE_HOURS` | 4h | Desde que se notifica al profesional hasta que debe confirmar que ha contactado al usuario. |
| `CONTACT_WARNING_DELAY_HOURS` | 1h | Cuánto antes del plazo de contacto se le avisa. |
| `CONTACT_GRACE_PERIOD_HOURS` | 2h | Margen tras vencer el plazo de contacto antes de reasignar. |
| `QUOTE_SUBMISSION_DEADLINE_HOURS` | 72h | Desde que confirma el contacto hasta que debe enviar presupuesto. |
| `QUOTE_WARNING_DELAY_HOURS` | 12h | Aviso previo al plazo de presupuesto. |
| `QUOTE_GRACE_PERIOD_HOURS` | 24h | Margen tras vencer el plazo de presupuesto antes de reasignar. |
| `REASSIGNMENT_COOLDOWN_HOURS` | 1h | Tiempo mínimo entre dos reasignaciones del mismo lead (evita cascadas). |
| `PROFESSIONAL_RESPONSE_WINDOW_HOURS` | 2h | Reservado para un futuro plazo específico de aceptar/rechazar — **hoy no aplicado por separado**, ver "Limitación conocida" abajo. |

## Cuándo SÍ se reasigna (única lista, exhaustiva)

1. El profesional **rechaza explícitamente** el lead (con motivo
   obligatorio).
2. **No confirma el contacto** dentro de `contactDeadlineAt` +
   `CONTACT_GRACE_PERIOD_HOURS`.
3. **Confirmó el contacto pero no envía presupuesto** dentro de
   `quoteDeadlineAt` + `QUOTE_GRACE_PERIOD_HOURS`.
4. El profesional queda **suspendido/inactivo** mientras tenía un lead
   asignado (reasignación manual del admin, hoy no automática — ver
   `docs/PROFESSIONAL-ONBOARDING.md`, "Suspender").
5. El **usuario pide explícitamente** no seguir con ese profesional
   (canal manual, vía admin).
6. El lead se marca **inválido** tras la asignación (fraude, datos
   falsos detectados a posteriori).
7. **Intervención manual de un admin**, siempre con motivo obligatorio
   registrado (`/admin/leads/[id]` → "Reasignar a otro profesional").

## Cuándo NUNCA se reasigna automáticamente

- **Porque el usuario no haya contratado todavía.** Un lead en
  `contacto_confirmado` o `presupuesto_enviado` puede quedarse ahí
  indefinidamente sin que el sistema toque nada — contratar o no es
  decisión del usuario, no un plazo del profesional.
- **Mientras el plazo esté pausado** (`deadlinePausedUntil` en el
  futuro). Un profesional que depende de una visita, de que el usuario
  responda, o de un tercero, puede pausar el plazo con un motivo — el
  cron respeta la pausa y no avisa ni reasigna mientras dure.
- **Dos veces seguidas sin dejar pasar `REASSIGNMENT_COOLDOWN_HOURS`.**

## Qué pasa exactamente al reasignar (`reassignLead()`)

1. Transición a `reasignacion_pendiente`.
2. Se añade una fila en `lead_professional_exclusions` para el
   profesional anterior — **no volverá a recibir este lead concreto**
   (sí otros leads nuevos, no está penalizado en general).
3. Se le notifica con un lenguaje honesto y no acusatorio. Texto real
   usado (`lib/notifications/templates.ts`, plantilla
   `lead_reasignado`): explica el motivo tal cual se registró, sin
   acusación ni amenaza.
4. Transición a `reasignado`, se incrementa `reassignmentCount`, se
   limpian los plazos anteriores.
5. Vuelve a `en_cola` y se ejecuta el algoritmo de asignación desde cero
   (excluye automáticamente al que se acaba de excluir).
6. Si hay un candidato, se asigna y notifica igual que una asignación
   nueva. Si no, el lead queda honestamente en `sin_cobertura` — **nunca**
   se fuerza una asignación a alguien no apto.

Todo el proceso es idempotente en el sentido de que repetir la llamada
sobre el mismo lead no duplica exclusiones ni notificaciones fuera de lo
esperado; el cron además usa `FOR UPDATE SKIP LOCKED` para que dos
ejecuciones solapadas nunca procesen la misma fila dos veces.

## Limitación conocida

`PROFESSIONAL_RESPONSE_WINDOW_HOURS` (plazo específico para
aceptar/rechazar tras la notificación inicial) está definido y es
configurable, pero **el cron no lo aplica como un plazo independiente
todavía** — un profesional que nunca acepta ni rechaza acaba siendo
reasignado igualmente, pero por el plazo de **contacto** (más largo, 4h
por defecto), no por uno específico de 2h para responder. Consecuencia
práctica: la reasignación por "no respuesta" tarda hasta 4h + el margen
de gracia, no 2h. Ver `docs/LEAD-LIFECYCLE.md`, sección "Lo que falta".

## Datos compartidos con el profesional y base legal

- Se comparten con el profesional asignado: nombre, email, teléfono (si
  se dio), descripción del trabajo, ubicación aproximada (región).
- Base legal: ejecución de una relación precontractual a petición del
  usuario (RGPD art. 6.1.b) — el usuario pide expresamente ser puesto en
  contacto con un profesional al enviar el formulario, y así se le indica
  en el consentimiento (`consentVersion`/`consentAcceptedAt`, ver
  `lib/leads/validation.ts`).
- El profesional recibe los datos solo mientras el lead está activo con
  él; tras una reasignación, sigue teniendo acceso al historial de lo que
  ya vio (no se "borra" retroactivamente lo que ya se le mostró, pero no
  se le vuelve a dar contacto activo).
- **Esto no sustituye una revisión legal formal.** No se ha hecho una
  auditoría RGPD/LOPDGDD por un profesional del derecho — ver
  `docs/PRODUCTION-SETUP.md`, sección de cumplimiento legal.
