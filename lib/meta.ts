// Minimal client for the Meta Model API (OpenAI-compatible).
// Key from https://dev.meta.ai dashboard, in MODEL_API_KEY (see .env.example).
// Model IDs: standard tiers only. Never use *-contributor IDs — Meta trains
// on those prompts, wrong for a community-trust app.

const BASE = "https://api.meta.ai/v1";

export const TEXT_MODEL = "muse-spark-1.3";
export const VISION_MODEL = "muse-wonder-1.0";

export function hasKey(): boolean {
  return !!process.env.MODEL_API_KEY;
}

export type ChatContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: ChatContent;
}

export type ChatResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function chatComplete(
  messages: ChatMessage[],
  opts?: { model?: string; maxTokens?: number }
): Promise<ChatResult> {
  const key = process.env.MODEL_API_KEY;
  if (!key) return { ok: false, error: "missing_key" };

  let res: Response;
  try {
    res = await fetch(`${BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: opts?.model ?? TEXT_MODEL,
        messages,
        max_tokens: opts?.maxTokens ?? 800,
      }),
    });
  } catch {
    return { ok: false, error: "network_error" };
  }

  if (!res.ok) return { ok: false, error: `meta_${res.status}` };

  const data = (await res.json()) as {
    choices?: Array<{
      message?: { content?: unknown };
      finish_reason?: unknown;
    }>;
  };
  const text = extractReplyText(data);
  if (!text) {
    const reason = data?.choices?.[0]?.finish_reason;
    return {
      ok: false,
      error: `empty_response:${typeof reason === "string" ? reason : "unknown"}`,
    };
  }
  return { ok: true, text };
}

// Pulls reply text out of a chat-completion payload. Handles both the
// plain-string `content` form and the content-blocks array form
// ([{ type: "text", text: "..." }]) some models return.
export function extractReplyText(data: unknown): string | null {
  const content = (
    data as { choices?: Array<{ message?: { content?: unknown } }> }
  )?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content || null;
  if (Array.isArray(content)) {
    const text = content
      .map((b) =>
        typeof b === "object" && b !== null && typeof (b as { text?: unknown }).text === "string"
          ? (b as { text: string }).text
          : ""
      )
      .join("");
    return text || null;
  }
  return null;
}

export function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
