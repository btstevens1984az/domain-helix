"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import { downloadBlob } from "@/lib/utils";

interface Report {
  title: string;
  generatedAt: string;
  fleet: Record<string, number>;
  criticalFindings: string[];
  topology: Record<string, number>;
  recommendations: string[];
}

export default function ReportsPage() {
  const { role, setRole } = useRole();
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReport);
  }, []);

  async function exportMarkdown() {
    const res = await fetch("/api/reports?format=markdown");
    const text = await res.text();
    downloadBlob("domainhelix-executive-summary.md", text, "text/markdown");
  }

  async function exportDiagram() {
    const res = await fetch("/api/reports?format=diagram");
    const text = await res.text();
    downloadBlob("domainhelix-architecture.mmd", text, "text/plain");
  }

  function exportGraphJson() {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((g) =>
        downloadBlob(
          "domainhelix-identity-fabric.json",
          JSON.stringify(g, null, 2),
          "application/json"
        )
      );
  }

  if (!report) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Reports & Exports"
        subtitle="Executive summaries and architecture diagrams for stakeholders"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={exportMarkdown}>Export executive summary</Button>
          <Button variant="secondary" onClick={exportDiagram}>
            Export Mermaid diagram
          </Button>
          <Button variant="secondary" onClick={exportGraphJson}>
            Export fabric JSON
          </Button>
        </div>

        <Card className="mb-4">
          <CardHeader
            title={report.title}
            description={`Generated ${new Date(report.generatedAt).toLocaleString()}`}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(report.fleet).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-[var(--border-subtle)] bg-black/20 px-3 py-2.5"
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {k}
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{v}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Critical findings" />
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              {report.criticalFindings.map((f) => (
                <li
                  key={f}
                  className="rounded-xl border border-[var(--border-subtle)] bg-black/15 px-3 py-2 text-xs leading-relaxed"
                >
                  {f}
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Recommendations" />
            <ol className="list-decimal space-y-2 pl-4 text-sm text-[var(--text-secondary)]">
              {report.recommendations.map((r) => (
                <li key={r} className="text-xs leading-relaxed">
                  {r}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
