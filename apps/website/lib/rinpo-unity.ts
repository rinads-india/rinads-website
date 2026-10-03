/**
 * Public RINPO Unity Web asset contract.
 *
 * No tenant data or authentication tokens are passed to a Unity scene.
 * Only RINADS-owned asset locations are accepted.
 */
export type RinpoUnityManifest = {
  version: string;
  loader: string;
  data: string;
  framework: string;
  code: string;
};

const BUILD_FILE = /^Build\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

function isBuildFile(value: unknown, ending: RegExp): value is string {
  return typeof value === "string" && BUILD_FILE.test(value) && ending.test(value);
}

export function parseRinpoUnityManifest(input: unknown): RinpoUnityManifest | null {
  if (typeof input !== "object" || input === null) return null;
  const candidate = input as Record<string, unknown>;
  if (typeof candidate.version !== "string" ||
      !/^[A-Za-z0-9._-]{1,48}$/.test(candidate.version)) return null;
  if (!isBuildFile(candidate.loader, /\.loader\.js$/) ||
      !isBuildFile(candidate.data, /\.data(?:\.br|\.gz)?$/) ||
      !isBuildFile(candidate.framework, /\.framework\.js(?:\.br|\.gz)?$/) ||
      !isBuildFile(candidate.code, /\.wasm(?:\.br|\.gz)?$/)) return null;
  return {
    version: candidate.version,
    loader: candidate.loader,
    data: candidate.data,
    framework: candidate.framework,
    code: candidate.code,
  };
}

/**
 * Allow same-origin paths below /unity/rinpo/ or a dedicated owned asset host.
 * Paths supplied via env must never turn an unreviewed third-party script into
 * executable code on www.rinads.com.
 */
export function resolveRinpoUnityBaseUrl(raw: string, origin: string): string | null {
  if (!raw || raw.includes("..") || raw.includes("\\") || raw.includes("?") ||
      raw.includes("#") || raw.startsWith("//")) return null;
  try {
    const base = new URL(origin);
    const url = new URL(raw, base);
    if (!url.pathname.startsWith("/unity/rinpo/") || url.pathname.includes("//") ||
        url.username || url.password || url.search || url.hash) return null;
    const localPath = raw.startsWith("/") && !raw.startsWith("//") && url.origin === base.origin;
    const ownedCdn = url.protocol === "https:" && url.hostname === "assets.rinads.com";
    const ownedOrigin = url.protocol === "https:" && url.origin === base.origin;
    if (!localPath && !ownedCdn && !ownedOrigin) return null;
    return url.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}
