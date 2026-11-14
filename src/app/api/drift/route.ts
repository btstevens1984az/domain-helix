import { NextResponse } from "next/server";
import { DEMO_DRIFT } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const bySeverity = {
    high: DEMO_DRIFT.filter((d) => d.severity === "high").length,
    medium: DEMO_DRIFT.filter((d) => d.severity === "medium").length,
    low: DEMO_DRIFT.filter((d) => d.severity === "low").length,
  };
  return NextResponse.json({
    findings: DEMO_DRIFT,
    bySeverity,
    byType: DEMO_DRIFT.reduce<Record<string, number>>((acc, f) => {
      acc[f.type] = (acc[f.type] ?? 0) + 1;
      return acc;
    }, {}),
    generatedAt: new Date().toISOString(),
  });
}
