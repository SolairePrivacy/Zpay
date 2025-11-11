import { NextResponse } from "next/server";
import { eventsEnabled } from "@/lib/services/events";

export const runtime = "edge";

export async function GET() {
  if (!eventsEnabled()) {
    return NextResponse.json({ message: "Events not configured" }, { status: 503 });
  }

  return NextResponse.json(
    { message: "Realtime streaming is unavailable; fall back to polling." },
    { status: 501 },
  );
}

