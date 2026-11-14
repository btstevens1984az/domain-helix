import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const variants = {
  primary:
    "bg-[linear-gradient(135deg,var(--accent-teal),var(--accent-cyan))] text-[#041016] hover:brightness-110 shadow-[0_0_24px_var(--glow-cyan)]",
  secondary:
    "bg-white/5 text-[var(--text-primary)] border border-white/10 hover:bg-white/10",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)]",
  danger:
    "bg-[color-mix(in_srgb,var(--signal-critical)_18%,transparent)] text-[var(--signal-critical)] border border-[color-mix(in_srgb,var(--signal-critical)_35%,transparent)] hover:bg-[color-mix(in_srgb,var(--signal-critical)_28%,transparent)]",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: keyof typeof variants;
    size?: keyof typeof sizes;
  }
>(function Button(
  { className, variant = "primary", size = "md", disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
