# Cómo incorporar a un profesional real

Guía operativa para un admin. Presupuesto Claro **no tiene, a fecha de
este documento, ningún profesional real incorporado** — la red empieza
vacía a propósito (ver `docs/MVP-COMPLETION-AUDIT.md`). Esto es la
checklist para cuando exista uno de verdad, no una simulación.

## Antes de dar de alta a nadie

1. **Verificación real fuera del sistema.** Presupuesto Claro no verifica
   identidad, seguros, ni cualificación profesional por sí mismo. Antes de
   marcar a alguien como `verificado`, un humano debe haber comprobado lo
   que la empresa considere necesario (alta de autónomo/empresa, seguro de
   responsabilidad civil, referencias...). El campo `verificationStatus`
   es una **afirmación del admin**, no una verificación automática.
2. **Consentimiento del profesional.** El profesional debe saber y aceptar
   (fuera de este sistema, por ahora — no hay firma electrónica integrada)
   que va a recibir datos de contacto de usuarios reales, bajo qué reglas
   de exclusividad y plazos (ver `docs/REASSIGNMENT-POLICY.md`), y qué se
   espera de él.

## Alta en `/admin/profesionales`

1. **Crear el profesional**: nombre, email, teléfono, notas internas.
   Se crea `pendiente` e inactivo por defecto — **no puede recibir leads
   todavía**.
2. **Fijar `verificationStatus = verificado`** solo cuando el paso de
   verificación externa esté hecho.
3. **Marcar `Activo`**. Sin esto, nunca es elegible aunque esté verificado
   (permite pausarlo sin perder su verificación ni su historial).
4. **Fijar una contraseña del portal** (campo "Fijar/restablecer
   contraseña" del formulario). Sin contraseña, no puede iniciar sesión en
   `/profesional/login` — comunícasela por un canal seguro (nunca por
   email en texto plano si se puede evitar; hoy no hay un flujo de
   "primer acceso" con token de un solo uso, es trabajo manual del admin).
5. **Configurar `Capacidad máxima`** (`maxConcurrentLeads`, por defecto 5):
   cuántos leads activos a la vez puede tener antes de dejar de ser
   elegible para uno nuevo. Súbelo con cautela — es la única palanca que
   evita saturar a un profesional nuevo.
6. **Añadir zonas de cobertura** (sección "Zonas y servicios que cubre"):
   una fila por combinación servicio + región. Dejar la región en blanco
   significa "toda España" para ese servicio — úsalo solo si el
   profesional de verdad cubre todo el país.

En cuanto está `verificado` + `activo` + con al menos una zona de
cobertura, **empezará a recibir leads automáticamente** por el algoritmo
de asignación (`docs/REASSIGNMENT-POLICY.md`) la próxima vez que entre un
lead compatible o se ejecute una reasignación. No hace falta ninguna
acción manual adicional para "activarlo".

## Qué puede hacer el profesional en su portal (`/profesional`)

- Ver sus leads asignados (activos y cerrados), con plazos.
- Aceptar o rechazar una solicitud (con motivo si rechaza).
- Confirmar que ha contactado al usuario, indicar si necesita una visita
  previa.
- Pausar el plazo de un lead con un motivo (p. ej. esperando al usuario o
  a una visita) — nunca penaliza al profesional mientras está pausado.
- Iniciar y enviar un presupuesto estructurado (importe, IVA, duración
  estimada, condiciones, observaciones, validez).
- Marcar el resultado final (contratado / no contratado / cerrado sin más
  detalle).
- Pausar su disponibilidad general (`/profesional/disponibilidad`):
  mientras esté pausado, no recibe ninguna asignación nueva, pero sus
  leads en curso siguen su ciclo normal.

## Qué NO puede hacer todavía (versión mínima del portal)

Documentado explícitamente para no simular un portal más completo del
que existe (ver mandato de la misión: "no simules que existe un portal
terminado si no lo está"):

- No puede subir archivos adjuntos al presupuesto (fotos, PDF).
- No puede proponer una fecha de visita estructurada (solo marcar
  "necesito visita" en texto).
- No puede ver métricas propias (tasa de aceptación, tiempo medio de
  respuesta...) — solo el admin las tiene, y solo derivadas de datos
  reales, nunca inventadas.
- No hay recuperación de contraseña autoservicio (`/profesional/login`
  no tiene "olvidé mi contraseña"); un admin debe restablecerla a mano
  desde `/admin/profesionales/[id]`.
- No hay notificación push/SMS al profesional en tiempo real — solo el
  email registrado en `notifications` (y hoy, sin proveedor real, ni
  siquiera ese email sale de verdad — ver `docs/NOTIFICATION-SYSTEM.md`).

## Suspender o dar de baja a un profesional

- **Pausa temporal**: desde `/admin/profesionales/[id]`, sección "Pausa
  manual" — fija `pausedUntil`/`pauseReason`, deja de ser elegible para
  leads nuevos, pero conserva los que ya tiene asignados y su historial.
- **Baja activa**: desmarcar `Activo`. Igual que la pausa pero sin fecha
  de fin automática.
- **Ningún lead asignado se cancela automáticamente** al pausar/dar de
  baja a un profesional — si hace falta reasignar sus leads en curso,
  hazlo manualmente desde la ficha de cada lead (`/admin/leads/[id]` →
  "Reasignar a otro profesional", con motivo obligatorio).
