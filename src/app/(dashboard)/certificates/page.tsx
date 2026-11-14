"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { CertificateAsset } from "@/types";

function riskVariant(score: number) {
  if (score >= 80) return "critical" as const;
  if (score >= 60) return "degraded" as const;
  if (score >= 30) return "amber" as const;
  return "healthy" as const;
}

function heatColor(days: number) {
  if (days <= 14) return "bg-[var(--signal-critical)]";
  if (days <= 45) return "bg-[var(--signal-amber)]";
  if (days <= 120) return "bg-[color-mix(in_srgb,var(--accent-amber)_70%,var(--accent-teal))]";
  return "bg-[var(--signal-healthy)]";
}

export default function CertificatesPage() {
  const { role, setRole } = useRole();
  const [certs, setCerts] = useState<CertificateAsset[] | null>(null);
  const [buckets, setBuckets] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("/api/certificates")
      .then((r) => r.json())
      .then((d) => {
        setCerts(d.certificates);
        setBuckets(d.riskBuckets);
      });
  }, []);

  if (!certs || !buckets) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Certificate Authority Intelligence"
        subtitle="AD CS templates, issued certs, expiration heatmaps, and risk scoring"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(buckets).map(([k, v]) => (
            <Card key={k} className="!p-3.5">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {k} risk
              </div>
              <div className="mt-1 text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                {v}
              </div>
            </Card>
          ))}
        </div>

        <Card className="mb-4">
          <CardHeader
            title="Expiration heatmap"
            description="Tile intensity reflects days remaining — coral is imminent"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {certs.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-black/30 p-3 text-left"
                style={{
                  background: `linear-gradient(160deg, color-mix(in srgb, ${
                    c.daysRemaining <= 14
                      ? "var(--signal-critical)"
                      : c.daysRemaining <= 45
                        ? "var(--signal-amber)"
                        : "var(--signal-healthy)"
                  } 22%, transparent), rgba(8,12,18,0.7))`,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${heatColor(c.daysRemaining)}`} />
                  <span className="truncate text-xs font-medium">{c.name}</span>
                </div>
                <div className="mt-2 font-mono text-[11px] text-[var(--text-secondary)]">
                  {c.daysRemaining}d · risk {c.riskScore}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Inventory" description="CAs, templates, and issued certificates" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Kind</th>
                  <th className="pb-3 font-medium">Expires</th>
                  <th className="pb-3 font-medium">Crypto</th>
                  <th className="pb-3 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--border-subtle)]/60">
                    <td className="py-3">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {c.subject ?? c.templateName ?? c.caName}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="cyan">{c.kind}</Badge>
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {c.daysRemaining}d
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {new Date(c.expiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 text-xs text-[var(--text-secondary)]">
                      {c.keyLength}-bit · {c.hashAlgorithm}
                      {c.hashAlgorithm === "SHA1" || c.keyLength < 2048 ? (
                        <Badge variant="critical" className="ml-2">
                          weak
                        </Badge>
                      ) : null}
                    </td>
                    <td className="py-3">
                      <Badge variant={riskVariant(c.riskScore)}>{c.riskScore}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
