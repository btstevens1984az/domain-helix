import { getLiveEvents, jitterHealth, DEMO_DC_HEALTH } from "@/lib/demo-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        if (closed) return;
        const health = jitterHealth(DEMO_DC_HEALTH);
        const payload = {
          type: "tick",
          events: getLiveEvents(),
          healthSample: health.map((h) => ({
            nodeId: h.nodeId,
            score: h.score,
            level: h.level,
            ldapLatencyMs: h.ldapLatencyMs,
            kerberosLatencyMs: h.kerberosLatencyMs,
            replicationLagSeconds: h.replicationLagSeconds,
          })),
          timestamp: new Date().toISOString(),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      send();
      const interval = setInterval(send, 4000);

      const cancel = () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // @ts-expect-error attach for cancel
      controller._cancel = cancel;
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
