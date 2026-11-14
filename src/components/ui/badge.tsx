import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-white/8 text-[var(--text-secondary)] border-white/10",
  healthy: "bg-[color-mix(in_srgb,var(--signal-healthy)_16%,transparent)] text-[var(--signal-healthy)] border-[color-mix(in_srgb,var(--signal-healthy)_35%,transparent)]",
  degraded: "bg-[color-mix(in_srgb,var(--signal-amber)_16%,transparent)] text-[var(--signal-amber)] border-[color-mix(in_srgb,var(--signal-amber)_35%,transparent)]",
  critical: "bg-[color-mix(in_srgb,var(--signal-critical)_16%,transparent)] text-[var(--signal-critical)] border-[color-mix(in_srgb,var(--signal-critical)_35%,transparent)]",
  cyan: "bg-[color-mix(in_srgb,var(--accent-cyan)_14%,transparent)] text-[var(--accent-cyan)] border-[color-mix(in_srgb,var(--accent-cyan)_30%,transparent)]",
  amber: "bg-[color-mix(in_srgb,var(--accent-amber)_14%,transparent)] text-[var(--accent-amber)] border-[color-mix(in_srgb,var(--accent-amber)_30%,transparent)]",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant] ?? variants.default,
        className
      )}
    >
      {children}
    </span>
  );
}
