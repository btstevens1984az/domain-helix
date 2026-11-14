import { NextResponse } from "next/server";
import { listConnectorStatuses, probeConnector } from "@/lib/connectors/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const connectors = await listConnectorStatuses();
  return NextResponse.json({
    connectors,
    demoMode: process.env.DEMO_MODE !== "false",
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === "probe" && body.type) {
    const result = await probeConnector(body.type);
    return NextResponse.json(result);
  }
  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
