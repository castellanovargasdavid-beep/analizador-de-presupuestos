# Ciclo de vida de un lead

Referencia técnica del estado real de un lead, para quien vaya a tocar
`lib/leads/*` o depurar un caso concreto desde `/admin/leads/[id]`. Ver
también `docs/REAL-LEAD-PLATFORM-PLAN.md` (por qué se diseñó así) y
`docs/REASSIGNMENT-POLICY.md` (reglas de negocio de la reasignación).

## Principio: una única fuente de verdad

`leads.status` **nunca** se escribe directamente con un `UPDATE`. El
único punto de entrada es `transitionLead()` en
`lib/leads/lifecycle-service.ts`:

1. Abre una transacción y bloquea la fila del lead (`SELECT ... FOR UPDATE`).
2. Valida la transición contra el grafo de `lib/leads/state-machine.ts`
   (`canTransition`/`assertTransition`) — si no es válida, lanza
   `InvalidLeadTransitionError` y no cambia nada.
3. Actualiza `leads.status` (y cualquier otro campo relacionado, p. ej. un
   timestamp) y escribe una fila en `lead_status_history` con quién lo hizo
   (`actorType`: `sistema` / `admin` / `profesional` / `usuario`), cuándo y
   por qué.

Un admin puede forzar una transición que el grafo no contempla (para
corregir un dato a mano) pasando `force: true` — queda igualmente
registrada en el historial con `metadata.forced = true`, nunca en
silencio. Ningún otro actor (`sistema`, `profesional`) puede forzar nada.

`recordLeadNote()` permite anotar el historial sin cambiar de estado (p.
ej. una pausa de plazo justificada) — mismo mecanismo de auditoría, sin
pasar por la máquina de transiciones.

## Los 27 estados

Los 9 heredados de la versión anterior del sistema se mantienen tal cual
(nunca se recodificaron leads existentes):

| Estado | Heredado | Significado |
|---|---|---|
| `nuevo` | sí | Recién creado, sin procesar todavía. |
| `validado` | sí | Pasó la validación automática básica (formato de contacto, consentimiento). |
| `en_validacion` | | Transitorio, reservado para una validación asíncrona futura (hoy la validación es síncrona). |
| `en_cola` | | Validado, esperando asignación (tras una reasignación, por ejemplo). |
| `sin_cobertura` | sí | Sin ningún profesional elegible en este momento. No es un error: se reintentará si se reasigna manualmente o entra un profesional nuevo. |
| `asignado` | sí | Profesional elegido, pendiente de notificarle. |
| `notificado` | | El profesional ha recibido el aviso; empieza a correr `contactDeadlineAt`. |
| `visto` | | El profesional ha abierto el detalle del lead (hoy no hay tracking de apertura real; el estado existe para cuando se implemente). |
| `aceptado` | | El profesional ha aceptado explícitamente — estado transitorio, pasa a `contacto_pendiente` en la misma acción. |
| `contacto_pendiente` | | Aceptado, todavía sin confirmar el contacto con el usuario. |
| `contacto_confirmado` | | El profesional confirma que ha hablado con el usuario. |
| `presupuesto_pendiente` | | El profesional va a preparar un presupuesto; empieza a correr `quoteDeadlineAt`. |
| `presupuesto_enviado` | | Presupuesto estructurado registrado en `lead_quotes`. |
| `en_revision_usuario` | | Reservado para cuando el usuario pueda ver/responder presupuestos desde su propia cuenta (no implementado todavía). |
| `ganado` | | El profesional ha contratado el trabajo. |
| `perdido` | | El usuario no ha contratado a este profesional. |
| `rechazado` | | El profesional rechazó la solicitud (con motivo obligatorio). |
| `expirado` | | Reservado para cuando venza `PROFESSIONAL_RESPONSE_WINDOW_HOURS` sin aceptar/rechazar (la reasignación por esta causa concreta no está implementada todavía — ver "Lo que falta" abajo). |
| `reasignacion_pendiente` | | Transitorio durante una reasignación en curso. |
| `reasignado` | | El profesional anterior ha quedado excluido; buscando uno nuevo. |
| `cancelado` | | Cancelado (por el usuario, un admin, o una incidencia grave). |
| `invalido` | | El lead no es comercialmente válido (spam, datos falsos, duplicado exacto...). |
| `descartado` | sí | Descartado manualmente por un admin, con motivo. |
| `con_incidencia` | sí | Bloqueado por una incidencia operativa, requiere intervención manual. |
| `enviado` | sí (legado) | Solo alcanzable desde el editor rápido de `/admin/leads` sobre leads antiguos — no lo genera ya ningún flujo automático. |
| `contactado` | sí (legado) | Ídem. |
| `cerrado` | sí | Cierre genérico sin más detalle. |

