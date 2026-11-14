"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Cloud,
  FileKey2,
  GitBranch,
  MapPin,
  Server,
  Shield,
  Workflow,
} from "lucide-react";
import type { GraphNode, HealthLevel, NodeKind } from "@/types";
import { cn } from "@/lib/utils";

const icons: Partial<Record<NodeKind, typeof Server>> = {
  domain_controller: Server,
  site: MapPin,
  trust: GitBranch,
  entra_tenant: Cloud,
  entra_connect: Workflow,
  certificate_authority: FileKey2,
  certificate_template: FileKey2,
  virt_host: Shield,
  virt_cluster: Shield,
};

const healthAccent: Record<HealthLevel, string> = {
  healthy: "var(--signal-healthy)",
  degraded: "var(--signal-amber)",
  critical: "var(--signal-critical)",
  unknown: "var(--signal-muted)",
};

function FabricNodeComponent({ data, selected }: NodeProps) {
  const node = data as GraphNode;
  const Icon = icons[node.kind] ?? Server;
  const accent = healthAccent[node.health] ?? healthAccent.unknown;
  const isDc = node.kind === "domain_controller";

  return (
    <div
      className={cn(
        "relative min-w-[168px] rounded-2xl border px-3.5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all",
        selected ? "scale-[1.03]" : "",
        isDc ? "bg-[rgba(14,22,32,0.95)]" : "bg-[rgba(16,24,34,0.88)]"
      )}
      style={{
        borderColor: selected
          ? "color-mix(in srgb, var(--accent-cyan) 55%, transparent)"
          : `color-mix(in srgb, ${accent} 35%, transparent)`,
        boxShadow: selected
          ? `0 0 0 1px color-mix(in srgb, var(--accent-cyan) 40%, transparent), 0 18px 40px rgba(0,0,0,0.4)`
          : undefined,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-[var(--accent-cyan)]"
      />
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "relative mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl",
            node.health === "critical" && "pulse-ring"
          )}
          style={{
            color: accent,
            background: `color-mix(in srgb, ${accent} 14%, transparent)`,
          }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[13px] font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {node.label}
          </div>
          {node.subtitle ? (
            <div className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
              {node.subtitle}
            </div>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <span
              className="signal-dot"
              style={{ background: accent, color: accent }}
            />
            <span className="font-mono text-[10px] text-[var(--text-secondary)]">
              {node.score}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              {node.health}
            </span>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-[var(--accent-teal)]"
      />
    </div>
  );
}

export const FabricNode = memo(FabricNodeComponent);
