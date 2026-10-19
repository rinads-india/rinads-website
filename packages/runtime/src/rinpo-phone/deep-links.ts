export interface RinpoDeepLink {
  scheme: "rinpo" | "https";
  host: string;
  path: string;
  segments: string[];
  query: URLSearchParams;
}

const WEB_HOST = "phone.rinads.com";

export function parseRinpoDeepLink(input: string): RinpoDeepLink | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.protocol === "rinpo:") {
    const path = `/${[url.hostname, url.pathname.replace(/^\//, "")].filter(Boolean).join("/")}`;
    return {
      scheme: "rinpo",
      host: url.hostname,
      path,
      segments: path.split("/").filter(Boolean),
      query: url.searchParams,
    };
  }

  if (url.protocol === "https:" && url.hostname === WEB_HOST) {
    return {
      scheme: "https",
      host: url.hostname,
      path: url.pathname,
      segments: url.pathname.split("/").filter(Boolean),
      query: url.searchParams,
    };
  }

  return null;
}

export function createRinpoDeepLink(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `rinpo://${normalized}`;
}

export function createRinpoWebFallback(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `https://${WEB_HOST}${normalized}`;
}
