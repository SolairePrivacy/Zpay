import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { refreshSession } from "@/lib/services/payments";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, { params }: Params) {
  const { id } = await params;
  const session = await refreshSession(id);
  if (!session) {
    logger.warn({ sessionId: id }, "payment session missing");
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  logger.debug({ sessionId: session.id, status: session.status }, "payment session status");
  return NextResponse.json(session);
}

