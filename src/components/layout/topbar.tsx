"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Bell, LogOut, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import type { LiveEvent, RoleView } from "@/types";

export function Topbar({
  title,
  subtitle,
  role,
  onRoleChange,
}: {
  title: string;
  subtitle?: string;
  role: RoleView;
  onRoleChange: (role: RoleView) => void;
}) {
  const { data: session } = useSession();
  const [live, setLive] = useState(true);
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const es = new EventSource("/api/stream");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as { events?: LiveEvent[] };
        if (data.events?.length) {
          setEvents((prev) => [...data.events!, ...prev].slice(0, 8));
        }
        setLive(true);
      } catch {
        /* ignore parse errors */
      }
    };
    es.onerror = () => setLive(false);
    return () => es.close();
  }, []);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] px-6 py-4">
      <div>
        <h1
          className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-white/[0.03] px-3 py-1.5 text-[11px] text-[var(--text-secondary)] lg:flex">
          <Radio
            className={`h-3.5 w-3.5 ${live ? "text-[var(--signal-healthy)]" : "text-[var(--signal-critical)]"}`}
          />
          {live ? "Live telemetry" : "Stream reconnecting"}
        </div>

        <RoleSwitcher role={role} onChange={onRoleChange} />

        <div className="relative">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] text-[var(--text-secondary)] hover:bg-white/[0.06]"
            title="Recent events"
          >
            <Bell className="h-4 w-4" />
          </button>
          {events.some((e) => e.severity === "critical") ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--signal-critical)]" />
          ) : null}
        </div>

        <Badge variant="cyan">{session?.user?.email ?? "signed in"}</Badge>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] text-[var(--text-secondary)] hover:bg-white/[0.06]"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
