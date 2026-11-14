import { NextResponse } from "next/server";
import { DEMO_CERTIFICATES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const sorted = [...DEMO_CERTIFICATES].sort((a, b) => a.daysRemaining - b.daysRemaining);
  return NextResponse.json({
    certificates: sorted,
    heatmap: sorted.map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      daysRemaining: c.daysRemaining,
      riskScore: c.riskScore,
    })),
    riskBuckets: {
      critical: sorted.filter((c) => c.riskScore >= 80).length,
      high: sorted.filter((c) => c.riskScore >= 60 && c.riskScore < 80).length,
      medium: sorted.filter((c) => c.riskScore >= 30 && c.riskScore < 60).length,
      low: sorted.filter((c) => c.riskScore < 30).length,
    },
    generatedAt: new Date().toISOString(),
  });
}
