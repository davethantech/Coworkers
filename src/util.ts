export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts;
  if (d < 45_000) return "just now";
  if (d < 3_600_000) return `${Math.round(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)}h ago`;
  return `${Math.round(d / 86_400_000)}d ago`;
}

export function clock(now: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
}
