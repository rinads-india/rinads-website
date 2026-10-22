import type { RinpoResolvedModelRoute } from "./provider-router";

export type RinpoJsonGenerationRequest = {
  system: string;
  user: unknown;
  maxOutputTokens?: number;
};

function extractAnthropicText(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const content = (json as { content?: unknown }).content;
  if (!Array.isArray(content)) return undefined;
  const text = content
    .filter((block): block is { type: string; text: string } => {
      return Boolean(
        block &&
          typeof block === "object" &&
          (block as { type?: unknown }).type === "text" &&
          typeof (block as { text?: unknown }).text === "string"
      );
    })
    .map((block) => block.text)
    .join("")
    .trim();
  return text || undefined;
}

function extractGoogleText(json: unknown): string | undefined {
  if (!json || typeof json !== "object") return undefined;
  const candidates = (json as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return undefined;
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;
    const content = (candidate as { content?: { parts?: unknown } }).content;
    if (!content || !Array.isArray(content.parts)) continue;
    const text = content.parts
      .filter((part): part is { text: string } => Boolean(part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"))
      .map((part) => part.text)
      .join("")
      .trim();
    if (text) return text;
  }
  return undefined;
}

/**
 * Server-only, provider-neutral text/JSON generation seam for RINPO.
 *
 * This class deliberately does not expose credentials, execute RINADS tools,
 * or make authorization decisions. It only translates a governed inference
 * request into the selected vendor protocol and returns model text.
 */
export class RinpoModelClient {
  constructor(
    private readonly route: RinpoResolvedModelRoute,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  async generateJsonText(request: RinpoJsonGenerationRequest): Promise<string | undefined> {
    if (!this.route.configured || !this.route.apiKey) return undefined;

    if (this.route.provider === "anthropic") {
      const response = await this.fetchImpl(`${this.route.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.route.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.route.model,
          max_tokens: request.maxOutputTokens ?? 1024,
          system: `${request.system}\nReturn valid JSON only.`,
          messages: [{ role: "user", content: JSON.stringify(request.user) }],
        }),
      });
      if (!response.ok) return undefined;
      return extractAnthropicText(await response.json());
    }

    if (this.route.provider === "google") {
      const response = await this.fetchImpl(
        `${this.route.baseUrl}/models/${encodeURIComponent(this.route.model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.route.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: `${request.system}\nReturn valid JSON only.` }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(request.user) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: request.maxOutputTokens ?? 1024,
            },
          }),
        }
      );
      if (!response.ok) return undefined;
      return extractGoogleText(await response.json());
    }

    const response = await this.fetchImpl(`${this.route.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.route.apiKey}`,
      },
      body: JSON.stringify({
        model: this.route.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: JSON.stringify(request.user) },
        ],
      }),
    });
    if (!response.ok) return undefined;
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content?.trim();
    return content || undefined;
  }
}
