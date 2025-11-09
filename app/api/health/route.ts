import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export const runtime = "edge";

export async function GET() {
  try {
    const redis = getRedis();
    await redis.ping();
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        error: "redis_unreachable",
      },
      { status: 503 }
    );
  }
}

