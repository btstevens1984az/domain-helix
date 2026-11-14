export type RoleView = "identity_engineer" | "security_analyst" | "infrastructure_owner" | "admin";

export type NodeKind =
  | "domain_controller"
  | "site"
  | "subnet"
  | "trust"
  | "entra_tenant"
  | "entra_connect"
  | "certificate_authority"
  | "certificate_template"
  | "virt_host"
  | "virt_cluster";

export type EdgeKind =
  | "replication"
  | "trust"
  | "sync"
  | "site_membership"
  | "subnet_link"
  | "certificate_chain"
  | "hosts_on"
  | "fsmo";

export type HealthLevel = "healthy" | "degraded" | "critical" | "unknown";

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  subtitle?: string;
  health: HealthLevel;
  score: number;
  site?: string;
  meta: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  label?: string;
  health?: HealthLevel;
  meta?: Record<string, unknown>;
}

export interface IdentityGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
}

export interface DcHealthMetric {
  nodeId: string;
  hostname: string;
  score: number;
  level: HealthLevel;
  replicationLagSeconds: number;
  ntdsSizeGb: number;
  ntdsTrendPct: number;
  ldapLatencyMs: number;
  kerberosLatencyMs: number;
  certRiskScore: number;
  /** Endpoint detection / EDR posture */
  edrSeverity: "none" | "low" | "medium" | "high" | "critical";
  edrDetections: number;
  /** Patch & compliance gaps */
  patchMissingCritical: number;
  patchCompliancePct: number;
  /** Virtualization / host health */
  hostHealth: HealthLevel;
  anomalies: Anomaly[];
  fsmoRoles: string[];
  lastSeen: string;
}

export interface Anomaly {
  id: string;
  severity: "info" | "warning" | "critical";
  category: string;
  title: string;
  detail: string;
  detectedAt: string;
}

export interface DriftFinding {
  id: string;
  type:
    | "orphaned_ad"
    | "orphaned_entra"
    | "group_mismatch"
    | "disabled_licensed"
    | "attr_drift"
    | "missing_sync";
  severity: "low" | "medium" | "high";
  objectName: string;
  objectType: "user" | "group" | "contact";
  adSide?: string;
  entraSide?: string;
  detail: string;
  detectedAt: string;
}

export interface CertificateAsset {
  id: string;
  name: string;
  kind: "ca" | "template" | "issued";
  caName?: string;
  templateName?: string;
  subject?: string;
  expiresAt: string;
  daysRemaining: number;
  riskScore: number;
  keyLength: number;
  hashAlgorithm: string;
  usage: string[];
  autoenroll: boolean;
  published: boolean;
}

export interface PlaybookDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  platform: "powershell" | "ansible" | "ssh";
  riskLevel: "low" | "medium" | "high";
  script: string;
  requiresApproval: boolean;
  estimatedDuration: string;
}

export interface PlaybookRunSummary {
  id: string;
  playbookId: string;
  playbookName: string;
  targetNodes: string[];
  status: string;
  requestedBy: string;
  approvedBy?: string;
  output?: string;
  scheduledFor?: string;
  createdAt: string;
  completedAt?: string;
}

export interface LiveEvent {
  id: string;
  type: "health" | "anomaly" | "drift" | "cert" | "playbook";
  severity: "info" | "warning" | "critical";
  message: string;
  nodeId?: string;
  timestamp: string;
}

export type AuthMethod = "breakglass" | "active-directory" | "entra" | "saml";

export type SamlProviderId =
  | "entra-saml"
  | "okta"
  | "ping"
  | "onelogin"
  | "google"
  | "generic";
