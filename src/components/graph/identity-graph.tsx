"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FabricNode } from "@/components/graph/fabric-node";
import type { GraphEdge, GraphNode, IdentityGraph, RoleView } from "@/types";
import { healthColor } from "@/lib/utils";

const nodeTypes = { fabric: FabricNode };

function layoutNodes(nodes: GraphNode[]): Node[] {
  const columns: Record<string, number> = {
    site: 0,
    domain_controller: 1,
    trust: 2,
    entra_connect: 2,
    entra_tenant: 3,
    certificate_authority: 0.5,
    certificate_template: 1.5,
    vmware_cluster: 2.5,
    vmware_host: 3,
    subnet: 0,
  };
  const counters: Record<string, number> = {};

  return nodes.map((n) => {
    const col = columns[n.kind] ?? 1;
    const key = String(col);
    counters[key] = (counters[key] ?? 0) + 1;
    const row = counters[key];
    const jitterX = (n.id.charCodeAt(n.id.length - 1) % 5) * 8;
    return {
      id: n.id,
      type: "fabric",
      position: {
        x: 80 + col * 280 + jitterX,
        y: 40 + row * 120,
      },
      data: { ...n } as Record<string, unknown>,
    };
  });
}

function toFlowEdges(edges: GraphEdge[]): Edge[] {
  return edges.map((e) => {
    const color = healthColor(e.health ?? "unknown");
    const animated = e.kind === "replication" || e.kind === "sync";
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated,
      style: {
        stroke: color,
        strokeWidth: e.kind === "replication" ? 2 : 1.4,
        opacity: 0.85,
      },
      labelStyle: {
        fill: "var(--text-secondary)",
        fontSize: 10,
        fontFamily: "var(--font-mono)",
      },
      labelBgStyle: {
        fill: "rgba(10,16,22,0.85)",
        fillOpacity: 1,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 6,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 16,
        height: 16,
      },
    };
  });
}

function filterByRole(graph: IdentityGraph, role: RoleView): IdentityGraph {
  if (role === "admin" || role === "identity_engineer") return graph;
  if (role === "security_analyst") {
    const keepKinds = new Set([
      "domain_controller",
      "certificate_authority",
      "certificate_template",
      "entra_tenant",
      "trust",
    ]);
    const nodes = graph.nodes.filter((n) => keepKinds.has(n.kind));
    const ids = new Set(nodes.map((n) => n.id));
    return {
      ...graph,
      nodes,
      edges: graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
    };
  }
  // infrastructure_owner
  const keepKinds = new Set([
    "domain_controller",
    "site",
    "vmware_host",
    "vmware_cluster",
    "entra_connect",
  ]);
  const nodes = graph.nodes.filter((n) => keepKinds.has(n.kind));
  const ids = new Set(nodes.map((n) => n.id));
  return {
    ...graph,
    nodes,
    edges: graph.edges.filter((e) => ids.has(e.source) && ids.has(e.target)),
  };
}

export function IdentityGraphView({
  graph,
  role,
  onSelect,
}: {
  graph: IdentityGraph;
  role: RoleView;
  onSelect?: (node: GraphNode | null) => void;
}) {
  const filtered = useMemo(() => filterByRole(graph, role), [graph, role]);
  const initialNodes = useMemo(() => layoutNodes(filtered.nodes), [filtered.nodes]);
  const initialEdges = useMemo(() => toFlowEdges(filtered.edges), [filtered.edges]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setNodes(layoutNodes(filtered.nodes));
    setEdges(toFlowEdges(filtered.edges));
  }, [filtered, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelect?.(node.data as GraphNode);
    },
    [onSelect]
  );

  if (!mounted) {
    return <div className="skeleton h-full min-h-[520px] w-full rounded-[var(--radius-md)]" />;
  }

  return (
    <div className="helix-grid relative h-full min-h-[520px] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[rgba(6,10,14,0.55)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={() => onSelect?.(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        minZoom={0.35}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={28} size={1} color="rgba(120,160,180,0.08)" />
        <MiniMap
          nodeColor={(n) => {
            const health = (n.data as GraphNode)?.health ?? "unknown";
            return healthColor(health);
          }}
          maskColor="rgba(4,8,12,0.7)"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
