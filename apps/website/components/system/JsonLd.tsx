import Script from "next/script";
import {
  JsonLdScriptProps,
  type JsonLdObject,
} from "@/lib/json-ld";

/** Server-safe JSON-LD script tag for marketing pages. */
export function JsonLd({ id, data }: { id: string; data: JsonLdObject | JsonLdObject[] }) {
  return <Script {...JsonLdScriptProps(id, data)} />;
}
