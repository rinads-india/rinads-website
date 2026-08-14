import type { CommerceRepository } from "../repository";
import { err, ok } from "../result";
import type { CommerceContext, Result, SupportTicket } from "../types";

export class SupportService {
  constructor(private readonly repo: CommerceRepository) {}

  create(
    ctx: CommerceContext,
    input: {
      customerId: string;
      subject: string;
      category?: string;
      orderId?: string;
      body: string;
      authorType?: string;
    }
  ): Result<SupportTicket> {
    const store = this.repo.getStore();
    const now = new Date().toISOString();
    const ticket: SupportTicket = {
      id: this.repo.nextId("tkt"),
      organizationId: ctx.organizationId,
      customerId: input.customerId,
      orderId: input.orderId,
      category: input.category ?? "general",
      priority: "normal",
      status: "open",
      subject: input.subject,
      messages: [
        {
          id: this.repo.nextId("msg"),
          authorType: input.authorType ?? "customer",
          body: input.body,
          createdAt: now,
        },
      ],
      createdAt: now,
    };
    store.tickets.push(ticket);
    this.repo.saveStore(store);
    return ok(ticket);
  }

  getById(ctx: CommerceContext, ticketId: string, customerId?: string): Result<SupportTicket> {
    const ticket = this.repo
      .getStore()
      .tickets.find((t) => t.id === ticketId && t.organizationId === ctx.organizationId);
    if (!ticket) return err("TICKET_NOT_FOUND", "Support ticket not found.");
    if (customerId && ticket.customerId !== customerId) {
      return err("FORBIDDEN", "You do not have access to this ticket.");
    }
    return ok(ticket);
  }

  listForCustomer(ctx: CommerceContext, customerId: string): SupportTicket[] {
    return this.repo
      .getStore()
      .tickets.filter((t) => t.organizationId === ctx.organizationId && t.customerId === customerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listForOrg(ctx: CommerceContext): SupportTicket[] {
    return this.repo
      .getStore()
      .tickets.filter((t) => t.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
