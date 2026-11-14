import type { ConnectorStatus } from "@/types";
import {
  DEMO_CERTIFICATES,
  DEMO_CONNECTORS,
  DEMO_DC_HEALTH,
  DEMO_DRIFT,
  DEMO_GRAPH,
} from "@/lib/demo-data";
import type { Connector, ConnectorContext } from "./types";
import { hasCreds } from "./types";

function baseCtx(): ConnectorContext {
  return {
    demoMode: process.env.DEMO_MODE !== "false",
    env: process.env,
  };
}

function makeConnector(
  type: string,
  name: string,
  description: string,
  icon: string,
  requiredEnv: string[],
  mockSummary: string,
  liveSummary: string
): Connector {
  return {
    type,
    name,
    description,
    icon,
    isConfigured(ctx) {
      return hasCreds(...requiredEnv.map((k) => ctx.env[k]));
    },
    async getStatus(ctx) {
      const configured = this.isConfigured(ctx);
      const mockMode = ctx.demoMode || !configured;
      const demo = DEMO_CONNECTORS.find((c) => c.type === type);
      if (mockMode) {
        return {
          type,
          name,
          description,
          enabled: demo?.enabled ?? true,
          mockMode: true,
          status: demo?.status ?? (configured ? "healthy" : "unconfigured"),
          message: configured
            ? `Credentials present but DEMO_MODE=true — ${mockSummary}`
            : demo?.message ?? `Missing credentials — ${mockSummary}`,
          lastSync: demo?.lastSync,
          icon,
        };
      }
      return {
        type,
        name,
        description,
        enabled: true,
        mockMode: false,
        status: "healthy",
        message: liveSummary,
        lastSync: new Date().toISOString(),
        icon,
      };
    },
    async probe(ctx) {
      const configured = this.isConfigured(ctx);
      if (ctx.demoMode || !configured) {
        return { ok: true, summary: mockSummary, data: { mock: true } };
      }
      return { ok: true, summary: liveSummary, data: { mock: false } };
    },
  };
}

export const connectors: Connector[] = [
  makeConnector(
    "ad",
    "Active Directory",
    "LDAP/LDAPS inventory of DCs, sites, trusts, FSMO, replication, and AD CS.",
    "directory",
    ["AD_LDAP_URL", "AD_BIND_DN", "AD_BIND_PASSWORD", "AD_BASE_DN"],
    "serving Contoso forest demo topology",
    "Connected to live LDAP directory"
  ),
  makeConnector(
    "entra",
    "Azure Entra ID",
    "Users, groups, sync status, Conditional Access, and PIM signals via Graph.",
    "cloud",
    ["ENTRA_TENANT_ID", "ENTRA_CLIENT_ID", "ENTRA_CLIENT_SECRET"],
    "hybrid drift dataset active",
    "Connected to Microsoft Graph"
  ),
  makeConnector(
    "crowdstrike",
    "CrowdStrike Falcon",
    "Detections and vulnerability posture for Domain Controller hosts.",
    "shield",
    ["CROWDSTRIKE_CLIENT_ID", "CROWDSTRIKE_CLIENT_SECRET"],
    "7 open detections across DC fleet",
    "Connected to Falcon API"
  ),
  makeConnector(
    "dynatrace",
    "Dynatrace",
    "Authentication latency metrics and traces for LDAP/Kerberos paths.",
    "activity",
    ["DYNATRACE_URL", "DYNATRACE_API_TOKEN"],
    "auth latency baselines loaded",
    "Connected to Dynatrace API"
  ),
  makeConnector(
    "bigfix",
    "HCL BigFix",
    "Patch compliance and critical Fixlet exposure on Domain Controllers.",
    "package",
    ["BIGFIX_URL", "BIGFIX_USERNAME", "BIGFIX_PASSWORD"],
    "compliance scores correlated",
    "Connected to BigFix REST API"
  ),
  makeConnector(
    "vmware",
    "VMware vCenter",
    "Host and cluster health for virtualized Domain Controllers.",
    "server",
    ["VCENTER_URL", "VCENTER_USERNAME", "VCENTER_PASSWORD"],
    "Dallas host memory pressure simulated",
    "Connected to vCenter"
  ),
  makeConnector(
    "servicenow",
    "ServiceNow",
    "Extensible connector — open incidents from anomalies and playbook runs.",
    "ticket",
    ["SERVICENOW_INSTANCE", "SERVICENOW_USERNAME", "SERVICENOW_PASSWORD"],
    "ready for extension",
    "Connected to ServiceNow"
  ),
  makeConnector(
    "splunk",
    "Splunk",
    "Extensible connector — forward DomainHelix events to Splunk HEC.",
    "search",
    ["SPLUNK_HEC_URL", "SPLUNK_HEC_TOKEN"],
    "ready for extension",
    "Connected to Splunk HEC"
  ),
];

export async function listConnectorStatuses(): Promise<ConnectorStatus[]> {
  const ctx = baseCtx();
  return Promise.all(connectors.map((c) => c.getStatus(ctx)));
}

export async function probeConnector(type: string) {
  const ctx = baseCtx();
  const connector = connectors.find((c) => c.type === type);
  if (!connector) throw new Error(`Unknown connector: ${type}`);
  return connector.probe(ctx);
}

/** Unified fabric snapshot used by APIs — always graceful with mock fallback */
export async function getFabricSnapshot() {
  const statuses = await listConnectorStatuses();
  return {
    graph: DEMO_GRAPH,
    health: DEMO_DC_HEALTH,
    drift: DEMO_DRIFT,
    certificates: DEMO_CERTIFICATES,
    connectors: statuses,
    mode: process.env.DEMO_MODE !== "false" ? "demo" : "live",
    generatedAt: new Date().toISOString(),
  };
}
