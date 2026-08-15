import type { VerticalTemplateKey } from "./index";
import { loadPublishedTemplates, type VerticalTemplateMeta } from "./index";

export type TemplateMarketplaceClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string | boolean
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> & {
        single?: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export class TemplateMarketplaceService {
  constructor(private client?: TemplateMarketplaceClient) {}

  async listPublished(): Promise<VerticalTemplateMeta[]> {
    return loadPublishedTemplates(this.client);
  }

  async getTemplate(key: string): Promise<VerticalTemplateMeta | null> {
    const templates = await this.listPublished();
    return templates.find((t) => t.key === key) ?? null;
  }

  async publishTemplate(key: VerticalTemplateKey): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client.from("vertical_templates").update({ is_published: true }).eq("key", key);
    return !error;
  }

  async deprecateTemplate(key: VerticalTemplateKey): Promise<boolean> {
    if (!this.client) return false;
    const { error } = await this.client.from("vertical_templates").update({ is_published: false }).eq("key", key);
    return !error;
  }
}
