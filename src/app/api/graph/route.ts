import { NextResponse } from "next/server";
import { getFabricSnapshot } from "@/lib/connectors/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getFabricSnapshot();
  return NextResponse.json({
    ...snapshot.graph,
    mode: snapshot.mode,
  });
}
