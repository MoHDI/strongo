// SAM 3.1 concept segmentation via the Meta Model API Responses API.
// Same base URL and auth as the chat models. Returns bounding boxes in
// source-pixel space. Fails soft (ok:false) on any error — callers treat
// missing outlines as "no overlay", never as a failure.
import { parseImageStream, recordsOfKind } from "@meta-sam/parser";
import type { ResponsesEvent } from "@meta-sam/parser";

export interface SamBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  confidence?: number;
}

async function* sseEvents(res: Response): AsyncGenerator<ResponsesEvent> {
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const chunks = buffer.split("\n\n");
    buffer = done ? "" : (chunks.pop() ?? "");
    for (const chunk of chunks) {
      for (const line of chunk.split("\n")) {
        const text = line.startsWith("data:") ? line.slice(5).trim() : "";
        if (!text || text === "[DONE]") continue;
        try {
          const event = JSON.parse(text) as { type?: unknown };
          if (event && typeof event.type === "string") {
            yield event as ResponsesEvent;
          }
        } catch {
          // Skip malformed SSE payloads; the parser tolerates gaps.
        }
      }
    }
    if (done) break;
  }
}

export type SegmentResult = { ok: true; boxes: SamBox[] } | { ok: false };

export async function segmentImage(
  imageDataUrl: string,
  concept: string
): Promise<SegmentResult> {
  const key = process.env.MODEL_API_KEY;
  if (!key) return { ok: false };
  try {
    const res = await fetch("https://api.meta.ai/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "sam-3.1",
        stream: true,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: concept },
              { type: "input_image", image_url: imageDataUrl },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok || !res.body) return { ok: false };
    const result = await parseImageStream(sseEvents(res)).finalResult;
    if (result.outcome.status !== "completed") return { ok: false };
    const boxes = recordsOfKind(result.records, "box")
      .slice(0, 30)
      .map((b) => ({
        left: b.left,
        top: b.top,
        right: b.right,
        bottom: b.bottom,
        ...(typeof b.confidence === "number" ? { confidence: b.confidence } : {}),
      }));
    return { ok: true, boxes };
  } catch {
    return { ok: false };
  }
}
