import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-white/10 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[var(--accent-cyan)]">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-xs text-[var(--text-muted)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
