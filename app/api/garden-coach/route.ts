import { NextResponse } from "next/server";
import { chatComplete } from "@/lib/meta";

const FALLBACK =
  "Start with soil: an inch of compost worked into the top few inches fixes " +
  "most beginner problems. Water deeply a few times a week rather than a " +
  "little daily, mulch bare soil to hold moisture and stop weeds, and plant " +
  "one bed at a time — a small tended garden outproduces a big neglected one. " +
  "Your local extension office (linked below the plan) has free advice tuned " +
  "to your county.";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    question?: unknown;
    context?: unknown;
  } | null;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const context = typeof body?.context === "string" ? body.context.slice(0, 800) : "";

  const result = await chatComplete(
    [
      {
        role: "system",
        content: `You are Strongo's garden coach, advising a neighbor converting their yard to a vegetable garden. Answer in 2-4 short sentences, practical and specific. Their plan so far: ${context}`,
      },
      { role: "user", content: question },
    ],
    { maxTokens: 400 }
  );

  if (!result.ok) {
    return NextResponse.json({ reply: FALLBACK, source: "local" });
  }
  return NextResponse.json({ reply: result.text, source: "ai" });
}
