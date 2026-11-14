"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { DriftFinding } from "@/types";

const typeLabel: Record<string, string> = {
  orphaned_ad: "Orphaned in AD",
  orphaned_entra: "Orphaned in Entra",
  group_mismatch: "Group mismatch",
  disabled_licensed: "Disabled + licensed",
  attr_drift: "Attribute drift",
  missing_sync: "Missing sync scope",
};

export default function DriftPage() {
  const { role, setRole } = useRole();
  const [findings, setFindings] = useState<DriftFinding[] | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/drift")
      .then((r) => r.json())
      .then((d) => setFindings(d.findings));
  }, []);

  const filtered = useMemo(() => {
    if (!findings) return [];
    if (filter === "all") return findings;
    return findings.filter((f) => f.severity === filter || f.type === filter);
  }, [findings, filter]);

  if (!findings) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="AD ↔ Entra Drift"
        subtitle="Side-by-side hybrid identity consistency — orphans, membership, licensing, sync scope"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {["all", "high", "medium", "low", "group_mismatch", "disabled_licensed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1 text-[11px] transition ${
                filter === f
                  ? "border-[var(--accent-cyan)] text-[var(--accent-cyan)] bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)]"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {typeLabel[f] ?? f}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="On-premises Active Directory"
              description="Authoritative source for most hybrid attributes"
            />
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <EmptyState
                  title="No drift in this filter"
                  description="Adjust filters or connect live Entra + AD connectors."
                />
              ) : (
                filtered.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-[var(--border-subtle)] bg-black/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{f.objectName}</div>
                      <Badge
                        variant={
                          f.severity === "high"
                            ? "critical"
                            : f.severity === "medium"
                              ? "degraded"
                              : "default"
                        }
                      >
                        {f.severity}
                      </Badge>
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {typeLabel[f.type]} · {f.objectType}
                    </div>
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      {f.adSide ?? "—"}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Azure Entra ID"
              description="Cloud directory, licenses, PIM, and Conditional Access signals"
            />
            <div className="space-y-3">
              {filtered.map((f, i) => (
                <motion.div
                  key={`${f.id}-entra`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-black/20 p-3"
                >
                  <div className="font-medium">{f.objectName}</div>
                  <div className="mt-2 text-xs text-[var(--text-secondary)]">
                    {f.entraSide ?? "—"}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    {f.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
