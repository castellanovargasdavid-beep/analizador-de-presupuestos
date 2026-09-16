# Sistema de notificaciones

## Estado real hoy

**No hay ningún proveedor de email, SMS o WhatsApp configurado.** Cero
dependencias de `resend`/`sendgrid`/`twilio`/`nodemailer`/similares en
`package.json`. Toda notificación que genera el sistema se registra en la
tabla `notifications`, pero se envía a través del único adaptador que
existe hoy: `mock`, que **nunca envía nada de verdad**.

Esto es intencional, no un descuido: la misión que originó este sistema
prohíbe explícitamente "afirmar que una notificación se ha enviado si el
proveedor externo no ha confirmado el envío". Así que en vez de fingir un
envío, cada notificación queda registrada con un estado honesto.

## Arquitectura

```
lib/notifications/
  templates.ts        — plantillas de texto (subject + body), una función
                         pura por clave, sin dependencias externas
  adapters/
    types.ts           — interfaz NotificationAdapter { send() }
    mock.ts             — el único adaptador implementado hoy
  service.ts           — sendNotification(): renderiza, persiste, envía,
                         actualiza el estado según la respuesta real
```

Ningún módulo de negocio (asignación, reasignación, portal de
profesional) llama a un proveedor directamente — todos pasan por
`sendNotification()`.

### Tabla `notifications`

| Columna | Qué guarda |
|---|---|
| `templateKey` | Qué plantilla se usó. |
| `channel` | `email` / `sms` / `whatsapp` / `interno`. |
| `recipient` | A quién (email o teléfono en texto plano — no hay lista de contactos separada). |
| `subject`, `body` | El contenido ya renderizado (para poder auditar exactamente lo que se habría enviado). |
| `leadId`, `professionalId` | Relación, cuando aplica. |
| `status` | `pendiente` → `simulado` \| `enviado` \| `fallido`. |
| `attempts` | Cuántas veces se ha intentado (hoy siempre 1: no hay reintento automático todavía). |
| `lastError` | Si el adaptador devolvió o lanzó un error. |
| `sentAt` | Solo se rellena si `status = 'enviado'` — nunca en `simulado`. |

### El significado exacto de cada estado

- **`pendiente`**: fila recién creada, antes de intentar el envío
  (transitorio, dura microsegundos en la práctica).
- **`simulado`**: el adaptador activo procesó la notificación pero
  **no la envió de verdad** — es lo que devuelve siempre `mock`. Esto es
  lo que verás en el 100% de las notificaciones hasta que se configure un
  proveedor real.
- **`enviado`**: el proveedor confirmó el envío. Solo puede ocurrir con un
  adaptador real conectado a un proveedor de verdad.
- **`fallido`**: el adaptador lanzó una excepción (p. ej. credenciales
  inválidas, proveedor caído). Nunca tumba el flujo de negocio que lo
  disparó (`sendNotification` nunca relanza el error hacia quien la llamó).

## Plantillas existentes (`lib/notifications/templates.ts`)

| Clave | Para quién | Cuándo se dispara |
|---|---|---|
| `lead_asignado` | Profesional | Al asignarle un lead nuevo. |
| `recordatorio_contacto` | Profesional | Reservada para un recordatorio previo al aviso de plazo (no disparada por ningún flujo todavía). |
| `aviso_plazo_proximo` | Profesional | Reservada, igual que la anterior. |
| `advertencia_reasignacion` | Profesional | El cron, cuando el plazo de contacto o de presupuesto está a punto de vencer. |
| `lead_reasignado` | Profesional (el anterior) | Al reasignar su lead a otro profesional. |
| `presupuesto_pendiente` | Profesional | Reservada (recordatorio de presupuesto pendiente, no disparada todavía). |
| `presupuesto_recibido` | Usuario | Reservada — hoy el usuario no recibe ninguna notificación de que ha llegado un presupuesto; se enteraría solo si vuelve a la página de resultado. |
| `incidencia` | Interno/admin | Reservada. |
| `confirmacion_usuario` | Usuario | Reservada — hoy no se confirma por email al usuario que su solicitud se ha registrado. |
| `solicitud_valoracion_operativa` | Usuario | Reservada (encuesta post-servicio). |

**Importante**: varias plantillas están definidas pero ningún flujo las
dispara todavía (marcadas "Reservada" arriba). Existen para que
`lib/leads/*` las use cuando se implemente esa parte, sin tener que
inventar el texto en ese momento — pero hoy el usuario **no recibe
ningún email** en ningún punto del proceso, solo el profesional.

## Cómo añadir un proveedor real

1. Crear `lib/notifications/adapters/<proveedor>.ts` implementando
   `NotificationAdapter`:
   ```ts
   export const resendAdapter: NotificationAdapter = {
     async send({ channel, recipient, subject, body }) {
       // llamada real al SDK/API del proveedor
       // devolver { sent: true } solo si el proveedor CONFIRMÓ el envío
       // devolver { sent: false, error } si no, nunca asumir éxito
     },
   };
   ```
2. Registrarlo en `ADAPTERS` dentro de `lib/notifications/service.ts`.
3. Añadir las credenciales necesarias a `.env.example` (documentadas, sin
   valores reales) y a la configuración de producción real (ver
   `docs/PRODUCTION-SETUP.md`) — nunca committear una clave real.
4. Cambiar `NOTIFICATION_ADAPTER` al nombre del nuevo adaptador en el
   entorno de producción. En local/staging puede seguir siendo `mock`.
5. Probar de verdad contra el proveedor (no solo `tsc`/tests) antes de
   asumir que las notificaciones a profesionales reales van a llegar.

## Lo que falta para que esto sea un sistema de notificaciones completo

- SMS y WhatsApp: solo hay adaptador de referencia para `email`
  (el `mock` acepta cualquier canal, pero no hay ningún proveedor de SMS/
  WhatsApp integrado ni siquiera de mentira más allá del log).
- Reintentos automáticos de un envío `fallido`.
- Notificar al usuario (confirmación de solicitud, presupuesto recibido)
  — hoy solo se notifica al profesional.
- Plantillas HTML con marca (hoy es texto plano a propósito, para no
  invertir en diseño antes de tener un proveedor real conectado).
