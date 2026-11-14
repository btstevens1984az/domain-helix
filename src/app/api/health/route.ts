import { NextResponse } from "next/server";
import { DEMO_DC_HEALTH, getFleetSummary, jitterHealth } from "@/lib/demo-data";
import { computeDcHealthScore } from "@/lib/health-scoring";

export const dynamic = "force-dynamic";

export async function GET() {
  const metrics = jitterHealth(DEMO_DC_HEALTH).map((m) => {
    const computed = computeDcHealthScore(m);
    return { ...m, score: computed.score, level: computed.level, factors: computed.factors };
  });
  return NextResponse.json({
    metrics,
    summary: getFleetSummary(),
    generatedAt: new Date().toISOString(),
  });
}
