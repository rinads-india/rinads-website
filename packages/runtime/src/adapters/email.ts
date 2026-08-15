import type { NotificationAdapter } from "./types";

export const emailAdapter: NotificationAdapter = {
  channel: "email",
  async send() {
    return { ok: true };
  },
};

export const whatsappAdapter: NotificationAdapter = {
  channel: "whatsapp",
  async send() {
    return { ok: true };
  },
};
