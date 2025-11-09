import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { processPendingSessions } from "@/lib/services/payments";

export async function POST() {
  await processPendingSessions();
  logger.info("cron processed pending sessions");
  return NextResponse.json({ status: "ok" });
}

