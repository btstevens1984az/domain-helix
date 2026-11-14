"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { formatMs, formatPercent } from "@/lib/utils";
import type { DcHealthMetric } from "@/types";

export default function HealthPage() {
  const { role, setRole } = useRole();
  const [metrics, setMetrics] = useState<DcHealthMetric[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/health")
        .then((r) => r.json())
        .then((d) => {
          setMetrics(d.metrics);
          if (!selected && d.metrics?.[0]) setSelected(d.metrics[0].nodeId);
        });
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [selected]);

  if (!metrics) return <PageSkeleton />;

  const active = metrics.find((m) => m.nodeId === selected) ?? metrics[0];
  const trend = Array.from({ length: 12 }).map((_, i) => ({
    t: `${i * 5}m`,
    ldap: Math.max(4, active.ldapLatencyMs + Math.sin(i / 2) * 8 + (Math.random() - 0.5) * 6),
    kerberos: Math.max(
      4,
      active.kerberosLatencyMs + Math.cos(i / 2.4) * 10 + (Math.random() - 0.5) * 5
    ),
  }));

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Domain Controller Health"
        subtitle="Replication, APM auth latency, EDR posture, patch compliance, and host health — scored continuously"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            {metrics.map((m, i) => (
              <motion.button
                key={m.nodeId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(m.nodeId)}
                className={`w-full rounded-[var(--radius-md)] border p-4 text-left transition-all ${
                  selected === m.nodeId
                    ? "border-[color-mix(in_srgb,var(--accent-cyan)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent-cyan)_8%,transparent)]"
                    : "border-[var(--border-subtle)] bg-white/[0.03] hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                      {m.hostname}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--text-muted)]">
                      lag {m.replicationLagSeconds}s · LDAP {formatMs(m.ldapLatencyMs)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold tabular-nums">{m.score}</div>
                    <Badge variant={m.level as "healthy"}>{m.level}</Badge>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader
                title={active.hostname}
                description={`FSMO: ${active.fsmoRoles.length ? active.fsmoRoles.join(" · ") : "none"}`}
                action={<Badge variant={active.level as "healthy"}>{active.score}</Badge>}
              />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Replication lag", `${active.replicationLagSeconds}s`],
                  ["LDAP latency", formatMs(active.ldapLatencyMs)],
                  ["Kerberos latency", formatMs(active.kerberosLatencyMs)],
                  ["NTDS size", `${active.ntdsSizeGb} GB`],
                  ["NTDS trend", `${active.ntdsTrendPct > 0 ? "+" : ""}${active.ntdsTrendPct}%`],
                  ["Cert risk", String(active.certRiskScore)],
                  ["EDR posture", `${active.edrSeverity} (${active.edrDetections})`],
                  ["Patch compliance", formatPercent(active.patchCompliancePct, 1)],
                  ["Host health", active.hostHealth],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2.5"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      {k}
                    </div>
                    <div className="mt-1 font-mono text-sm">{v}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Authentication latency"
                description="APM-correlated LDAP / Kerberos path (demo series)"
              />
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="ldap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3ecfcf" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#3ecfcf" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="kerb" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e6a23c" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#e6a23c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" stroke="#6b7f8c" fontSize={11} />
                    <YAxis stroke="#6b7f8c" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#101820",
                        border: "1px solid rgba(120,160,180,0.2)",
                        borderRadius: 12,
                      }}
                    />
                    <Area type="monotone" dataKey="ldap" stroke="#3ecfcf" fill="url(#ldap)" />
                    <Area type="monotone" dataKey="kerberos" stroke="#e6a23c" fill="url(#kerb)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Anomalies" description="Correlated signals requiring attention" />
              <div className="space-y-2">
                {active.anomalies.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No active anomalies.</p>
                ) : (
                  active.anomalies.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-black/15 px-3 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            a.severity === "critical"
                              ? "critical"
                              : a.severity === "warning"
                                ? "degraded"
                                : "default"
                          }
                        >
                          {a.severity}
                        </Badge>
                        <span className="text-xs text-[var(--text-muted)]">{a.category}</span>
                      </div>
                      <div className="mt-1.5 text-sm font-medium">{a.title}</div>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{a.detail}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
