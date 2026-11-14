import { NextResponse } from "next/server";
import {
  DEMO_CERTIFICATES,
  DEMO_DC_HEALTH,
  DEMO_DRIFT,
  DEMO_GRAPH,
  getFleetSummary,
} from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const summary = getFleetSummary();

  const report = {
    title: "DomainHelix Executive Summary",
    generatedAt: new Date().toISOString(),
    fleet: summary,
    criticalFindings: [
      ...DEMO_DC_HEALTH.filter((d) => d.level === "critical").map(
        (d) => `${d.hostname}: score ${d.score} — ${d.anomalies[0]?.title ?? "critical health"}`
      ),
      ...DEMO_DRIFT.filter((d) => d.severity === "high").map(
        (d) => `Drift: ${d.objectName} — ${d.detail}`
      ),
      ...DEMO_CERTIFICATES.filter((c) => c.riskScore >= 80).map(
        (c) => `Certificate risk: ${c.name} expires in ${c.daysRemaining} days`
      ),
    ],
    topology: {
      nodes: DEMO_GRAPH.nodes.length,
      edges: DEMO_GRAPH.edges.length,
      sites: DEMO_GRAPH.nodes.filter((n) => n.kind === "site").length,
      domainControllers: DEMO_GRAPH.nodes.filter((n) => n.kind === "domain_controller").length,
    },
    recommendations: [
      "Stabilize LON-DC01 replication before promoting additional EMEA workloads.",
      "Renew LON-DC01 Domain Controller authentication certificate (11 days remaining).",
      "Reclaim licenses on disabled accounts flagged in AD↔Entra drift.",
      "Schedule BigFix critical baseline for DAL-DC01 and LON-DC01 in next maintenance window.",
      "Investigate CrowdStrike high-severity detections on LON-DC01; consider containment playbook.",
    ],
  };

  if (format === "markdown" || format === "md") {
    const md = `# ${report.title}

Generated: ${report.generatedAt}

## Fleet Health
- Domain Controllers: ${report.fleet.dcCount}
- Average health score: ${report.fleet.avgScore}
- Critical DCs: ${report.fleet.criticalDcs}
- Degraded DCs: ${report.fleet.degradedDcs}
- Open anomalies: ${report.fleet.openAnomalies}
- High-severity drift: ${report.fleet.highDrift}
- High-risk certificates: ${report.fleet.certRisk}

## Critical Findings
${report.criticalFindings.map((f) => `- ${f}`).join("\n")}

## Topology
- Nodes: ${report.topology.nodes}
- Edges: ${report.topology.edges}
- Sites: ${report.topology.sites}
- Domain Controllers: ${report.topology.domainControllers}

## Recommendations
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;
    return new NextResponse(md, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="domainhelix-executive-summary.md"',
      },
    });
  }

  if (format === "diagram") {
    const mermaid = `flowchart LR
  subgraph AD["Active Directory"]
    PHX[PHX-DC01]
    DAL[DAL-DC01]
    LON[LON-DC01]
  end
  subgraph Entra["Azure Entra ID"]
    AADC[AADC-PHX01]
    TENANT[Contoso Tenant]
  end
  subgraph ADCS["AD CS"]
    ROOT[ROOT-CA]
    ISS[ISSUING-CA]
  end
  PHX -->|replication| DAL
  PHX -->|replication critical| LON
  PHX --> AADC --> TENANT
  ROOT --> ISS --> PHX
`;
    return new NextResponse(mermaid, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="domainhelix-architecture.mmd"',
      },
    });
  }

  return NextResponse.json(report);
}
