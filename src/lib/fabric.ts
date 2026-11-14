import {
  DEMO_CERTIFICATES,
  DEMO_DC_HEALTH,
  DEMO_DRIFT,
  DEMO_GRAPH,
} from "@/lib/demo-data";

/** Unified fabric snapshot used by APIs — always graceful with demo fallback */
export async function getFabricSnapshot() {
  return {
    graph: DEMO_GRAPH,
    health: DEMO_DC_HEALTH,
    drift: DEMO_DRIFT,
    certificates: DEMO_CERTIFICATES,
    mode: process.env.DEMO_MODE !== "false" ? "demo" : "live",
    generatedAt: new Date().toISOString(),
  };
}
