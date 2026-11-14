import type { ConnectorStatus } from "@/types";

export interface ConnectorContext {
  demoMode: boolean;
  env: NodeJS.ProcessEnv;
}

export interface Connector {
  type: string;
  name: string;
  description: string;
  icon: string;
  isConfigured(ctx: ConnectorContext): boolean;
  getStatus(ctx: ConnectorContext): Promise<ConnectorStatus>;
  /** Optional probe — returns mock or live payload summary */
  probe(ctx: ConnectorContext): Promise<{ ok: boolean; summary: string; data?: unknown }>;
}

export function hasCreds(...values: Array<string | undefined>) {
  return values.every((v) => Boolean(v && v.trim()));
}
