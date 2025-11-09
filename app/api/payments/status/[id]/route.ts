import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { refreshSession } from "@/lib/services/payments";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(_: Request, { params }: Params) {
  const session = await refreshSession(params.id);
  if (!session) {
    logger.warn({ sessionId: params.id }, "payment session missing");
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  logger.debug({ sessionId: session.id, status: session.status }, "payment session status");
  return NextResponse.json(session);
}

