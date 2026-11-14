"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FileKey2,
  GitCompareArrows,
  Network,
  ScrollText,
  Settings,
  Shield,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelixLogo } from "@/components/shared/helix-logo";

const nav = [
  { href: "/graph", label: "Identity Fabric", icon: Network },
  { href: "/health", label: "DC Health", icon: Activity },
  { href: "/drift", label: "AD ↔ Entra Drift", icon: GitCompareArrows },
  { href: "/certificates", label: "Certificates", icon: FileKey2 },
  { href: "/playbooks", label: "Playbooks", icon: Workflow },
  { href: "/reports", label: "Reports", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-strong relative z-20 flex w-[240px] shrink-0 flex-col border-r border-[var(--border-subtle)]">
      <div className="border-b border-[var(--border-subtle)] px-5 py-5">
        <Link href="/graph" className="flex items-center gap-3">
          <HelixLogo className="h-9 w-9" />
          <div>
            <div
              className="text-[15px] font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              DomainHelix
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Hybrid Identity Twin
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all",
                active
                  ? "bg-[color-mix(in_srgb,var(--accent-cyan)_12%,transparent)] text-[var(--accent-cyan)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent-cyan)_25%,transparent)]"
                  : "text-[var(--text-secondary)] hover:bg-white/4 hover:text-[var(--text-primary)]"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-[var(--accent-cyan)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--border-subtle)] p-4">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Shield className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
            Demo fabric
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Contoso hybrid identity demo fabric. Sign-in options and security guidance live in Settings.
          </p>
        </div>
      </div>
    </aside>
  );
}
