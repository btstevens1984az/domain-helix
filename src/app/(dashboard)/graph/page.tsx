"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { IdentityGraphView } from "@/components/graph/identity-graph";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { roleBlurb } from "@/lib/roles";
import { getFleetSummary } from "@/lib/demo-data";
import type { GraphNode, IdentityGraph } from "@/types";

export default function GraphPage() {
  const { role, setRole } = useRole();
  const [graph, setGraph] = useState<IdentityGraph | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const summary = getFleetSummary();

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then(setGraph)
      .catch(console.error);
  }, []);

  if (!graph) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Identity Fabric"
        subtitle={roleBlurb(role)}
        role={role}
        onRoleChange={setRole}
      />

      <div className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Avg DC Health", value: summary.avgScore, hint: "fleet score" },
            { label: "Critical DCs", value: summary.criticalDcs, hint: "needs triage" },
            { label: "Drift (high)", value: summary.highDrift, hint: "AD ↔ Entra" },
            { label: "Cert risk", value: summary.certRisk, hint: "expiring / weak" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="!p-3.5">
                <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {s.label}
                </div>
                <div
                  className="mt-1 text-2xl font-semibold tabular-nums"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">{s.hint}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid h-[calc(100%-5.5rem)] gap-4 xl:grid-cols-[1fr_320px]">
          <IdentityGraphView graph={graph} role={role} onSelect={setSelected} />

          <Card className="scrollbar-thin overflow-y-auto">
            <div className="mb-3 text-[13px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {selected ? selected.label : "Inspect a node"}
            </div>
            {selected ? (
              <div className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selected.health as "healthy" | "degraded" | "critical"}>
                    {selected.health}
                  </Badge>
                  <Badge variant="cyan">{selected.kind.replaceAll("_", " ")}</Badge>
                  <Badge>score {selected.score}</Badge>
                </div>
                {selected.subtitle ? (
                  <p className="text-xs text-[var(--text-secondary)]">{selected.subtitle}</p>
                ) : null}
                <div className="rounded-xl border border-[var(--border-subtle)] bg-black/20 p-3">
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {JSON.stringify(selected.meta, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                The graph is the emotional center of DomainHelix — Domain Controllers, replication,
                trusts, Entra Connect, certificate chains, and VMware hosts correlated in one living
                twin. Click any node to inspect correlated signals.
              </p>
            )}

            <div className="mt-6 space-y-2 border-t border-[var(--border-subtle)] pt-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Legend
              </div>
              {[
                ["Replication / sync edges animate", "cyan"],
                ["Green · healthy", "healthy"],
                ["Amber · degraded", "degraded"],
                ["Coral · critical", "critical"],
              ].map(([label, variant]) => (
                <div key={label} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Badge variant={variant as "cyan"}>{variant}</Badge>
                  {label}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
