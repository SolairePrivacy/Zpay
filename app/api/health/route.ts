import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";
import { getZcashBlockCount } from "@/lib/services/zcash";

export const runtime = "nodejs";

type RedisHealth = {
  status: "ok" | "error";
  error?: string;
};

type ZcashHealth = {
  status: "ok" | "error";
  error?: string;
  blockCount?: number;
};

export async function GET() {
  const timestamp = new Date().toISOString();

  const redisStatus: RedisHealth = { status: "ok" };

  try {
    const redis = getRedis();
    await redis.ping();
  } catch (error) {
    redisStatus.status = "error";
    redisStatus.error = "redis_unreachable";
  }

  const zcashStatus: ZcashHealth = { status: "ok" };

  try {
    const blockCount = await getZcashBlockCount();
    zcashStatus.blockCount = blockCount;
  } catch (error) {
    zcashStatus.status = "error";
    zcashStatus.error = "zcash_rpc_unreachable";
  }

  const overallHealthy =
    redisStatus.status === "ok" && zcashStatus.status === "ok";

  return NextResponse.json(
    {
      status: overallHealthy ? "ok" : "degraded",
      timestamp,
      checks: {
        redis: redisStatus,
        zcash: zcashStatus,
      },
    },
    {
      status: overallHealthy ? 200 : 503,
    }
  );
}

