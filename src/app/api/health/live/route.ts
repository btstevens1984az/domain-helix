import { NextResponse } from "next/server";

/** Unauthenticated liveness probe for load balancers / compose healthchecks */
export async function GET() {
  return NextResponse.json({ ok: true, service: "domainhelix" });
}
