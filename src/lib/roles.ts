import type { RoleView } from "@/types";

export const ROLE_FOCUS: Record<
  RoleView,
  { headline: string; emphasis: string[]; hide?: string[] }
> = {
  identity_engineer: {
    headline: "Identity Engineer view — sync, drift, and FSMO clarity",
    emphasis: ["drift", "sync", "fsmo", "certificates"],
  },
  security_analyst: {
    headline: "Security Analyst view — detections, containment, cert risk",
    emphasis: ["crowdstrike", "certificates", "playbooks", "anomalies"],
  },
  infrastructure_owner: {
    headline: "Infrastructure Owner view — host health, patches, replication",
    emphasis: ["vmware", "bigfix", "replication", "health"],
  },
  admin: {
    headline: "Administrator view — full hybrid fabric",
    emphasis: ["all"],
  },
};

export function roleBlurb(role: RoleView) {
  return ROLE_FOCUS[role]?.headline ?? ROLE_FOCUS.admin.headline;
}
