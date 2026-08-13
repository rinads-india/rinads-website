export const APP_IDS = {
  website: "website",
  intelligence: "intelligence",
  client: "client",
} as const;

export type AppId = (typeof APP_IDS)[keyof typeof APP_IDS];
