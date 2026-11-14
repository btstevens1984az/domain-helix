"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cloud,
  FolderTree,
  Package,
  Search,
  Server,
  Shield,
  Ticket,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { useRole } from "@/components/layout/role-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/skeleton";
import type { ConnectorStatus } from "@/types";

const icons: Record<string, typeof Server> = {
  directory: FolderTree,
  cloud: Cloud,
  shield: Shield,
  activity: Activity,
  package: Package,
  server: Server,
  ticket: Ticket,
  search: Search,
};

export default function ConnectorsPage() {
  const { role, setRole } = useRole();
  const [connectors, setConnectors] = useState<ConnectorStatus[] | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [probeMsg, setProbeMsg] = useState<string | null>(null);

  const reload = () =>
    fetch("/api/connectors")
      .then((r) => r.json())
      .then((d) => {
        setConnectors(d.connectors);
        setDemoMode(d.demoMode);
      });

  useEffect(() => {
    reload();
  }, []);

  async function probe(type: string) {
    const res = await fetch("/api/connectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "probe", type }),
    });
    const data = await res.json();
    setProbeMsg(`${type}: ${data.summary}`);
  }

  if (!connectors) return <PageSkeleton />;

  return (
    <div className="flex h-full flex-col">
      <Topbar
        title="Connector Framework"
        subtitle="Extensible integrations with graceful degradation and mock mode"
        role={role}
        onRoleChange={setRole}
      />

      <div className="scrollbar-thin flex-1 overflow-y-auto p-4 md:p-6">
        <Card className="mb-4">
          <CardHeader
            title="Runtime mode"
            description="When credentials are missing or DEMO_MODE=true, DomainHelix serves the Contoso demo fabric"
            action={
              <Badge variant={demoMode ? "amber" : "healthy"}>
                {demoMode ? "demo / mock" : "live"}
              </Badge>
            }
          />
          {probeMsg ? (
            <p className="text-xs text-[var(--accent-cyan)]">{probeMsg}</p>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Probe any connector to verify configuration. ServiceNow and Splunk stubs are ready for
              extension.
            </p>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {connectors.map((c, i) => {
            const Icon = icons[c.icon] ?? Server;
            return (
              <motion.div
                key={c.type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="h-full">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] text-[var(--accent-cyan)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">{c.type}</div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        c.status === "healthy"
                          ? "healthy"
                          : c.status === "degraded"
                            ? "degraded"
                            : c.status === "error"
                              ? "critical"
                              : "default"
                      }
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {c.description}
                  </p>
                  <p className="mt-3 text-[11px] text-[var(--text-muted)]">{c.message}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant={c.mockMode ? "amber" : "cyan"}>
                      {c.mockMode ? "mock" : "live"}
                    </Badge>
                    <Button size="sm" variant="secondary" onClick={() => probe(c.type)}>
                      Probe
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
