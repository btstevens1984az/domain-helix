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
 * replication and auth latency dominate; EDR and patch posture amplify risk.
 */
export function computeDcHealthScore(input: {
  replicationLagSeconds: number;
  ldapLatencyMs: number;
  kerberosLatencyMs: number;
  certRiskScore: number;
  edrSeverity: DcHealthMetric["edrSeverity"];
  patchMissingCritical: number;
  patchCompliancePct: number;
  ntdsTrendPct: number;
  hostHealth: HealthLevel;
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

  const edrMap = { none: 100, low: 85, medium: 60, high: 30, critical: 5 } as const;
  const edrScore = edrMap[input.edrSeverity];

  const patchScore = clamp(
    input.patchCompliancePct - input.patchMissingCritical * 6,
    0,
    100
  );
  const ntdsScore = clamp(100 - Math.max(0, input.ntdsTrendPct - 2) * 8, 0, 100);
  const hostScore =
    input.hostHealth === "healthy"
      ? 100
      : input.hostHealth === "degraded"
        ? 65
        : 30;

  const factors = {
    replication: lagScore,
    ldap: ldapScore,
    kerberos: kerberosScore,
    certificates: certScore,
    edr: edrScore,
    patch: patchScore,
    ntdsGrowth: ntdsScore,
    host: hostScore,
  };

  const score =
    lagScore * 0.22 +
    ldapScore * 0.12 +
    kerberosScore * 0.12 +
    certScore * 0.12 +
    edrScore * 0.14 +
    patchScore * 0.12 +
    ntdsScore * 0.08 +
    hostScore * 0.08;

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
