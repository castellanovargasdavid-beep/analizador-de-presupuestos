export interface OutgoingNotification {
  channel: "email" | "sms" | "whatsapp" | "interno";
  recipient: string;
  subject: string;
  body: string;
}

export interface AdapterSendResult {
  /** `true` solo si el proveedor confirmó el envío de verdad. El adaptador mock nunca devuelve `true`. */
  sent: boolean;
  error?: string;
}

export interface NotificationAdapter {
  send(notification: OutgoingNotification): Promise<AdapterSendResult>;
}
