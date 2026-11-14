import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatMs(value: number) {
  return `${Math.round(value)} ms`;
}

export function formatGb(value: number) {
  return `${value.toFixed(1)} GB`;
}

export function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function healthColor(level: string) {
  switch (level) {
    case "healthy":
      return "var(--signal-healthy)";
    case "degraded":
      return "var(--signal-amber)";
    case "critical":
      return "var(--signal-critical)";
    default:
      return "var(--signal-muted)";
  }
}

export function downloadBlob(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
