/**
 * Registro centralizado de plantillas de notificación. Texto plano
 * (sin HTML): el objetivo es tener el contenido correcto y auditable, no
 * un diseño de email — eso se puede añadir después sin cambiar esta
 * interfaz.
 */
export type NotificationTemplateKey =
  | "lead_asignado"
  | "recordatorio_contacto"
  | "aviso_plazo_proximo"
  | "advertencia_reasignacion"
  | "lead_reasignado"
  | "presupuesto_pendiente"
  | "presupuesto_recibido"
  | "incidencia"
  | "confirmacion_usuario"
  | "solicitud_valoracion_operativa";

export interface RenderedNotification {
  subject: string;
  body: string;
}

export interface TemplateContext {
  professionalName?: string;
  leadDescription?: string;
  serviceName?: string;
  deadline?: Date;
  reason?: string;
  userName?: string;
}

function formatDeadline(d?: Date): string {
  if (!d) return "el plazo indicado";
  return d.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

const RENDERERS: Record<NotificationTemplateKey, (ctx: TemplateContext) => RenderedNotification> = {
  lead_asignado: (ctx) => ({
    subject: `Nueva solicitud: ${ctx.serviceName ?? "servicio"}`,
    body: `Hola ${ctx.professionalName ?? ""},\n\nTienes una nueva solicitud de presupuesto para "${ctx.serviceName ?? "un servicio"}". Tienes hasta ${formatDeadline(ctx.deadline)} para confirmar que vas a contactar con el usuario.\n\nDetalles: ${ctx.leadDescription ?? "sin descripción adicional"}.`,
  }),
  recordatorio_contacto: (ctx) => ({
    subject: "Recordatorio: tienes una solicitud pendiente de contacto",
    body: `Hola ${ctx.professionalName ?? ""},\n\nTe recordamos que tienes una solicitud pendiente de contactar antes de ${formatDeadline(ctx.deadline)}.`,
  }),
  aviso_plazo_proximo: (ctx) => ({
    subject: "Aviso: el plazo de tu solicitud está a punto de vencer",
    body: `Hola ${ctx.professionalName ?? ""},\n\nEl plazo para esta solicitud vence el ${formatDeadline(ctx.deadline)}. Si ya has actuado, actualiza el estado desde tu panel.`,
  }),
  advertencia_reasignacion: (ctx) => ({
    subject: "La solicitud que tienes asignada podría reasignarse",
    body: `Hola ${ctx.professionalName ?? ""},\n\nLa solicitud que tienes asignada está pendiente de contacto o de presupuesto. Si no actualizas su estado antes de ${formatDeadline(ctx.deadline)}, podría reasignarse a otro profesional según las condiciones del servicio.`,
  }),
  lead_reasignado: (ctx) => ({
    subject: "Una solicitud que tenías asignada se ha reasignado",
    body: `Hola ${ctx.professionalName ?? ""},\n\nLa solicitud se ha reasignado a otro profesional. Motivo: ${ctx.reason ?? "no se recibió actualización dentro del plazo"}.`,
  }),
  presupuesto_pendiente: (ctx) => ({
    subject: "Recuerda enviar tu presupuesto",
    body: `Hola ${ctx.professionalName ?? ""},\n\nTienes pendiente enviar el presupuesto para esta solicitud antes de ${formatDeadline(ctx.deadline)}.`,
  }),
  presupuesto_recibido: (ctx) => ({
    subject: "Has recibido un presupuesto",
    body: `Hola ${ctx.userName ?? ""},\n\nHas recibido un presupuesto para tu solicitud de "${ctx.serviceName ?? "servicio"}". Puedes consultarlo desde el enlace de tu resultado.`,
  }),
  incidencia: (ctx) => ({
    subject: "Incidencia registrada en una solicitud",
    body: `Se ha registrado una incidencia: ${ctx.reason ?? "sin detalle"}.`,
  }),
  confirmacion_usuario: (ctx) => ({
    subject: "Hemos registrado tu solicitud",
    body: `Hola ${ctx.userName ?? ""},\n\nHemos registrado tu solicitud de "${ctx.serviceName ?? "servicio"}". Te contactaremos en cuanto un profesional verificado la acepte.`,
  }),
  solicitud_valoracion_operativa: () => ({
    subject: "Cómo fue tu experiencia",
    body: `Nos ayudaría saber cómo fue el proceso de esta solicitud, para mejorar el servicio.`,
  }),
};

export function renderTemplate(key: NotificationTemplateKey, ctx: TemplateContext): RenderedNotification {
  return RENDERERS[key](ctx);
}