Estados terminales (`lib/leads/state-machine.ts#isTerminalStatus`):
`cerrado`, `descartado`, `ganado`, `perdido`, `cancelado`, `invalido`. Un
lead terminal no cuenta para la capacidad (`maxConcurrentLeads`) de un
profesional y el cron de plazos nunca lo toca.

## Diagrama de transiciones (resumen)

```
nuevo ──validar──> validado ──encolar──> en_cola ──asignar──> asignado
                       │                     ▲                   │
                       └──sin cobertura──> sin_cobertura ◄────────┘ (si no hay elegibles)
                                                                    │
                                                          notificar │
                                                                    ▼
                                                              notificado ──ver──> visto
                                                                    │                │
                                                     aceptar ───────┴────────────────┘
                                                        │                    rechazar/expirar
                                                        ▼                            │
                                                    aceptado                         ▼
                                                        │                  reasignacion_pendiente
                                                        ▼                            │
                                              contacto_pendiente ◄──────reasignado────┘
                                                        │                            │
                                              confirmar contacto              (vuelve a en_cola,
                                                        ▼                       intenta asignar de nuevo)
                                             contacto_confirmado
                                                   │        │
                                    iniciar presup. │        │ cerrar directo / perdido
                                                     ▼
                                         presupuesto_pendiente
                                                     │
                                         enviar presupuesto
                                                     ▼
                                         presupuesto_enviado ──> ganado / perdido / cerrado
```

`con_incidencia` es alcanzable desde casi cualquier estado no terminal, y
desde ahí un admin decide a qué estado volver (`validado`, `asignado`,
`contacto_pendiente`, `presupuesto_pendiente`, `cancelado`, `invalido`).

La tabla completa y autoritativa de transiciones válidas es
`TRANSITIONS` en `lib/leads/state-machine.ts` — este documento es una
guía de lectura, el código es la fuente de verdad.

## Quién dispara cada paso

| Paso | Disparado por | Archivo |
|---|---|---|
| `nuevo` → `validado` → asignación | Automático, al crear el lead | `lib/leads/intake-service.ts#processNewLead` |
| `asignado` → `notificado` | Automático, tras asignar | `lib/leads/assignment-service.ts#notifyProfessionalOfAssignment` |
| `notificado`/`visto` → `aceptado`/`rechazado` | El profesional, desde el portal | `lib/professional/lead-actions.ts` |
| `aceptado` → `contacto_pendiente` → `contacto_confirmado` | El profesional | `lib/professional/lead-actions.ts` |
| `contacto_confirmado` → `presupuesto_pendiente` → `presupuesto_enviado` | El profesional | `lib/professional/lead-actions.ts` |
| Avisos de plazo próximo, reasignación por plazo vencido | El cron (`/api/cron/lead-deadlines`) | `lib/leads/reassignment-service.ts` |
| Reasignación por rechazo | El profesional (indirectamente) | `rejectLeadAction` → `reassignLead()` |
| Reasignación manual, pausa manual, edición de campos legados | Un admin, desde `/admin/leads/[id]` o `/admin/leads` | `lib/admin/leads/*` |

## Lo que falta (no implementado todavía)

- **`expirado` por falta de respuesta del profesional**: existe el estado
  y `PROFESSIONAL_RESPONSE_WINDOW_HOURS` en `lib/leads/deadline-config.ts`,
  pero el cron (`processDeadlines`) hoy solo vigila plazos de **contacto**
  y de **presupuesto**, no el plazo de aceptar/rechazar tras la
  notificación inicial. Un lead notificado que el profesional ignora
  indefinidamente se queda en `notificado` hasta que un admin intervenga.
  Es una automatización pendiente, documentada aquí para no fingir que ya
  existe.
- **`en_validacion`/`en_revision_usuario`**: estados reservados para una
  validación asíncrona y para que el usuario revise presupuestos desde su
  propia cuenta — ninguna de las dos cosas existe todavía (no hay cuentas
  de usuario en este sistema, solo el email de contacto).
