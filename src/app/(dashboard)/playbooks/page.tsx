"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { PlaybookDefinition, PlaybookRunSummary } from "@/types";

export default function PlaybooksPage() {
  const { role, setRole } = useRole();
  const [playbooks, setPlaybooks] = useState<PlaybookDefinition[] | null>(null);
  const [runs, setRuns] = useState<PlaybookRunSummary[]>([]);
  const [selected, setSelected] = useState<PlaybookDefinition | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () =>
    fetch("/api/playbooks")
      .then((r) => r.json())
      .then((d) => {
        setPlaybooks(d.playbooks);
        setRuns(d.runs);
        if (!selected && d.playbooks?.[0]) setSelected(d.playbooks[0]);
      });

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runPlaybook(pb: PlaybookDefinition) {
    setBusy(true);
    await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playbookId: pb.id,
        targetNodes: pb.id.includes("lon") || pb.category !== "sync" ? ["dc-lon01"] : ["entra-connect"],
      }),
    });
    await reload();
    setBusy(false);
  }

  async function moderate(runId: string, action: "approve" | "reject") {
    setBusy(true);
    await fetch("/api/playbooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, runId }),
    });
    await reload();
    setBusy(false);
  }

  if (!playbooks) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Remediation Playbooks"
        subtitle="PowerShell, Ansible, and SSH — with safe approval workflows"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            {playbooks.map((pb, i) => (
              <motion.button
                key={pb.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(pb)}
                className={`w-full rounded-[var(--radius-md)] border p-4 text-left ${
                  selected?.id === pb.id
                    ? "border-[color-mix(in_srgb,var(--accent-cyan)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_8%,transparent)]"
                    : "border-[var(--border-subtle)] bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                      {pb.name}
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{pb.description}</p>
                  </div>
                  <Badge
                    variant={
                      pb.riskLevel === "high"
                        ? "critical"
                        : pb.riskLevel === "medium"
                          ? "degraded"
                          : "healthy"
                    }
                  >
                    {pb.riskLevel}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="cyan">{pb.platform}</Badge>
                  <Badge>{pb.category}</Badge>
                  <Badge variant="default">{pb.estimatedDuration}</Badge>
                  {pb.requiresApproval ? <Badge variant="amber">approval required</Badge> : null}
                </div>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            {selected ? (
              <Card>
                <CardHeader
                  title={selected.name}
                  description={selected.description}
                  action={
                    <Button size="sm" disabled={busy} onClick={() => runPlaybook(selected)}>
                      {selected.requiresApproval ? "Request run" : "Run now"}
                    </Button>
                  }
                />
                <pre className="scrollbar-thin max-h-72 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[#060a0e] p-4 text-[11px] leading-relaxed text-[var(--accent-cyan)]">
                  {selected.script}
                </pre>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Approval queue & history" description="Least-privilege change control" />
              <div className="space-y-2">
                {runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-black/20 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">{run.playbookName}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {run.requestedBy} · {new Date(run.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Badge
                        variant={
                          run.status === "succeeded"
                            ? "healthy"
                            : run.status === "failed" || run.status === "rejected"
                              ? "critical"
                              : "degraded"
                        }
                      >
                        {run.status}
                      </Badge>
                    </div>
                    {run.status === "pending" ? (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" disabled={busy} onClick={() => moderate(run.id, "approve")}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={busy}
                          onClick={() => moderate(run.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                    {run.output ? (
                      <p className="mt-2 text-xs text-[var(--text-secondary)]">{run.output}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
