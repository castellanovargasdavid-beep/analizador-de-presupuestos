/**
 * Capa de notificaciones desacoplada del resto de la aplicación. Ningún
 * módulo de leads/profesionales llama a un proveedor de email/SMS
 * directamente — todos pasan por `sendNotification()`.
 *
 * El adaptador activo se elige por `NOTIFICATION_ADAPTER` (por defecto
 * `mock`, el único disponible hoy porque no hay ningún proveedor
 * configurado). Añadir un proveedor real es implementar un
 * `NotificationAdapter` nuevo y registrarlo aquí — ver
 * docs/NOTIFICATION-SYSTEM.md.
 */
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mockAdapter } from "./adapters/mock";
import type { NotificationAdapter } from "./adapters/types";
import { renderTemplate, type NotificationTemplateKey, type TemplateContext } from "./templates";

const ADAPTERS: Record<string, NotificationAdapter> = {
  mock: mockAdapter,
};

function getActiveAdapter(): NotificationAdapter {
  const key = process.env.NOTIFICATION_ADAPTER ?? "mock";
  return ADAPTERS[key] ?? mockAdapter;
}

export interface SendNotificationArgs {
  templateKey: NotificationTemplateKey;
  channel: "email" | "sms" | "whatsapp" | "interno";
  recipient: string;
  context: TemplateContext;
  leadId?: string;
  professionalId?: string;
}

/**
 * Renderiza la plantilla, la persiste siempre (haya o no proveedor real),
 * y solo la marca `enviado` si el adaptador activo confirma el envío de
 * verdad. Nunca lanza si el envío falla: una notificación fallida no debe
 * tumbar el flujo de negocio que la disparó.
 */
export async function sendNotification(args: SendNotificationArgs): Promise<void> {
  const { subject, body } = renderTemplate(args.templateKey, args.context);

  const [row] = await db
    .insert(notifications)
    .values({
      templateKey: args.templateKey,
      channel: args.channel,
      recipient: args.recipient,
      subject,
      body,
      leadId: args.leadId ?? null,
      professionalId: args.professionalId ?? null,
      status: "pendiente",
      attempts: 1,
    })
    .returning();

  const adapter = getActiveAdapter();
  try {
    const result = await adapter.send({ channel: args.channel, recipient: args.recipient, subject, body });
    await db
      .update(notifications)
      .set({
        status: result.sent ? "enviado" : "simulado",
        sentAt: result.sent ? new Date() : null,
        lastError: result.error ?? null,
      })
      .where(eq(notifications.id, row.id));
  } catch (err) {
    await db
      .update(notifications)
      .set({ status: "fallido", lastError: err instanceof Error ? err.message : String(err) })
      .where(eq(notifications.id, row.id));
  }
}
