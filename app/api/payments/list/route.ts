import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { listSessions } from "@/lib/services/payments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") ?? undefined;
  const limitParam = searchParams.get("limit") ?? undefined;
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const result = await listSessions({ cursor, limit });
  logger.debug({ count: result.sessions.length }, "list payment sessions");
  return NextResponse.json(result);
}

