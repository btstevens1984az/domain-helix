import type { DcHealthMetric, HealthLevel } from "@/types";

export function scoreToLevel(score: number): HealthLevel {
  if (score >= 85) return "healthy";
  if (score >= 65) return "degraded";
  if (score > 0) return "critical";
  return "unknown";
}

/**
 * Composite Domain Controller health score (0–100).
 * Weights tuned for identity infrastructure triage:
 * replication and auth latency dominate; security and patch posture amplify risk.
 */
export function computeDcHealthScore(input: {
  replicationLagSeconds: number;
  ldapLatencyMs: number;
  kerberosLatencyMs: number;
  certRiskScore: number;
  crowdstrikeSeverity: DcHealthMetric["crowdstrikeSeverity"];
  bigFixMissingCritical: number;
  bigFixCompliancePct: number;
  ntdsTrendPct: number;
  vmwareHostHealth: HealthLevel;
}): { score: number; level: HealthLevel; factors: Record<string, number> } {
  const lagScore = clamp(
    100 - Math.max(0, input.replicationLagSeconds - 30) / 20,
    0,
    100
  );
  const ldapScore = clamp(100 - Math.max(0, input.ldapLatencyMs - 15) * 1.2, 0, 100);
  const kerberosScore = clamp(
    100 - Math.max(0, input.kerberosLatencyMs - 15) * 1.2,
    0,
    100
  );
  const certScore = clamp(100 - input.certRiskScore, 0, 100);

  const csMap = { none: 100, low: 85, medium: 60, high: 30, critical: 5 } as const;
  const csScore = csMap[input.crowdstrikeSeverity];

  const patchScore = clamp(
    input.bigFixCompliancePct - input.bigFixMissingCritical * 6,
    0,
    100
  );
  const ntdsScore = clamp(100 - Math.max(0, input.ntdsTrendPct - 2) * 8, 0, 100);
  const vmScore =
    input.vmwareHostHealth === "healthy"
      ? 100
      : input.vmwareHostHealth === "degraded"
        ? 65
        : 30;

  const factors = {
    replication: lagScore,
    ldap: ldapScore,
    kerberos: kerberosScore,
    certificates: certScore,
    crowdstrike: csScore,
    patch: patchScore,
    ntdsGrowth: ntdsScore,
    vmware: vmScore,
  };

  const score =
    lagScore * 0.22 +
    ldapScore * 0.12 +
    kerberosScore * 0.12 +
    certScore * 0.12 +
    csScore * 0.14 +
    patchScore * 0.12 +
    ntdsScore * 0.08 +
    vmScore * 0.08;

  const rounded = Math.round(clamp(score, 0, 100));
  return { score: rounded, level: scoreToLevel(rounded), factors };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function certRiskFromDays(daysRemaining: number, weakCrypto = false): number {
  let risk = 0;
  if (daysRemaining <= 7) risk = 95;
  else if (daysRemaining <= 14) risk = 85;
  else if (daysRemaining <= 30) risk = 70;
  else if (daysRemaining <= 60) risk = 50;
  else if (daysRemaining <= 90) risk = 35;
  else if (daysRemaining <= 180) risk = 20;
  else risk = 8;
  if (weakCrypto) risk = Math.min(100, risk + 25);
  return risk;
}
