"use client";

import type { RoleView } from "@/types";
import { cn } from "@/lib/utils";

const roles: { id: RoleView; label: string }[] = [
  { id: "identity_engineer", label: "Identity" },
  { id: "security_analyst", label: "Security" },
  { id: "infrastructure_owner", label: "Infra" },
];

export function RoleSwitcher({
  role,
  onChange,
}: {
  role: RoleView;
  onChange: (role: RoleView) => void;
}) {
  return (
    <div className="flex rounded-xl border border-[var(--border-subtle)] bg-white/[0.03] p-1">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all",
            role === r.id
              ? "bg-[color-mix(in_srgb,var(--accent-cyan)_16%,transparent)] text-[var(--accent-cyan)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
