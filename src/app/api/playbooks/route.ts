import { NextResponse } from "next/server";
import { DEMO_PLAYBOOKS, DEMO_PLAYBOOK_RUNS } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

const runs = [...DEMO_PLAYBOOK_RUNS];

export async function GET() {
  return NextResponse.json({
    playbooks: DEMO_PLAYBOOKS,
    runs,
    generatedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const playbook = DEMO_PLAYBOOKS.find((p) => p.id === body.playbookId);
  if (!playbook) {
    return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
  }

  if (body.action === "approve" || body.action === "reject") {
    const run = runs.find((r) => r.id === body.runId);
    if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    run.status = body.action === "approve" ? "approved" : "rejected";
    run.approvedBy = "admin@domainhelix.local";
    if (body.action === "approve") {
      run.status = "running";
      setTimeout(() => {
        run.status = "succeeded";
        run.completedAt = new Date().toISOString();
        run.output = `Playbook "${playbook.name}" completed successfully on ${run.targetNodes.join(", ")}.`;
      }, 1500);
    }
    return NextResponse.json({ run });
  }

  const run = {
    id: `run-${Date.now()}`,
    playbookId: playbook.id,
    playbookName: playbook.name,
    targetNodes: body.targetNodes ?? [],
    status: playbook.requiresApproval ? "pending" : "running",
    requestedBy: "admin@domainhelix.local",
    createdAt: new Date().toISOString(),
    scheduledFor: body.scheduledFor,
  };
  runs.unshift(run);

  if (!playbook.requiresApproval) {
    setTimeout(() => {
      const r = runs.find((x) => x.id === run.id);
      if (r) {
        r.status = "succeeded";
        r.completedAt = new Date().toISOString();
        r.output = `Playbook "${playbook.name}" executed without approval requirement.`;
      }
    }, 1200);
  }

  return NextResponse.json({ run }, { status: 201 });
}
