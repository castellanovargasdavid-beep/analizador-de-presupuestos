import type { AdapterSendResult, NotificationAdapter, OutgoingNotification } from "./types";

/**
 * Adaptador por defecto mientras no haya un proveedor de email/SMS/WhatsApp
 * configurado (ver docs/NOTIFICATION-SYSTEM.md). Nunca envía nada de
 * verdad: registra la notificación en el log del servidor y devuelve
 * `sent: false` siempre, para que quede honestamente marcada como
 * `simulado` en la tabla `notifications`, nunca como `enviado`.
 */
export const mockAdapter: NotificationAdapter = {
  async send(notification: OutgoingNotification): Promise<AdapterSendResult> {
    console.log(
      `[notifications:mock] ${notification.channel} -> ${notification.recipient}: ${notification.subject}`,
    );
    return { sent: false };
  },
};
