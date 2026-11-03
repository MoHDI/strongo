import { NextResponse } from "next/server";
import { claimNeed, listNeeds, postNeed } from "@/lib/hubs";

export async function GET() {
  return NextResponse.json({ needs: listNeeds() });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    title?: unknown;
    detail?: unknown;
    name?: unknown;
    urgent?: unknown;
  } | null;

  if (!body || typeof body.title !== "string" || body.title.trim().length < 3) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }
  if (typeof body.name !== "string" || body.name.trim().length < 2) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }
  if (typeof body.detail !== "string" || body.detail.trim().length < 3) {
    return NextResponse.json({ error: "detail required" }, { status: 400 });
  }

  const need = postNeed({
    title: body.title.trim().slice(0, 120),
    detail: body.detail.trim().slice(0, 500),
    name: body.name.trim().slice(0, 60),
    urgent: body.urgent === true,
  });
  return NextResponse.json({ need }, { status: 201 });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    id?: unknown;
    volunteer?: unknown;
  } | null;

  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  if (typeof body.volunteer !== "string" || body.volunteer.trim().length < 2) {
    return NextResponse.json({ error: "volunteer name required" }, { status: 400 });
  }

  const need = claimNeed(body.id, body.volunteer.trim().slice(0, 60));
  if (!need) {
    return NextResponse.json({ error: "not found or already claimed" }, { status: 409 });
  }
  return NextResponse.json({ need });
}
