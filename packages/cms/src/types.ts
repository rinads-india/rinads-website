export type SitePageStatus = "draft" | "published";

export type SitePage = {
  id: string;
  slug: string;
  title: string;
  layoutKey: string;
  status: SitePageStatus;
  updatedAt: string;
  sections: Record<string, unknown>;
};

export type SiteSeo = {
  id: string;
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  canonicalUrl?: string;
  updatedAt: string;
};

export type SiteRedirect = {
  id: string;
  fromPath: string;
  toPath: string;
  permanent: boolean;
  createdAt: string;
};

export type SiteMedia = {
  id: string;
  storagePath: string;
  publicUrl: string;
  altText: string;
  mimeType: string;
  width?: number;
  height?: number;
  createdAt: string;
};

export type ServiceCardContent = {
  title: string;
  description: string;
  details: string[];
  href?: string;
};

export type CmsStore = {
  pages: SitePage[];
  seo: SiteSeo[];
  redirects: SiteRedirect[];
  media: SiteMedia[];
};

export type CmsSupabaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
};

export type CmsQueryBuilder = {
  select: (columns?: string) => CmsQueryBuilder;
  insert: (values: unknown) => CmsQueryBuilder;
  upsert: (values: unknown, options?: { onConflict?: string }) => CmsQueryBuilder;
  update: (values: unknown) => CmsQueryBuilder;
  delete: () => CmsQueryBuilder;
  eq: (column: string, value: unknown) => CmsQueryBuilder;
  order: (
    column: string,
    options?: { ascending?: boolean }
  ) => Promise<CmsSupabaseResult<Array<Record<string, unknown>>>> | CmsQueryBuilder;
  maybeSingle: () => Promise<CmsSupabaseResult<Record<string, unknown>>>;
  single: () => Promise<CmsSupabaseResult<Record<string, unknown>>>;
  then?: never;
};

export type CmsSupabaseClient = {
  from: (table: string) => CmsQueryBuilder;
};
