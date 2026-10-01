import { NextResponse } from "next/server";

interface RsvpBody {
  name?: unknown;
  side?: unknown;
  wish?: unknown;
}

/**
 * POST /api/rsvp — basic receiver for RSVP & wishes.
 * Validates the payload and (for now) logs it server-side.
 * TODO: persist to a database / Google Sheet / email service.
 */
export async function POST(req: Request) {
  let body: RsvpBody;
  try {
    body = (await req.json()) as RsvpBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const side = typeof body.side === "string" ? body.side.trim() : "";
  const wish = typeof body.wish === "string" ? body.wish.trim() : "";

  if (
    name.length < 2 ||
    wish.length < 2 ||
    !["Bride", "Groom", "Both", "bride", "groom", "both"].includes(side)
  ) {
    return NextResponse.json({ ok: false, error: "Missing or invalid fields" }, { status: 422 });
  }

  // Basic receiver — visible in server logs / hosting dashboard.
  console.log(`[rsvp] ${name} (${side}): ${wish}`);

  return NextResponse.json({ ok: true });
}
